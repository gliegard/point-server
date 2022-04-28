const AWS = require('aws-sdk');
const proxy = require('proxy-agent');
const debug = require('debug')('storeS3');
let s3;

function init() {
    if (s3) {
        return;
    }
    debug('Init S3 store');
    AWS.config.update({
        endpoint: process.env.AWS_ENDPOINT || 's3.gra.cloud.ovh.net',
    });

    if (process.env.http_proxy) {
        debug('Use proxy server : ' + process.env.http_proxy);
        AWS.config.update({
            httpOptions: { agent: proxy(process.env.http_proxy) }
        });    
    }
    s3 = new AWS.S3();
}

function checkFile(bucket, file) {
    return new Promise((resolve, reject) => {
        s3.getObject({
            Bucket: bucket,
            Key: file,
            Range: "bytes=0-0" // Request 0 byte of the file
        }, err => {
            if (err) {
                if (err.statusCode === 404)
                    resolve(false);
                else
                    reject(err);
            } else
                resolve(true);
        });
    });
}

function getFile(bucket, file) {
    return new Promise((resolve, reject) => {
        s3.getObject({
            Bucket: bucket,
            Key: file
        }, (err, data) => {
            if (err) {
                if (err.statusCode === 404)
                    resolve(null);
                else
                    reject(err);
            } else
                resolve(data);
        });
    });
}

function removeFile(bucket, file) {
    return new Promise((resolve, reject) => {
        s3.deleteObject({
            Bucket: bucket,
            Key: file
        }, err => err ? reject(err) : resolve());
    });
}

function setFile(bucket, file, content = "") {
    return new Promise((resolve, reject) => {
        s3.putObject({
            Bucket: bucket,
            Key: file,
            Body: content
        }, err => err ? reject(err) : resolve());
    })
}

function listFolders(bucket, folder) {
    return new Promise((resolve, reject) => {
        s3.listObjectsV2({
            Bucket: bucket,
            Delimiter: "/",
            Prefix: folder + "/"
        }, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data.CommonPrefixes.map(p => p.Prefix.substring(folder.length + 1, p.Prefix.length - 1)))
        });
    });
}

module.exports = {
    init,
    checkFile,
    getFile,
    removeFile,
    setFile,
    listFolders
};
