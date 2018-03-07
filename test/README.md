# JS SDK and Node.js SDK test suites

> Node.js 8+ is required to run the tests

## Writing Tests
Since the code for the JS SDK and Node.js SDK is shared, the recommendation is to write the tests for Node.js only. JS SDK tests are used to test features only available in th browser, which is mainly WebRTC.

Fileupload is supported in both SDKs, but implemented differently, so this feature should be tested in both SDKs.

These test use the Mocha test framework with Chai assertion for browser tests and integrated assert module for node. For browser tests puppeteer is used to run Chrome in headless mode to allow for reliable WebRTC tests.

### JS SDK tests
JS SDK tests are located at `test/browser` by default.

To execute only JS SDK tests run `npm run test:browser`. To run a subset of test pass a one or multiple paths (or glob patterns) to index.js using the `--files` option. E.g.
```bash
node test/index --files "test/browser/directcall.html"
```

Other options are:
* `--visible`: If set, browsers are shown (i.e. not headless)
* `--port`: Port to serve the app on. Defaults to port 3000
* `--executablePath`: Path to browser executable. Defaults to Chrome included in installed puppeteer version. See package.json

To write a new test, create a new html file in `test/browser`, or a subfolder. Also create a new js file, preferrably named the same, and include it in the grml file. The new tests are then picked up automatically.

#### Use peer users
The proxy class `PeerUser` allows to login and control browser instances with other users. For example your tests can initiate a direct call and then have a peer user answer the call. See directcall.js for an example.

#### Helper functions
`helper.js` includes several helper functions such as `expectEvents` which waits for specified events to be received.


### Node.js SDK tests
Node.js SDK tests are located at `test/node` by default. These tests are regular Mocha tests picked up by the rule defined in the options. E.g.
```bash
mocha ./test/node/* --recursive
```

Using the Node.js SDK, tests can login as multiple bots if needed. File `config.json` contains several bots to use.

#### Helper functions
`node-helper.js` includes several helper functions such as `expectEvents` which waits for specified events to be received.


## Run
```bash
npm install
npm test
```

## Debugging
To debug JS SDK tests, run the test using the `--visible` option, and add some sleep's if needed to have enough time to open the devtools and add break points. Then debug as normal.

To debug Node.js SDK tests, use VSCode and debug as normal.

## Example browser test
```javascript
import { PeerUser } from '/peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '/helper.js';
import config from './config.js'

const assert = chai.assert;

describe('WebRTC direct call', async function() {
    this.timeout(5000);

    let client;
    let peerUser;
    let call;

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
    });

    after(async function() {
        await Promise.all([peerUser.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('should initiate direct call and get callStatus with callStateChanged:Initiated and callStateChanged:Delivered', async () => {
        call = await client.makeCall(peerUser.username, {audio: true, video: true});
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Delivered
        }]);
        assert(call.callId);
    });

    it('should get callStatus event for remoteStreamUpdated and callStateChanged:Active upon peer answering', async () => {
        updateRemoteVideos(client);
        await Promise.all([
            peerUser.exec('answerCall', call.callId, {audio: true, video: true}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'remoteStreamUpdated'
            }, {
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
            }])
        ]);
    });

    it('should end call and get callEnded event', async () => {
        updateRemoteVideos(client);
        await Promise.all([client.endCall(call.callId), expectEvents(client, ['callEnded'])]);
    });
});
```