'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1;
let call;
let whiteboard;
let condition = 'width="562.25537109375" x="356.74554443359375" y="170.75135803222656"'; // used to define element and verify in getWhiteboard
let element = `<rect  circuit:creatorId="1" circuit:orderId="1" fill="#000000" fill-opacity="0" height="311.0114288330078" stroke="#000000" stroke-width="2" ${condition}/>`;
let elementId;
let URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsAKQEnejZV5fSgujJwnAWdPHLytN3MxOSDqbzCPxwoSXufvLOlg';
function loadXHR(url) {
    return new Promise((resolve, reject) => {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.onerror = () => {reject('Network error.')};
            xhr.onload = () => {
                if (xhr.status === 200) {resolve(xhr.response)}
                else {reject('Loading error:' + xhr.statusText)}
            };
            xhr.send();
        } catch(err) { 
            reject(err.message);
        }
    });
}
describe('Whiteboard tests', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        const conversation = await client.createGroupConversation([peerUser1.userId], 'SDK Test: Whiteboard');
        const result = await Promise.all([
            client.startConference(conversation.convId, {audio: true, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
            }, {
                type: 'callStatus',
                predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
            }])
        ]);
        call = result[0];
        document.querySelector('#localVideo').srcObject = call.localVideoStream;
        await sleep(5000);
    });

    after(async function() {
        document.querySelector('#localVideo').srcObject = null;
        await client.endCall(call.callId);
        await Promise.all([peerUser1.destroy(), client.logout()]);
    });
    

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('function: enableWhiteboard, raises event: whiteboardEnabled', async () => {
        const res = await Promise.all([
            client.enableWhiteboard(call.callId, {width: 800, height: 400}),
            expectEvents(client, [{
                type: 'whiteboardEnabled',
                predicate: evt => evt.enabled && evt.whiteboard.viewbox.width === 800 && evt.whiteboard.viewbox.height === 400
            }])
        ]);
        whiteboard = res[1] && res[1].whiteboard;
        assert(whiteboard && res[1].enabled);
    });

    it('function: getWhiteboard', async () => {
        whiteboard = await client.getWhiteboard(call.callId);
        assert(whiteboard.callId === call.callId && whiteboard.viewbox.width === 800 && whiteboard.viewbox.height === 400 && !whiteboard.background && !whiteboard.background);
    });

    it('functions: [setWhiteboardBackground, getWhiteboard]', async () => {
        const img = await loadXHR(URL);
        await client.setWhiteboardBackground(call.callId, img);
        await sleep(3000); // must wait for whiteboard background to be set because no event to listen to
        whiteboard = await client.getWhiteboard(call.callId);
        assert(whiteboard.background);
    });

    it('functions: [clearWhiteboardBackground, getWhiteboard]', async () => {
        await client.clearWhiteboardBackground(call.callId);
        await sleep(3000); // must wait for whiteboard background to be cleared because no event to listen to
        whiteboard = await client.getWhiteboard(call.callId);
        assert(!whiteboard.background);
    });

    it('function: addWhiteboardElement, raises event: whiteboardElement', async () => {
        // first element is for testing clearWhiteboard
        await client.addWhiteboardElement(call.callId, `<rect  circuit:creatorId="1" circuit:orderId="1" fill="#000000" fill-opacity="0" height="1" stroke="#000000" stroke-width="2" width="1" x="1" y="1"/>`); 
        const res = await Promise.all([
            client.addWhiteboardElement(call.callId, element),
            expectEvents(client, [{
                type: 'whiteboardElement',
                predicate: evt => evt.action === 'added' && evt.element.xmlElement.includes(condition)
            }])
        ]);
        elementId = res[1].element && res[1].element.elementId;
        assert(res[1].action === 'added' && res[1].element.xmlElement.includes(condition));
    });

    it('function: getWhiteboard, verifies element', async () => {
        whiteboard = await client.getWhiteboard(call.callId);
        assert(whiteboard.elements && whiteboard.elements.some(elm => elm.elementId.xmlId === elementId.xmlId));
    });

    it('function: removeWhiteboardElement, raises event: whiteboardElement', async () => {
        await Promise.all([
            client.removeWhiteboardElement(call.callId, elementId.xmlId),
            expectEvents(client, [{
                type: 'whiteboardElement',
                predicate: evt => evt.action === 'removed' && evt.elementId.xmlId === elementId.xmlId
            }])
        ]);
        whiteboard = await client.getWhiteboard(call.callId);
        assert(!whiteboard.elements.some(elm => elm.elementId.xmlId === elementId.xmlId));
    });

    it('function: undoWhiteboard, raises event: whiteboardElement', async () => {
        await Promise.all([
            client.undoWhiteboard(call.callId, 1),
            expectEvents(client, [{
                type: 'whiteboardElement',
                predicate: evt => evt.action === 'added' && evt.element.elementId.xmlId === elementId.xmlId
            }])
        ]);
    });

    it('function: toggleWhiteboardOverlay [ON], raises event: whiteboardOverlayToggled', async () => {
        await Promise.all([
            client.toggleWhiteboardOverlay(call.callId),
            expectEvents(client, [{
                type: 'whiteboardOverlayToggled'
            }])
        ]);
        whiteboard = await client.getWhiteboard(call.callId);
        assert(whiteboard.overlay);
    });

    it('function: toggleWhiteboardOverlay [OFF], raises event: whiteboardOverlayToggled', async () => {
        await Promise.all([
            client.toggleWhiteboardOverlay(call.callId),
            expectEvents(client, [{
                type: 'whiteboardOverlayToggled'
            }])
        ]);
        whiteboard = await client.getWhiteboard(call.callId);
        assert(!whiteboard.overlay);
    });

    it('function: clearWhiteboard, raises event: whiteboardCleared', async () => {
        await Promise.all([
            client.clearWhiteboard(call.callId),
            expectEvents(client, [{
                type: 'whiteboardCleared'
            }])
        ]);
        whiteboard = await client.getWhiteboard(call.callId);
        assert(!whiteboard.elements);
    });

    it('function: disableWhiteboard, raises event: whiteboardEnabled', async () => {
        await Promise.all([
            client.disableWhiteboard(call.callId),
            expectEvents(client, [{
                type: 'whiteboardEnabled',
                predicate: evt => !evt.enabled
            }])
        ]);
    });
});