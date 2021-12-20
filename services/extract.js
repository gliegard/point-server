// pdal pipeline template helper
const parse = require('json-templates');
const jsonPdalTemplate = require('./pdalPipelineTemplate.json');
const template = parse(jsonPdalTemplate);

// 3d stuff
require('../services/itowns-common');
const itowns = require('itowns');
const THREE = require('three');

const crypto = require('crypto');
const fs = require('fs');
var debug = require('debug')('extract:debug');

// proj4 hard coded default proj
const proj4 = require('proj4');
proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');
proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");


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
  

function computePdalPipeline(eptFilename, pivotFile, polygon, outFile, x1, x2, y1, y2) {
    let c1 = new itowns.Coordinates('EPSG:2154', +(x1), +(y1), -100).as('EPSG:4978');
    let c2 = new itowns.Coordinates('EPSG:2154', +(x2), +(y2), 1000).as('EPSG:4978');
    // debug(c1);
    // debug(c2);
  
    // read Pivot from file
    const pivotJson = fs.readFileSync(pivotFile, {encoding:'utf8', flag:'r'});
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

  module.exports = {
    computeBoundingBox,
    computeArea,
    computeHash,
    computeTodayDateFormatted,
    computePdalPipeline
  }