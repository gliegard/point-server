const extract = require('../services/extract');
var express = require('express');
const fs = require('fs');
const { spawnSync, execSync } = require('child_process');
const path = require('path');

const { v4: uuidv4 } = require('uuid');

var router = express.Router();

// debug stuff
var debugModule = require('debug');
var info = debugModule('points:info');
var debug = debugModule('points:debug')
// debug module basicaly use std error output, we'll use std out
debug.log = console.log.bind(console);
info.log = console.log.bind(console);

const eptFilename = process.env.EPT_JSON || '/media/data/EPT_SUD_Vannes/EPT_4978/ept.json';
const pivotFile = process.env.PIVOT_THREEJS  || '/media/data/EPT_SUD_Vannes/metadata/pivotTHREE.json';

// Return URL, avoid using the response to send the file; upload the file to the store, and redirect the request
const returnUrlString = process.env.RETURN_URL || 'true';
const returnUrl = returnUrlString === 'true';

const storeWriteUrl = process.env.STORE_WRITE_URL;
const storeReadUrl = process.env.STORE_READ_URL;

var pivotJson;

function init() {
  extract.init(pivotFile);
}

init();

// 0 means no limit
// const area_limit_in_square_meter = 0;
const area_limit_in_square_meter = process.env.SURFACE_MAX  || 100000;


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
  let [x1, x2, y1, y2] = extract.computeBoundingBox(polygon_points);
  debug('bbox: x: ' + x1 + ' to ' + x2 + ' ; y: ' + y1 + ' to ' + y2)

  // compute area
  const area = extract.computeArea(x1, x2, y1, y2);

  // limit on area
  if (area_limit_in_square_meter > 0 && area > area_limit_in_square_meter) {
    const msg = 'Bad Request: Area is to big ('+ area + 'm²) ; limit is set to ' + area_limit_in_square_meter + 'm²)';
    info(msg);
    res.status(400).send(msg + '\n');
    return;
  }

  // create hash
  const hash = extract.computeHash(polygon);

  // create current date
  const date = extract.computeTodayDateFormatted();

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

  // use uniqe id
  const unique_id = uuidv4();

  // create tmp folder
  const tmpFolder = './tmp/' + unique_id;
  debug('create tmp folder : ' + tmpFolder);
  fs.mkdirSync(tmpFolder, { recursive: true })

  const outFile = tmpFolder + '/' + filename;

  // compute pdal pipeline file
  pdalPipeline = extract.computePdalPipeline(eptFilename, pivotJson, polygon, outFile, x1, x2, y1, y2);

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

    // Send the file
    const outputFile = path.resolve(__dirname, '../' + outFile);
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);

    info('send:', outFile);
    res.sendFile(outputFile, {}, function (err) {

      if(err){
        info(err.message);
      }

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
