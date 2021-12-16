require('../services/itowns-common');
var express = require('express');
const proj4 = require('proj4');
const itowns = require('itowns');
const fs = require('fs');
const THREE = require('three');
const parse = require('json-templates');
const jsonPdalTemplate = require('../services/pdalPipelineTemplate.json');
const { spawnSync, execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const template = parse(jsonPdalTemplate);

var router = express.Router();

// TODO: Maybe use Winston to log
var debugModule = require('debug');
// info log the result of the request
var info = debugModule('points:info');
// debug is only used to debug !
var debug = debugModule('points:debug')
// debug module basicaly use std error output, we'll use std out
debug.log = console.log.bind(console);
info.log = console.log.bind(console);

proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

const eptFilename = process.env.EPT_JSON || '/media/data/EPT_SUD_Vannes/EPT_4978/ept.json';
const pivotFile = process.env.PIVOT_THREEJS  || '/media/data/EPT_SUD_Vannes/metadata/pivotTHREE.json';

// Return URL, avoid using the response to send the file; upload the file to the store, and redirect the request
const returnUrl = process.env.RETURN_URL || true;
const storeWriteUrl = process.env.STORE_WRITE_URL;
const storeReadUrl = process.env.STORE_READ_URL;

// 0 means no limit
// const area_limit_in_square_meter = 0;
const area_limit_in_square_meter = process.env.SURFACE_MAX  || 100000;


function computeBoundingBox(polygon_points) {
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
    // debug(x, y);
    if (isNaN(x) || isNaN(y)) {
      continue;
    }

    x1 = Math.min(x1, x);
    x2 = Math.max(x2, x);
    y1 = Math.min(y1, y);
    y2 = Math.max(y2, y);
  }

  return [x1, x2, y1, y2];
}

function computeArea(x1, x2, y1, y2) {
  const deltaX = Math.floor(x2 - x1);
  const deltaY = Math.floor(y2 - y1);
  const area = Math.floor(deltaX * deltaY);
  debug('area: ' + deltaX + 'm * ' + deltaY + 'm = ' + area + ' m²');
  return area;
}

function computePdalPipeline(polygon, outFile, x1, x2, y1, y2) {
  let c1 = new itowns.Coordinates('EPSG:2154', +(x1), +(y1), -100).as('EPSG:4978');
  let c2 = new itowns.Coordinates('EPSG:2154', +(x2), +(y2), 1000).as('EPSG:4978');
  // debug(c1);
  // debug(c2);

  const pivotJson = fs.readFileSync(pivotFile, {encoding:'utf8', flag:'r'});

  // debug(pivotJson);
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
  // debug(bounds);

  // create pdal pipeline in Json
  const pdalPipeline = template({eptFilename, bounds, matrixTransformation, polygon, outFile });
  return pdalPipeline;
}

/* GET points listing. */
router.get('/', function(req, res, next) {
  
  let p = req.params;

  let polygon = req.query.poly;

  if (!polygon) {
    info("Bad Request: You must specify a polygon to crops")
    res.status(400).send('Bad Request: You must specify a polygon to crop\n');
    return;
  }

  polygon = polygon.replace(/_/g, ' ');
  polygon_points = polygon.split(',')

  if (polygon_points.length < 3) {
    info("Bad Request: Polygon must have at least 3 points")
    res.status(400).send("Bad Request: Polygon must have at least 3 points\n");
    return;
  }
  // Manage Invalid ring. When First point is not equal to the last point.
  if (polygon_points[0] != polygon_points[polygon_points.length - 1]) {
    polygon += ',' + polygon_points[0]
  }

  // compute bounding box
  let [x1, x2, y1, y2] = computeBoundingBox(polygon_points);
  debug('bbox: x: ' + x1 + ' to ' + x2 + ' ; y: ' + y1 + ' to ' + y2)

  // compute area
  const area = computeArea(x1, x2, y1, y2);

  // limit on area
  if (area_limit_in_square_meter > 0 && area > area_limit_in_square_meter) {
    const msg = 'Bad Request: Area is to big ('+ area + 'm²) ; limit is set to ' + area_limit_in_square_meter + 'm²)';
    info(msg);
    res.status(400).send(msg + '\n');
    return;
  }

  // create hash
  const md5sum = crypto.createHash('md5');
  md5sum.update(polygon);
  const hash = md5sum.digest('hex');

  // create current date
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

	// check if file exist in the cache
  const filename = 'lidar_x_' + x1 + '_y_' + y1 + '.las';

  const storedFile = storeReadUrl + '/' + date + '/' + hash + '/' + filename;

  if (returnUrl) {

    // test file existence on the store
    const wget = 'wget --spider ' + storedFile;
    debug('call wget subprocess : ' + wget);
    const ret = spawnSync('wget', ['--spider', storedFile]);
    if (ret.error) {
      console.log('Error', ret.error);
      throw new Error(ret.error);
    }

    // if file exist, return the URL
    if (ret.status == 0) {
      info('File exist on the store, return URL: ' + storedFile);
      res.redirect(storedFile);
      return
    }
  }

  // create tmp folder
  const tmpFolder = './tmp/' + hash;
  debug('create tmp folder : ' + tmpFolder);
  fs.mkdirSync(tmpFolder, { recursive: true })

  const outFile = tmpFolder + '/' + filename;

  // compute pdal pipeline file
  pdalPipeline = computePdalPipeline(polygon, outFile, x1, x2, y1, y2);
  const pdalPipeline_File = tmpFolder + '/pipeline.json';
  fs.writeFileSync(pdalPipeline_File, JSON.stringify(pdalPipeline, null, 2));

  // call PDAL to extract pointcloud
  const comand = 'pdal pipeline -i ' + pdalPipeline_File;
  debug('call pdal subprocess : ' + comand);
  try {
    
    execSync(comand);  
  } catch (err){

    // Handle 'pdal not found' error
    if (err.message.indexOf('pdal: not found') > 0) {
      const tips = 'To fix: conda-activate point-server, before launching the server, to have pdal in the path';
      err.message += tips;
      info(tips);
    }

    // remove tmp folder
    fs.rm(tmpFolder, { recursive:true }, (err) => {
      if(err){
        info(err.message);
      }
    })

    throw new Error(err);
  }
  debug('done');

  if (returnUrl) {

    // put file on the S3 store
    const s3cmd = 's3cmd put ' + outFile + ' ' + storeWriteUrl + '/' + date + '/' + hash + '/' + filename;
    debug('call aws subprocess : ' + s3cmd);
    try {
      execSync(s3cmd);
    } catch (err){

      throw new Error(err);
    } finally {

      // remove tmp folder
      fs.rm(tmpFolder, { recursive:true }, (err) => {
        if(err){
          info(err.message);
        }
      })

    }
    debug('done');

    info('Return URL: ' + storedFile);
    res.redirect(storedFile);

  } else {

    // store the file in a cache
    storeTheFile(outFile, date, hash, filename);

    // Send the file
    const outputFile = path.resolve(__dirname, '../' + outFile);
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);

    info('send:', outFile);
    res.sendFile(outputFile, {}, function (err) {

      // remove tmp folder
      fs.rm(tmpFolder, { recursive:true }, (err) => {
        if(err){
            info(err.message);
        }
      })

    });

  }



});

module.exports = router;
