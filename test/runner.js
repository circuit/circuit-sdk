'use strict';

const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer');
const globby = require('globby');
const config = require('./peer-config.json');

let browserTimeout;
let puppeteerOptions;
let peerUrl;

// Pool of peer users
const peerUserPool = config.credentials.map(user => user.username);
const peerUserCredentials = new Map(config.credentials.map((i) => [i.username, i]));

// Hashtable of peer browser pages indexed by username
const peerBrowsers = {};

function initMocha(reporter) {
    console.log = (console => {
        const log = console.log.bind(console);
        return (...args) => args.length ? log(...args) : log('');
    })(console);

    function shimMochaInstance(m) {
        m.setup({ reporter: Mocha.reporters[reporter] || Mocha.reporters.spec });

        const run = m.run.bind(m);
        m.run = () => {
            const all = [], pending = [], failures = [], passes = [];

            function error(err) {
                if (!err) return {};

                let res = {};
                Object.getOwnPropertyNames(err).forEach(key => res[key] = err[key]);
                return res;
            }

            function clean(test) {
                return {
                    title: test.title,
                    fullTitle: test.fullTitle(),
                    duration: test.duration,
                    err: error(test.err)
                };
            }

            function result(stats) {
                return {
                    result: {
                        stats: {
                            tests: all.length,
                            passes: passes.length,
                            pending: pending.length,
                            failures: failures.length,
                            start: stats.start.toISOString(),
                            end: stats.end.toISOString(),
                            duration: stats.duration
                        },
                        tests: all.map(clean),
                        pending: pending.map(clean),
                        failures: failures.map(clean),
                        passes: passes.map(clean)
                    },
                    coverage: window.__coverage__
                };
            }

            function setResult() {
                !window.__mochaResult__ && (window.__mochaResult__ = result(this.stats));
            }

            const runner = run(() => setTimeout(() => setResult.call(runner), 0))
                .on('pass', test => { passes.push(test); all.push(test); })
                .on('fail', test => { failures.push(test); all.push(test); })
                .on('pending', test => { pending.push(test); all.push(test); })
                .on('end', setResult);

            return runner;
        };
    }

    function shimMochaProcess(M) {
        // Mocha needs a process.stdout.write in order to change the cursor position.
        !M.process && (M.process = {});
        !M.process.stdout && (M.process.stdout = {});

        M.process.stdout.write = data => console.log('stdout:', data);
        M.reporters.Base.useColors = true;
        M.reporters.none = function None(runner) {
            M.reporters.Base.call(this, runner);
        };
    }

    Object.defineProperty(window, 'mocha', {
        get: function() { return undefined },
        set: function(m) {
            shimMochaInstance(m);
            delete window.mocha;
            window.mocha = m
        },
        configurable: true
    })

    Object.defineProperty(window, 'Mocha', {
        get: function() { return undefined },
        set: function(m) {
            shimMochaProcess(m);
            delete window.Mocha;
            window.Mocha = m;
        },
        configurable: true
    });
}

async function handlePeerUserCommand({name, args, username}) {
    if (name === 'create') {
        // spin up new browser for the new Peer User
        const browser = await puppeteer.launch(puppeteerOptions)
        const page = await browser.newPage();
        page.on('console', handleConsole);
        page.on('pageerror', console.error);
        await page.goto(peerUrl);

        // Close browser when user logs out, or on timeout
        page.waitForFunction(() => window.__peeruserlogout__, { timeout: browserTimeout })
            .then(() => browser.close())
            .catch(console.error);

        // Add new page to hastable
        const username = peerUserPool.shift();
        peerBrowsers[username] = page;

        // Create client instance and login
        return await page.evaluate(async (config, credentials) => {
            window.__client__ = new Circuit.Client(config);
            return await window.__client__.logon(credentials);
        }, config.config, peerUserCredentials.get(username));
    }

    const page = peerBrowsers[username];

    if (name === 'destroy') {
        // Log user out. Triggers closing of browser.
        await page.evaluate(async () => {
            await window.__client__.logout();
            window.__peeruserlogout__ = true;
        });

        // Return user to the pool of peers
        peerUserPool.unshift(username);
        return;
    }

    // Execute an async API call on the client instance and return the result
    return await page.evaluate(async (name, args) => {
        return await window.__client__[name](...args);
    }, name, args);
}

function handleConsole(msg) {
    const args = msg._args;
    Promise.all(args.map(a => a.jsonValue()))
        .then(args => {
            // process stdout stub
            let isStdout = args[0] === 'stdout:';
            isStdout && (args = args.slice(1));
            //
            let msg = util.format(...args);

            !isStdout && (msg += '\n');
            process.stdout.write(msg);
        })
        .catch(err => process.stdout.write(err));
}

module.exports = async options => {
    let { files, port, reporter, timeout, width, height, x, y, args, executablePath, visible } = options;
    browserTimeout = timeout || 60000;
    port = port || 3000;
    peerUrl = `http://localhost:${port}/test/peer-template.html`;


    x = x || 0;
    y = y || 0;
    args.push(`window-position=${x},${y}`);

    width = width || 400;
    height = height || 400;
    args.push(`window-size=${width},${height}`);

    args = [].concat(args || []).map(arg => '--' + arg);

    puppeteerOptions = {
        ignoreHTTPSErrors: true,
        headless: !visible,
        executablePath,
        args
    };

    const paths = await globby(files);

    const result = [];

    for (let file of paths) {
        const res = await puppeteer
            .launch(puppeteerOptions)
            .then(browser => browser.newPage()
                .then(page => {
                    page.on('console', handleConsole);
                    page.on('pageerror', err => console.error(err));

                    return page.exposeFunction('onPeerUserCmd', handlePeerUserCommand)
                        .then(() => page.evaluateOnNewDocument(initMocha, reporter))
                        .then(() => page.goto(`http://localhost:${port}/${file}`))
                        .then(() => page.waitForFunction(() => window.__mochaResult__, { timeout: timeout }))
                        .then(() => page.evaluate(() => window.__mochaResult__))
                        .then(res => {
                            browser.close();
                            return res.result;
                        });
                }));
        result.push(res);
    }

    return result;
};
