const extract = require('../services/extract');
const config = require('../services/config');
const express = require('express');
const fs = require('fs');
const path = require('path');
const urlExists = require('url-exists');
const { v4: uuidv4 } = require('uuid');
const request = require('request');
const router = express.Router();

// debug stuff
const debugModule = require('debug');
const info = debugModule('points:info');
const debug = debugModule('points:debug')
const logError = debugModule('points:error')
// debug module basicaly use std error output, we'll use std out
debug.log = console.log.bind(console);
info.log = console.log.bind(console);

// can be used to debug PDAL projections
const writePdalPipelineFile = false;
const tmpFolder = './tmp';

function removeFile(file) {
  fs.unlink(file, (err) => {
    if(err){
      info(err.message);
    }
  })
}

/* GET points listing. */
router.get('/', function(req, res, next) {
  
  let p = req.params;

  let polygon = req.query.poly;
  let source = req.query.source;

  let conf;
  if (source) {
    // source param, to load specific config
     conf = config.getConfig(source);
  } else { // if no source param, we use the fist config
    conf = config.getFirst();
  }

  // handle config error
  if (conf == undefined) {
    var msg = "Bad config: there is not any config";
    var id = 'BAD_REQUEST_NO_CONFIG'
    if (source) {
      msg = 'Bad config for source ' + source;
      id = 'BAD_REQUEST_NO_SOURCE'
    }
    info(msg);
    res.status(400).json({id: id, error: msg});
    return;
  }

  // handle polygon errors
  if (!polygon) {
    const msg = "Bad Request: You must specify a polygon to crops";
    info(msg);
    res.status(400).json({id: 'BAD_REQUEST_NO_POLYGON', error: msg});
    return;
  }

  polygon = polygon.replace(/_/g, ' ');
  polygon_points = polygon.split(',')

  if (polygon_points.length < 3) {
    const msg = "Bad Request: Polygon must have at least 3 points";
    info(msg);
    res.status(400).json({id: 'BAD_REQUEST_BAD_POLYGON', error: msg});
    return;
  }
  // Manage Invalid ring. When First point is not equal to the last point.
  if (polygon_points[0] != polygon_points[polygon_points.length - 1]) {
    polygon += ',' + polygon_points[0]
  }

  // object to store many variables
  const algo = { conf };
  algo.polygon = polygon;
  // compute bounding box
  [algo.x1, algo.x2, algo.y1, algo.y2] = extract.computeBoundingBox(polygon_points);
  debug('bbox: x: ' + algo.x1 + ' to ' + algo.x2 + ' ; y: ' + algo.y1 + ' to ' + algo.y2)

  // compute area
  const area = extract.computeArea(algo.x1, algo.x2, algo.y1, algo.y2);

  // limit on area
  // 0 means no limit
  // const area_limit_in_square_meter = 0;
  const area_limit_in_square_meter = conf.SURFACE_MAX  || 100000;
  if (area_limit_in_square_meter > 0 && area > area_limit_in_square_meter) {
    const msg = 'Bad Request: Area is to big ('+ area + 'm²) ; limit is set to ' + area_limit_in_square_meter + 'm²)';
    info(msg);
    res.status(400).json({id: 'BAD_REQUEST_AREA', error: msg});
    return;
  }

  // create hash
  const hash = extract.computeHash(polygon);
  const date = extract.computeTodayDateFormatted();

	// create file names and url
  algo.filename = 'lidar_x_' + Math.floor(algo.x1) + '_y_' + Math.floor(algo.y1) + '.las';
  algo.storedFileRead = conf.STORE_READ_URL + '/' + date + '/' + hash + '/' + algo.filename;
  algo.storedFileWrite = conf.STORE_WRITE_URL + '/' + date + '/' + hash + '/' + algo.filename;

  algo.storedProcessingRead = conf.STORE_READ_URL + '/' + date + '/' + hash + '/' + algo.filename + ".processing";
  algo.storedProcessingWrite = conf.STORE_WRITE_URL + '/' + date + '/' + hash + '/' + algo.filename + ".processing";

  // RETURN_URL : true: avoid using the response to send the file; upload the file to the store, and redirect the request.
  // RETURN_URL env var: false:  in dev mode, if you don't have S3 file store.
  if (algo.conf.RETURN_URL) {

    // test url existence
    urlExists(algo.storedFileRead, function(err, exists) {
      if (err) {
        next(new Error(err));
      }

      // if file exists send redirect
      if (exists) {
        info('File exist on the store, return URL: ' + algo.storedFileRead);
        res.redirect(algo.storedFileRead);
      } else {

        extractPointCloud1(next, res, algo);
      }
    });

  } else {

    extractPointCloud1(next, res, algo);
  }

});

function extractPointCloud1(next, res, algo) {
  const pivot = algo.conf.PIVOT_THREEJS;
  if (!algo.conf.pivot) {
    debug("request pivot " + algo.conf.PIVOT_THREEJS);
    readFileOrUrl(pivot, err => { next(err)}, function(pivot) {
      algo.conf.pivot = pivot;
      extractPointCloud2(next, res, algo);
    });
  } else {
    debug("re use pivot " + algo.conf.PIVOT_THREEJS);
    extractPointCloud2(next, res, algo);
  }
}

function readFileOrUrl(url, err, callback) {
  if (url.startsWith('http')) {
    request.get(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          var data = body;
          callback(data);
      }else {

        msg = "Cant request url " + url;
        logError(msg)
        err(new Error(msg));
      }
    });
  } else {
    fs.readFile(url, 'utf8', function(error, data){
      if (!error) {
        callback(data);
      } else {

        msg = "Cant read file " + url;
        logError(msg)
        err(new Error(msg));
      }
    });
  }
}

function extractPointCloud2(next, res, algo) {

  if (algo.conf.RETURN_URL) {
    verifyProcessingFileOnStore(next, res, algo);

  } else {
    extractPointCloud3(next, res, algo);
  }
}

function verifyProcessingFileOnStore(next, res, algo) {

  // test process file existence, to see if request is already proceed
  urlExists(algo.storedProcessingRead, function(err, exists) {
    if (err) {
      next(new Error(err));
    }

    // if file exists send 202 to tell user we already have a process doing the job
    if (exists) {
      info('File already being processed, because url exists : ' + algo.storedProcessingRead);

      // read process file, it may contain error
      readFileOrUrl(algo.storedProcessingRead, err => { next(err)}, function(fileContent) {
        processing = JSON.parse(fileContent);
        if (processing.id == "SERVICE_UNAVAILABLE") {

          info('File has been processed with eror : return error 500 Service unavailable');
          res.status(500).json(processing);

          // remove file on the store, so that user can re ask for the file
          extract.spawnS3cmdRM(next, algo.storedProcessingWrite);

        } else {

          res.status(202).json({});
        }
      });
    } else {

      writeProcessingFile(next,res,algo);
    }
  });
}

function writeProcessingFile(next, res, algo) {

  const child = extract.spawnS3cmdPut(next, "./services/process", algo.storedProcessingWrite)

  child.on('close', (code) => {

    res.status(202).json({});
    extractPointCloud3(next, res, algo);
  });
}

function extractPointCloud3(next, res, algo) {

  try {

    // use uniqe id
    const unique_id = uuidv4();
    const newFile = tmpFolder + '/' + unique_id + '-' + algo.filename;

    // compute pdal pipeline file
    const pdalPipelineFilename = tmpFolder + '/' + unique_id + '-pipeline.json';
    const pdalPipelineJSON = extract.computePdalPipeline(algo.conf, algo.polygon, newFile, algo.x1, algo.x2, algo.y1, algo.y2);

    // spawn child process
    const child = extract.spawnPdal((error)=> {
      handleError(error, next, algo);
    }, pdalPipelineJSON, writePdalPipelineFile, pdalPipelineFilename);

    child.on('close', (code) => {

      debug('done');

      if (code == 0) {

        if (algo.conf.RETURN_URL) {

          storeFile(next, newFile, algo.storedFileWrite);
        } else {

          sendFileInTheResponse(res, newFile, algo.filename);
        }
      }
    });

  } catch(error) {
    handleError(error, next,algo);
  }


}

function handleError(error, next, algo) {
  // put this internal error on the S3 processing file
  if (algo.RETURN_URL) {
    logError(error);
    const child = extract.spawnS3cmdPut(next, "./services/processError", algo.storedProcessingWrite);
  } else {
    next(error);
  }
}

function storeFile(next, newFile, storedFileWrite) {

  const child = extract.spawnS3cmdPut(next, newFile, storedFileWrite);

  child.on('close', (code) => {

    removeFile(newFile);

    debug('done');
  });

}

function sendFileInTheResponse(res, newFile, filename) {

  const outputFile = path.resolve(__dirname, '../' + newFile);
  res.setHeader('Content-disposition', 'attachment; filename=' + filename);

  info('send:', newFile);
  res.sendFile(outputFile, {}, function (err) {

    if(err){
      info(err.message);
    }

    removeFile(newFile);
  });
}

module.exports = router;
