///////////////////////////////////////////////////////////////////////////////////////////////
// WebSocket for Circuit Node.js
///////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-env node, es6 */
/*global */

var NodeWebSocket = require('ws');
var NodeSDK = require('./NodeSDK');

module.exports = function (target, cookie) {
    'use strict';
    var logger = NodeSDK.logger;
    var wsOptions = {
        headers: {
            Cookie: cookie
        },
        rejectUnauthorized: NodeSDK.rejectUnauthorized,
        agent: NodeSDK.proxyAgent
    };
    logger.debug('[WebSocket]: Initiated websocket with ' + JSON.stringify(wsOptions));
    return new NodeWebSocket(target, wsOptions);
};
