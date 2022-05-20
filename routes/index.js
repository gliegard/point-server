const express = require('express');
const router = express.Router();
const config = require('../services/config');

router.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

function getDatasetConf(dataset, res) {
  config.retrieveDatasetConf(dataset)
    .then(([conf, dataset]) => {
      res.status(200).json({
        ept: config.formatDatasetURL(conf.EPT_JSON, dataset),
        pivot: config.formatDatasetURL(conf.PIVOT_THREEJS, dataset),
        emprise: config.formatDatasetURL(conf.EMPRISE, dataset),
        maxArea: conf.SURFACE_MAX
      });
    })
    .catch(() => res.status(404).json({}));
}

// Get default dataset
router.get('/datasets', (req, res) => {
  getDatasetConf(undefined, res);
});

// Get specific dataset
router.get('/datasets/:dataset', (req, res) => {
  getDatasetConf(req.params.dataset, res);
});

module.exports = router;
