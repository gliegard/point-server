require('../services/itowns-common');
var express = require('express');
const proj4 = require('proj4');
const itowns = require('itowns');
const fs = require('fs');
const THREE = require('three');
const parse = require('json-templates');
const jsonPdalTemplate = require('../services/pdalPipelineTemplate.json');
const { spawn, exec, execSync } = require('child_process');
const path = require('path');

const template = parse(jsonPdalTemplate);

var router = express.Router();

proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

/* GET points listing. */
router.get('/:x1/:x2/:y1/:y2', function(req, res, next) {
  
  let p = req.params;

  console.log('-- new request');
  console.log(p);

  let polygon = req.query.poly;
  if (!polygon) {
    console.log("Error: You must specify a polygon to crops")
    res.send("Error: You must specify a polygon to crop");
    return;
  }

  polygon = polygon.replace(/_/g, ' ');
  // console.log(polygon);

  let c1 = new itowns.Coordinates('EPSG:2154', +(p.x1), +(p.y1), -100).as('EPSG:4978');
  let c2 = new itowns.Coordinates('EPSG:2154', +(p.x2), +(p.y2), 1000).as('EPSG:4978');
  // console.log(c1);
  // console.log(c2);

  // const pivotFile = '/media/data/EPT_SUD_Vannes/metadata/pivotTHREE.json';
  const pivotFile =  '/media/store-idi1/guillaume/EPT_56/metadata/pivotTHREE.json';
  const pivotJson = fs.readFileSync(pivotFile, {encoding:'utf8', flag:'r'});

  // console.log(pivotJson);
  pivot = JSON.parse(pivotJson);  
    
  const array = pivot["object"]["matrix"];
  const mat = new THREE.Matrix4().fromArray(array);

  // create matrix for pdal pipeline
  const matrixTransformation = mat.clone().transpose().toArray().toString().replace(/,/g, ' ');
    
  mat.invert();
  c1.applyMatrix4(mat);
  c2.applyMatrix4(mat);

  // create bounds in for pdal pipeline
  const bounds = '([' + Math.min(c1.x, c2.x) + ', ' + Math.max(c1.x, c2.x) + '], [' 
      + Math.min(c1.y, c2.y) + ', ' + Math.max(c1.y, c2.y) + '], [' 
      + Math.min(c1.z,c2.z) + ', ' + Math.max(c1.z, c2.z) + '])';
  // console.log(bounds);

  // create pdal pipeline in Json
  const pdalPipeline = template({ bounds, matrixTransformation, polygon });
  // console.log(pdalPipeline);

  // Generate pdal pipeline file
  const pdalPipeline_File = 'pipeline.json';
  fs.writeFileSync(pdalPipeline_File, JSON.stringify(pdalPipeline, null, 2));

  console.log('call pdal... ');
  try {
    execSync('pdal pipeline -i pipeline.json');  
  } catch (err){

    // Handle 'pdal not found' error
    if (err.message.indexOf('pdal: not found') > 0) {
      const tips = 'To fix: conda-activate point-server, before launching the server, to have pdal in the path';
      err.message += tips;
      console.log(tips);
    }
    throw new Error(err);
  }

  // TODO: Use correct filename for the user
  // const filename = "export_" + Math.floor(p.x1) + "_" + Math.floor(p.y1) + ".las";

  console.log('send file: output.lat');
  const outputFile = path.resolve(__dirname, '../output.las');
  res.setHeader('Content-disposition', 'attachment; filename=output.las');
  res.sendFile(outputFile);
});

module.exports = router;
