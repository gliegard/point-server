const express = require('express');
const router = express.Router();
const config = require('../services/config');
const storeS3 = require('../services/storeS3');

router.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

router.get('/datasets', (req, res, next) => {
  if (config.global.DATASETS && config.global.DATASETS.length)
    res.status(200).json(config.global.DATASETS);
  else
    storeS3.listFolders(config.global.S3_DATA_BUCKET, config.global.S3_DATA_FOLDER)
      .then(datasets => res.status(200).json(datasets))
      .catch(next);
});

module.exports = router;
