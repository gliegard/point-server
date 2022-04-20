// pdal pipeline template helper
const parse = require('json-templates');
const jsonPdalTemplate = require('./pdalPipelineTemplate.json');
const { spawn } = require('child_process');

// 3d stuff
require('../services/itowns-common');
const itowns = require('itowns');
const THREE = require('three');

const crypto = require('crypto');
const fs = require('fs');

const debug = require('debug')('point-extract:debug');
const info = require('debug')('point-extract:info');

// proj4 hard coded default proj
const proj4 = require('proj4');
proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:2154','+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// read conf.pivot
// write conf.mat
// write conf.matrixTransformation
function initMatrix(conf) {
  if (conf.mat) {
    // debug('matrix already loaded, nothing to do');
    return;
  }

  // write conf.mat
  const pivot = JSON.parse(conf.pivot);
  const array = pivot["object"]["matrix"];
  conf.mat = new THREE.Matrix4().fromArray(array);

  // create matrixTransformation for pdal pipeline
  conf.matrixTransformation = conf.mat.clone().transpose().toArray().toString().replace(/,/g, ' ');
  conf.mat.invert();
  debug('matrix loaded');
}

function computeBoundingBox(polygon_points) {
  const first_point = polygon_points[0].split(' ');
  let x1 = parseFloat(first_point[0]);
  let x2 = x1;
  let y1 = parseFloat(first_point[1]);
  let y2 = y1;
  const num_points = polygon_points.length;
  for (let i = 1; i < num_points; i++) {
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
  return md5sum.digest('hex');
}

function computeTodayDateFormatted() {
  const today = new Date();
  return today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
}

function computePdalPipeline(conf, polygon, outFile, x1, x2, y1, y2) {
  let c1 = new itowns.Coordinates('EPSG:2154', x1, y1, -100).as('EPSG:4978');
  let c2 = new itowns.Coordinates('EPSG:2154', x2, y2, 1000).as('EPSG:4978');
  // debug(c1);
  // debug(c2);

  initMatrix(conf);
  c1.applyMatrix4(conf.mat);
  c2.applyMatrix4(conf.mat);

  // create bounds in for pdal pipeline
  const bounds = '([' + Math.min(c1.x, c2.x) + ', ' + Math.max(c1.x, c2.x) + '], ['
      + Math.min(c1.y, c2.y) + ', ' + Math.max(c1.y, c2.y) + '], ['
      + Math.min(c1.z,c2.z) + ', ' + Math.max(c1.z, c2.z) + '])';
  // debug(bounds);

  // create pdal pipeline in Json
  const template2 = parse(jsonPdalTemplate);
  const pdalPipeline = template2({eptFilename: conf.ept, bounds, matrixTransformation: conf.matrixTransformation, polygon, outFile });
  return JSON.stringify(pdalPipeline, null, 2)
}

function spawnPdal(next, pdalPipelineJSON, writePdalPipelineFile, pdalPipelineFilename) {
  let args = ['pipeline', '-s'];
  if (writePdalPipelineFile) {
    debug('Write PDAL pipeline file on the disk');
    fs.writeFileSync(pdalPipelineFilename, pdalPipelineJSON);

    args = ['pipeline', '-i', pdalPipelineFilename];
  }
  // call PDAL to extract pointcloud
  debug('call pdal subprocess : pdal ' + args);
  const child = spawn('pdal', args);

  child.stderr.on('data', (data) => {
    next(new Error('PDAL error: ' + data));
  });

  child.on('error', (err) => {
    info('Failed to start PDAL subprocess.' + err.message);

    // Handle 'pdal not found' error
    if (err.message.indexOf('ENOENT') > 0) {
      const tips = ' To fix: conda-activate point-server, before launching the server, to have pdal in the path';
      err.message += tips;
      info(tips);
    }

    next(err);
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

module.exports = {
  computeBoundingBox,
  computeArea,
  computeHash,
  computeTodayDateFormatted,
  computePdalPipeline,
  spawnPdal
};
