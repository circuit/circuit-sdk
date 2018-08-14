///////////////////////////////////////////////////////////////////////////////////////////////
// FileUpload for Circuit Node.js
///////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-env node, es6 */
/*global navigator*/

var nodeUrl = require('url');
var fs = require('fs');
var https = require('https');
var NodeSDK = require('./NodeSDK');

module.exports = function FileUpload(config) {
    'use strict';

    var MAX_FILE_COUNT = 10;
    var MAX_FILE_SIZE = 50000000;
    var stat = 0;

    var logger = NodeSDK.logger;
    var _config = config || {};

    function isFileOK(file) {
        //TODO optimize for async flow
        var error = null;

        if (file.path) {
            if (!fs.existsSync(file.path)) {
                error = new Error('[FileUpload] file not found');
            }
            stat = fs.statSync(file.path);
            if (stat.size > MAX_FILE_SIZE) {
                error = new Error('[FileUpload] max file size exceeded');
            }
        } else if (file.buffer) {
            stat = { size: file.buffer.length };
            if (stat.size > MAX_FILE_SIZE) {
                error = new Error('[FileUpload] max file size exceeded');
            }
        } else {
            error = new Error('[FileUpload] no file provided');
        }
        if (file.type === 'application/json') {
            logger.debug('[FileUpload]: replace file type ', file.type);
            file.type = 'text/plain'; //upload json files as text files
        }
        return error;
    }

    function urlToOptions(url, file, stat, opts) {
        logger.debug('[FileUpload] urlToOptions', url, file, stat);
        var parts = nodeUrl.parse(url);
        var options = {
            rejectUnauthorized: NodeSDK.rejectUnauthorized,
            agent: NodeSDK.proxyAgent,
            host: parts.hostname,
            port: (parts.port) ? parts.port : '443',
            path: parts.path,
            method: 'POST',
            headers: {
                'User-Agent': navigator.userAgent,
                'Cookie': _config.cookie,
                'Content-Disposition': 'attachment; filename="' + file.name + '"',
                'Content-Length': stat.size,
                'Content-Type': file.type
            }
        };

        if (opts) {
            opts.convId && (options.headers['x-conversation'] = opts.convId);
            opts.rtcSessionId && (options.headers['x-rtcsession'] = opts.rtcSessionId);
        }

        logger.debug('[FileUpload] options', options);
        return options;
    }

    function uploadFile(file, url, opts) {
        return new Promise(function (resolve, reject) {
            var error = isFileOK(file);
            if (error) {
                reject(error);
                return;
            }
            var options = urlToOptions(url, file, stat, opts);
            var req = https.request(options, function (res) {
                if (!res) {
                    logger.error('[FileUpload]: no res in https callback');
                    error = new Error('[FileUpload]: no res in https callback');
                    reject(error);
                }
                logger.debug('[FileUpload]: https callback', res.statusCode, res.statusMessage, res.headers);
                if (res.statusCode !== 200) {
                    logger.error('[FileUpload]: status code: ' + res.statusCode, res.statusMessage);
                    error = new Error('[FileUpload]: status code ' + res.statusCode, res.statusMessage);
                    reject(error);
                }
                var body = '';
                res.on('data', function (d) {
                    logger.debug('[FileUpload]: result on data', d);
                    body += d;
                });
                res.on('end', function () {
                    logger.debug('[FileUpload]: result on end', body.toString('utf8'));
                    resolve(body);
                });
                res.on('error', function (e) {
                    logger.debug('[FileUpload]: result on error', e);
                    reject(e);
                });
            });

            if (file.path) {
                var readStream = fs.createReadStream(file.path);
                readStream.on('data', function (chunk) {
                    logger.debug('[FileUpload]: readStream on data', file.path, chunk);
                    req.write(chunk);
                });
                readStream.on('end', function () {
                    logger.debug('[FileUpload]: readStream on end ', file.path);
                    req.end();
                });

                req.on('error', function (e) {
                    logger.debug('[FileUpload]: request on error', file.path, e);
                    reject(e);
                });
            } else if (file.buffer) {
                req.end(file.buffer);
            }
        });
    }

    this.uploadFiles = function (files, domain) {
        domain = domain || _config.domain;
        logger.debug('[FileUpload] node SDK uploadFiles: ', files, domain);

        if (files.length > MAX_FILE_COUNT) {
            return Promise.reject('[FileUpload]: Exceeded maximum of %d% files per message', MAX_FILE_COUNT);
        }

        var result = [];

        // Find large images that need to be resized
        var resizePromises = [];
        /*
        files.forEach(function (file) {
            // Even create a thumbnail for small images
            if (circuit.Utils.isSupportedImage && circuit.Utils.isSupportedImage(file.type)) {
                resizePromises.push(createThumbnail(file));
                logger.warning('[FileUpload]: node SDK does not yet support creation of thumbnails');
            }
        });
        */

        return Promise.all(resizePromises)
        .then(function (blobs) {
            // Add the blob's (thumbnails) to the list of files to be upoaded
            files = files.concat(blobs);

            // Sequentially (but async) upload the files. Once all files are
            // uploaded, resolve the Promise passing the upload results.
            var itemId = null;
            return files.reduce(function (sequence, file) {
                return sequence.then(function () {
                    var url = 'https://' + domain + '/fileapi?itemid=' + (itemId || 'NULL');
                    return uploadFile(file, url)
                    .then(function (res) {
                        var resp = JSON.parse(res)[0];
                        itemId = itemId || resp.id;
                        var attachmentMetaData = {
                            fileId: resp.fileid.slice(-1)[0],
                            fileName: file.name,
                            itemId: itemId,
                            mimeType: resp.mimeType || file.type,
                            size: file.size
                        };
                        result.push(attachmentMetaData);
                        return result;
                    });
                });
            }, Promise.resolve());
        });
    };

    this.uploadWhiteboardFile = function (file, rtcSessionId) {
        logger.debug('[FileUpload] node SDK uploadWhiteboardFile: ', file);

        var url = 'https://' + _config.domain + '/fileapi';
        var opts = {
            rtcSessionId: rtcSessionId
        };

        return uploadFile(file, url, opts)
        .then(function (res) {
            var resp = JSON.parse(res)[0];
            var fileUrl = url + '?fileid=' + resp.id;
            var fileName = file.name;
            var attachmentMetaData = {
                fileId: resp.id,
                fileName: fileName,
                mimeType: resp.mimeType || file.type,
                size: file.size,
                url: fileUrl,
                deleteUrl: fileUrl
            };
            return attachmentMetaData;
        });
    };
};
