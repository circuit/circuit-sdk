///////////////////////////////////////////////////////////////////////////////////////////////
// Global settings for Circuit Node.js
///////////////////////////////////////////////////////////////////////////////////////////////

/*eslint strict: ["error", "never"]*/

/**
 * Object defining Node.js SDK specific options.
 * @class NodeSDK
 */
var NodeSDK = {};

/**
 * If true, the server certificate is verified against the list of supplied CAs.
 * An error event is emitted if verification fails; err.code contains the OpenSSL
 * error code. Default: false.
 * Only applicable to Node.js SDK.
 * @property rejectUnauthorized
 * @type Boolean
 * @example
 *     NodeSDK.rejectUnauthorized = true;
 */
NodeSDK.rejectUnauthorized = false;

/**
 * HttpsProxyAgent object as defined in https://www.npmjs.com/package/https-proxy-agent.
 * Agent will be used on HTTP(S) request and WebSocket connection within Node SDK.
 * Only applicable to Node.js SDK.
 * @property proxyAgent
 * @type Object
 * @example
 *      // export http_proxy=http://172.20.1.100:8080
 *      var HttpsProxyAgent = require('https-proxy-agent');
 *      NodeSDK.proxyAgent = new HttpsProxyAgent(url.parse(process.env.http_proxy));
 */
NodeSDK.proxyAgent = undefined;

// Dummy logger. Overwritten by application using Circuit.setLogger
NodeSDK.logger = {
    debug: function () {},
    info: function () {},
    warning: function () {},
    warn: function () {},
    error: function () {}
};

module.exports = NodeSDK;


