// pdal pipeline template helper
const parse = require('json-templates');
const jsonPdalTemplate = require('./pdalPipelineTemplate.json');
const template = parse(jsonPdalTemplate);
const { spawn } = require('child_process');

// 3d stuff
require('../services/itowns-common');
const itowns = require('itowns');
const THREE = require('three');

const crypto = require('crypto');
const fs = require('fs');

var debug = require('debug')('point-extract:debug');
var info = require('debug')('point-extract:info');

// proj4 hard coded default proj
const proj4 = require('proj4');
proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// THREE JS matrix used as pivot
var mat;
var matrixTransformation;

function init(pivotFile) {
  fs.readFile(pivotFile, 'utf8' , (err, data) => {
    if (err) {
      console.error(err);
      return
    }

    initMatrix(data);
    debug('martix loaded');
  })
}

function initMatrix(pivotJson) {
  const pivot = JSON.parse(pivotJson);

  const array = pivot["object"]["matrix"];
  mat = new THREE.Matrix4().fromArray(array);

  // create matrix for pdal pipeline
  matrixTransformation = mat.clone().transpose().toArray().toString().replace(/,/g, ' ');
  mat.invert();
}


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

function computeHash(polygon) {
  const md5sum = crypto.createHash('md5');
  md5sum.update(polygon);
  const hash = md5sum.digest('hex');
  return hash;
}

function computeTodayDateFormatted() {
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  return date;
}
  

function computePdalPipeline(eptFilename, polygon, outFile, x1, x2, y1, y2) {
    let c1 = new itowns.Coordinates('EPSG:2154', +(x1), +(y1), -100).as('EPSG:4978');
    let c2 = new itowns.Coordinates('EPSG:2154', +(x2), +(y2), 1000).as('EPSG:4978');
    // debug(c1);
    // debug(c2);

    c1.applyMatrix4(mat);
    c2.applyMatrix4(mat);
  
    // create bounds in for pdal pipeline
    const bounds = '([' + Math.min(c1.x, c2.x) + ', ' + Math.max(c1.x, c2.x) + '], ['
        + Math.min(c1.y, c2.y) + ', ' + Math.max(c1.y, c2.y) + '], ['
        + Math.min(c1.z,c2.z) + ', ' + Math.max(c1.z, c2.z) + '])';
    // debug(bounds);
  
    // create pdal pipeline in Json
    const pdalPipeline = template({eptFilename, bounds, matrixTransformation, polygon, outFile });
    return JSON.stringify(pdalPipeline, null, 2)
  }

  function spawnPdal(next, pdalPipelineJSON, writePdalPipelineFile, pdalPipelineFilename) {
    var args = ['pipeline', '-s'];
    if (writePdalPipelineFile) {
      debug('Write PDAL pipeline file on the disk');
      fs.writeFileSync(pdalPipelineFilename, pdalPipelineJSON);

      args = ['pipeline', '-i', pdalPipelineFilename];
    }
    // call PDAL to extract pointcloud
    debug('call pdal subprocess : pdal ' + args);
    const child = spawn('pdal', args);

    child.stderr.on('data', (data) => {
      next(new Error(data));
    });

    child.on('error', (err) => {

      info('Failed to start PDAL subprocess.' + err.message);

      // Handle 'pdal not found' error
      if (err.message.indexOf('ENOENT') > 0) {
        const tips = ' To fix: conda-activate point-server, before launching the server, to have pdal in the path';
        err.message += tips;
        info(tips);
      }

      next(new Error(err));
    });

    if (!writePdalPipelineFile) {
      child.stdin.setEncoding('utf-8');
      child.stdin.cork();
      child.stdin.write(pdalPipelineJSON);
      child.stdin.uncork();
      child.stdin.end();
    }

    return child;
  }


function spawnS3cmdPut(next, newFile, storedFileWrite) {

  const args = ['put', newFile, storedFileWrite]
  debug('call s3cmd subprocess : s3cmd ' + args);
  const child = spawn('s3cmd', args);

  child.stderr.on('data', (data) => {
    next(new Error(data));
  });

  child.on('error', (err) => {
    info('Failed to start S3CMD subprocess.' + err.message);
    next(new Error(err));
  });

  return child;
}

function spawnWget(next, storedFileRead) {

  const child = spawn('wget', ['--spider', storedFileRead]);

  child.stderr.on('data', (data) => {
    next(new Error(data));
  });

  child.on('error', (err) => {
    info('Failed to start Wget subprocess.' + err.message);
    next(new Error(err));
  });

  return child;
}

  module.exports = {
    init,
    computeBoundingBox,
    computeArea,
    computeHash,
    computeTodayDateFormatted,
    computePdalPipeline,
    spawnPdal,
    spawnS3cmdPut,
  }