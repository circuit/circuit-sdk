///////////////////////////////////////////////////////////////////////////////////////////////
// XMLHttpRequest for Circuit Node.js
///////////////////////////////////////////////////////////////////////////////////////////////

var https = require('https');
var nodeUrl = require('url');
var NodeSDK = require('./NodeSDK');

module.exports = function (config) {
    'use strict';

    var _self = this;
    var logger = NodeSDK.logger;

    _self.httpReqOptions = null;
    _self.withCredentials = null;
    _self.onload = function () { };
    _self.onerror = function () { };
    _self.login = false;
    _self.config = config;

    this.setRequestHeader = function (header, value) {
        logger.debug('[XMLHttpRequest]: setRequestHeader ' + header + ':' + value);
        this.httpReqOptions.headers[header] = value;
    };

    this.setAuthCookie = function (res) {
        _self.config.cookie = '';
        var str = res.headers['set-cookie'].toString();
        var re = null, found = false;
        re = /.*(connect\.sess=.*?);.*/i;
        found = str.match(re);
        if (found) {
            _self.config.cookie += found[1];
        } else {
            logger.error('[XMLHttpRequest]: setAuthCookie connect.sess not found in set-cookie');
            process.exit(1);
        }
        logger.debug('[XMLHttpRequest]: setAuthCookie ' + JSON.stringify(_self.config.cookie, null, 2));
    };

    this.open = function (method, url, async) {
        logger.debug('[XMLHttpRequest]: open ' + method + ' ' + url + ' ' + async);
        var parts = nodeUrl.parse(url);
        logger.debug(JSON.stringify(parts, null, 2));

        this.httpReqOptions = {
            host: parts.hostname,
            port: (parts.port) ? parts.port : '443',
            path: parts.path,
            method: method,
            headers: {
                'User-Agent': navigator.userAgent
            },
            rejectUnauthorized: NodeSDK.rejectUnauthorized,
            agent: NodeSDK.proxyAgent
        };

        this.login = /^\/.*login/g.test(parts.path);
        if (!this.login && _self.config.cookie) {
            this.setRequestHeader('Cookie', _self.config.cookie);
        }
    };

    this.send = function (sendData) {
        logger.debug('[XMLHttpRequest]: send');
        var xhr = this;
        logger.debug('[XMLHttpRequest]: ' + JSON.stringify(this.httpReqOptions, null, 2));

        var req = https.request(this.httpReqOptions, function (res) {
            logger.debug('[XMLHttpRequest]: response code ' + res.statusCode);
            logger.debug('[XMLHttpRequest]: response headers ' + JSON.stringify(res.headers, null, 2));

            xhr.status = res.statusCode;

            if (res.statusCode !== 200 && res.statusCode !== 302) {
                logger.error('[XMLHttpRequest]: response with status code error ' + res.statusCode);
                xhr.onerror();
                return;
            }

            if (xhr.login) {
                xhr.setAuthCookie(res);
            }

            res.setEncoding('utf8');

            res.on('data', function (rcvData) {
                logger.debug('[XMLHttpRequest]: ready to call onload with ' + JSON.stringify(rcvData, null, 2));
                xhr.responseText = rcvData;
                xhr.onload();
            });

            res.on('error', function (e) {
                logger.error('[XMLHttpRequest]: result error ' + JSON.stringify(e, null, 2));
                xhr.onerror();
            });

        });

        if (sendData) {
            logger.debug('[XMLHttpRequest]: sending data');
            req.write(sendData);
        }

        req.on('error', function (e) {
            logger.error('[XMLHttpRequest]: request error ' + JSON.stringify(e, null, 2));
            xhr.onerror();
        });

        req.end();
    };
};
