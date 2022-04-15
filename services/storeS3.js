var AWS = require('aws-sdk');
var proxy = require('proxy-agent');
var fs = require('fs');
var debug = require('debug')('storeS3');
var s3;

function init() {
    if (s3) {
        return;
    }
    debug('Init S3 store');
    AWS.config.update({
        // for OVH, set AWS_ENDPOINT env var to 's3.gra.cloud.ovh.net'
        endpoint: process.env.AWS_ENDPOINT,
    });

    if (process.env.http_proxy) {
        debug('Use proxy server : ' + process.env.http_proxy);
        AWS.config.update({
            httpOptions: { agent: proxy(process.env.http_proxy) }
        });    
    }
    s3 = new AWS.S3();
}

function initBucket(conf) {
    if (!conf.s3bucket) {
        // debug("Init S3 bucket for config: " + conf.S3_BUCKET);
        conf.s3bucket = new AWS.S3({params: {Bucket: conf.S3_BUCKET}});
    }
}

module.exports = {
    init,
    initBucket
}