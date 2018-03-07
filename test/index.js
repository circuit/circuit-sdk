const runner = require('./runner');
const express = require('express');
const serveStatic = require('serve-static');
const app = express();
const argv = require('minimist')(process.argv.slice(2));

// Default options
let options = {
    files: 'test/browser/*.html', // string or array. supports glob
    port: 3000,
    width: 900,
    height: 600,
    timeout: 120 * 1000,
    //  executablePath: '/usr/bin/chrome-unstable',  // chrome executable path
    visible: false,
    args: [
        'no-sandbox',
        'use-fake-device-for-media-stream',
        'use-fake-ui-for-media-stream',
        'mute-audio'
    ]
};

options = Object.assign(options, argv);

app.use(serveStatic('.'));
app.listen(options.port);

runner(options)
    .then(() => process.exit())
    .catch(() => process.exit(1));

