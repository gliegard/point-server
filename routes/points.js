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

const eptFolder = '/media/data/EPT_SUD_Vannes';
// const eptFolder = '/media/store-idi1/guillaume/EPT_56';

const eptFilename = eptFolder + '/EPT_4978/ept.json';
const pivotFile = eptFolder + '/metadata/pivotTHREE.json';

// 0 means no limit
// const area_limit_in_square_meter = 0;
const area_limit_in_square_meter = 100000;

/* GET points listing. */
router.get('/', function(req, res, next) {
  
  let p = req.params;

  let polygon = req.query.poly;
  if (!polygon) {
    console.log("Bad Request: You must specify a polygon to crops")
    res.status(400).send('Bad Request: You must specify a polygon to crop\n');
    return;
  }

  polygon = polygon.replace(/_/g, ' ');
  polygon_points = polygon.split(',')

  if (polygon_points.length < 3) {
    console.log("Bad Request: Polygon must have at least 3 points")
    res.status(400).send("Bad Request: Polygon must have at least 3 points\n");
    return;
  }
  // Manage Invalid ring. When First point is not equal to the last point.
  if (polygon_points[0] != polygon_points[polygon_points.length - 1]) {
    polygon += ',' + polygon_points[0]
  }

  // compute bounding box
  const first_point = polygon_points[0].split(' ');
  var x1 = parseFloat(first_point[0]);
  var x2 = x1;
  var y1 = parseFloat(first_point[1]);
  var y2 = y1;
  var num_points = polygon_points.length;
  for (var i = 1; i < num_points; i++) {
    const coord = polygon_points[i].split(' ');
    const x = parseFloat(coord[0]);
    const y = parseFloat(coord[1]);
    // console.log(x, y);
    if (isNaN(x) || isNaN(y)) {
      console.log('continue')
      continue;
    }

    x1 = Math.min(x1, x);
    x2 = Math.max(x2, x);
    y1 = Math.min(y1, y);
    y2 = Math.max(y2, y);
  }
  console.log('bbox: x: ' + x1 + ' to ' + x2 + ' ; y: ' + y1 + ' to ' + y2)

  // compute area
  const deltaX = Math.floor(x2 - x1);
  const deltaY = Math.floor(y2 - y1);
  var area = Math.floor(deltaX * deltaY);
  console.log('area: ' + deltaX + 'm * ' + deltaY + 'm = ' + area + ' m²');

  // limit on area
  if (area_limit_in_square_meter > 0 && area > area_limit_in_square_meter) {
    const msg = 'Bad Request: Area is to big ('+ area + 'm²) ; limit is set to ' + area_limit_in_square_meter + 'm²)';
    console.log(msg);
    res.status(400).send(msg + '\n');
    return;
  }

  let c1 = new itowns.Coordinates('EPSG:2154', +(x1), +(y1), -100).as('EPSG:4978');
  let c2 = new itowns.Coordinates('EPSG:2154', +(x2), +(y2), 1000).as('EPSG:4978');
  // console.log(c1);
  // console.log(c2);

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
  const pdalPipeline = template({eptFilename, bounds, matrixTransformation, polygon });
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
