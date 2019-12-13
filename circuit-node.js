/**
 *  Copyright 2019 Unify Software and Solutions GmbH & Co.KG.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

/* global Circuit */

///////////////////////////////////////////////////////////////////////////////////////
// Global objects exposed for Node.js (WebSocket and XMLHttpRequest)
///////////////////////////////////////////////////////////////////////////////////////
var NodeSDK = require('./NodeSDK');
var XMLHttpRequest = require('./XMLHttpRequest');
var WebSocket = require('./WebSocket');

// Save just in case to be good citizens
var origXMLHttpRequest = global.XMLHttpRequest;
var origWebSocket = global.WebSocket;

// JS SDK depends on these to be defined globally
global.XMLHttpRequest = XMLHttpRequest;
global.WebSocket = WebSocket;

// Load JS SDK
var Circuit = require('./circuit.js');

// Put the pollution back
global.XMLHttpRequest = origXMLHttpRequest;
global.WebSocket = origWebSocket;

// Global settings
Circuit.NodeSDK = NodeSDK;
Circuit.File = require('./File');

// JS SDK depends on FileUpload to be globally defined
Circuit.FileUpload = require('./FileUpload');

/**
 * Set logger to be used by Node.js SDK. Not applicable to JS SDK.
 * @method setLogger
 * @param {Object} appLogger logger object implementing 'debug', 'info', 'warn', 'warning' and 'error' functions
 * @returns {void}
 * @example
 *     Circuit.setLogger(bunyan.createLogger({
 *       name: 'sdk',
 *       stream: process.stdout,
 *       level: 'debug'
 *     }));
 */
Circuit.setLogger = function setLogger(appLogger) {
    'use strict';
    appLogger = appLogger || {};
    var logDebug = appLogger.debug || appLogger.log || function () { };
    var logInfo = appLogger.info || logDebug;
    var logWarning = appLogger.warn || appLogger.warning || logInfo;
    var logError = appLogger.error || logWarning;

    Circuit.logger.debug = function () {
        logDebug.apply(appLogger, Array.prototype.slice.apply(arguments));
    };
    Circuit.logger.info = function () {
        logInfo.apply(appLogger, Array.prototype.slice.apply(arguments));
    };
    Circuit.logger.warning = function () {
        logWarning.apply(appLogger, Array.prototype.slice.apply(arguments));
    };
    Circuit.logger.warn = function () {
        logWarning.apply(appLogger, Array.prototype.slice.apply(arguments));
    };
    Circuit.logger.error = function (error, obj) {
        var args = [(error && error.stack) || error];
        obj = (obj && obj.stack) || obj;
        if (obj) {
            args.push(obj);
        }
        logError.apply(appLogger, args);
    };
    Circuit.logger.msgSend = function () {
        logInfo.apply(appLogger, Array.prototype.slice.apply(arguments));
    };
    Circuit.logger.msgRcvd = function () {
        logInfo.apply(appLogger, Array.prototype.slice.apply(arguments));
    };

    // Set logger for use by XMLHttpRequest, WebSocket and FileUpload
    NodeSDK.logger = Circuit.logger;
};

module.exports = Circuit;
