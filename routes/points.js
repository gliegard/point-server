const extract = require('../services/extract');
const config = require('../services/config');
const storeS3 = require("../services/storeS3");
const express = require('express');
const fs = require('fs');
const path = require('path');
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

function verifySource(conf, source) {
  return new Promise((resolve, reject) => {
    let datasets = config.global.DATASETS;
    if (datasets && datasets.length)
      datasets.includes(source) ? resolve() : reject();
    else {
      storeS3.listFolders(conf.S3_DATA_BUCKET, conf.S3_DATA_FOLDER)
        .then(folders => folders.includes(source) ? resolve() : reject())
        .catch(err => {
          logError(err);
          reject();
        });
    }
  });
}

/* GET points listing. */
router.get('/', function(req, res, next) {
  // source param, to load specific config
  let source = req.query.source;
  let conf = config.bySource[source];

  // handle config error
  if (!conf.EPT_JSON || !conf.PIVOT_THREEJS) {
    let msg = "Bad config: there is not any config";
    let id = 'BAD_REQUEST_NO_CONFIG';
    if (source) {
      msg = 'Bad config for source ' + source;
      id = 'BAD_REQUEST_NO_SOURCE'
    }
    info(msg);
    res.status(400).json({id: id, error: msg});
    return;
  }

  // handle unknown source
  verifySource(conf, source)
    .then(() => handleRequest(req, res, next, conf, source))
    .catch(() => res.status(400).json({id: 'BAD_REQUEST_UNKNOWN_SOURCE', error: 'Unknown data source: ' + source}));
});

function handleRequest(req, res, next, conf, source) {
  // handle polygon errors
  let polygon = req.query.poly;
  if (!polygon) {
    const msg = "Bad Request: You must specify a polygon to crops";
    info(msg);
    res.status(400).json({id: 'BAD_REQUEST_NO_POLYGON', error: msg});
    return;
  }

  polygon = polygon.replace(/_/g, ' ');
  let polygon_points = polygon.split(',')

  if (polygon_points.length < 3) {
    const msg = "Bad Request: Polygon must have at least 3 points";
    info(msg);
    res.status(400).json({id: 'BAD_REQUEST_BAD_POLYGON', error: msg});
    return;
  }
  // Manage Invalid ring. When First point is not equal to the last point.
  if (polygon_points[0] !== polygon_points[polygon_points.length - 1]) {
    polygon += ',' + polygon_points[0]
  }

  // format ept & pivot urls
  conf.ept = "ept://" + config.formatDatasetURL(conf.EPT_JSON, source);
  conf.pivot_file = config.formatDatasetURL(conf.PIVOT_THREEJS, source);

  // object to store many variables
  /**
   * @type {{
   *   conf: Config;
   *   polygon: string;
   *   x1?: number;
   *   x2?: number;
   *   y1?: number;
   *   y2?: number;
   *   filename?: string;
   *   storedFile?: string;
   *   processFile?: string;
   * }}
   */
  const algo = { conf, polygon };
  // compute bounding box
  [algo.x1, algo.x2, algo.y1, algo.y2] = extract.computeBoundingBox(polygon_points);
  debug('bbox: x: ' + algo.x1 + ' to ' + algo.x2 + ' ; y: ' + algo.y1 + ' to ' + algo.y2)

  // compute area
  const area = extract.computeArea(algo.x1, algo.x2, algo.y1, algo.y2);

  // limit on area
  // 0 means no limit
  // const area_limit_in_square_meter = 0;
  const area_limit_in_square_meter = algo.conf.SURFACE_MAX || 100000;
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
  const fullPathFile = "/" + date + '/' + hash + '/' + algo.filename;

  algo.storedFile = algo.conf.S3_RESULT_FOLDER + fullPathFile;
  algo.processFile = algo.storedFile + ".processing";
  // RETURN_URL : true: avoid using the response to send the file; upload the file to the store, and redirect the request.
  // RETURN_URL env var: false:  in dev mode, if you don't have S3 file store.
  if (algo.conf.RETURN_URL) {
    info('check if file exists on the store: ' + algo.storedFile);
    storeS3.checkFile(algo.conf.S3_RESULT_BUCKET, algo.storedFile)
      .then(exists => {
        if (exists) {
          const redirectFile = algo.conf.DOWNLOAD_URL + fullPathFile
          info('File exist on the store, return URL: ' + redirectFile);
          res.redirect(redirectFile);
        } else
          extractPointCloud1(next, res, algo);
      })
      .catch(err => {
        console.error("Internal error: " + err);
        next(err);
      });
  } else
    extractPointCloud1(next, res, algo);
}

function extractPointCloud1(next, res, algo) {
  const pivot = algo.conf.pivot_file;
  if (!algo.conf.pivot) {
    debug("request pivot " + algo.conf.pivot_file);
    readFileOrUrl(pivot, next, function(pivot) {
      algo.conf.pivot = pivot;
      extractPointCloud2(next, res, algo);
    });
  } else {
    // debug("re use pivot " + algo.conf.PIVOT_THREEJS);
    extractPointCloud2(next, res, algo);
  }
}

function readFileOrUrl(url, err, callback) {
  if (url.startsWith('http')) {
    request.get(url, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(body);
      } else {
        let msg = "Cant request url " + url;
        logError(msg)
        err(new Error(msg));
      }
    });
  } else {
    fs.readFile(url, 'utf8', function(error, data){
      if (!error) {
        callback(data);
      } else {
        let  msg = "Cant read file " + url;
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
  storeS3.getFile(algo.conf.S3_RESULT_BUCKET, algo.processFile)
    .then(file => {
      if (file) {
        info('Request is already being processed, because .process file exists : ' + algo.processFile);

        // in case of error during file processing, we store 1 in the .process file.
        if (file.ContentLength > 0) {
          // remove file on the store, so that user can ask for the file again
          info('Remove .process file on the store: ' + algo.processFile);
          storeS3.removeFile(algo.conf.S3_RESULT_BUCKET, algo.processFile)
            .catch(logError)
            .finally(() => {
              // return error to the user
              info('File has been processed with eror : return error 500 Service unavailable');
              res.status(500).json({ id: 'SERVICE_UNAVAILABLE', error: 'Service Unavailable' });
            });
        } else
          res.status(202).json({});
      } else {
        info("Process file doest not exist");
        writeProcessingFileAndExtractPointCloud(next, res, algo);
      }
    })
    .catch(err => {
      console.error("Internal error: " + err);
      next(new Error(err));
    });
}

function writeProcessingFileAndExtractPointCloud(next, res, algo) {
  info("Try to upload process file : "+ algo.processFile);
  storeS3.setFile(algo.conf.S3_RESULT_BUCKET, algo.processFile).catch(logError).finally(() => {
    info("Process file uploaded !!");
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
      debug('PDAL have created the file !');
      if (code === 0) {
        if (algo.conf.RETURN_URL)
          storeFile(next, newFile, algo);
        else
          sendFileInTheResponse(res, newFile, algo.filename);
      }
    });
  } catch(error) {
    handleError(error, next, algo);
  }
}

function handleError(error, next, algo) {
  // put this internal error on the S3 processing file
  try {
    if (algo.conf.RETURN_URL) {
      logError(error);
      storeS3.setFile(algo.conf.S3_RESULT_BUCKET, algo.processFile, "1");
    } else {
      next(error);
    }
  } catch(err) {
    next(err);
  }
}

function storeFile(next, newFile, algo) {
  storeS3.setFile(algo.conf.S3_RESULT_BUCKET, algo.storedFile, fs.readFileSync(newFile))
    .then(() => {
      removeFile(newFile);
      debug('File stored on the store :' + algo.storedFile);
    })
    .catch(err => handleError(err, next, algo));
}

function sendFileInTheResponse(res, newFile, filename) {
  const outputFile = path.resolve(__dirname, '../' + newFile);
  res.setHeader('Content-disposition', 'attachment; filename=' + filename);

  info('send file in response:', newFile);
  res.sendFile(outputFile, {}, function (err) {
    if (err)
      info(err.message);
    removeFile(newFile);
  });
}

module.exports = router;
