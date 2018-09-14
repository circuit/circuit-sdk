'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1, peerUser2;
let call;
let conversation;
let whiteboard;
let condition = 'width="562.25537109375" x="356.74554443359375" y="170.75135803222656"'; // used to define element and verify in getWhiteboard
let element = `<rect  circuit:creatorId="1" circuit:orderId="1" fill="#000000" fill-opacity="0" height="311.0114288330078" stroke="#000000" stroke-width="2" ${condition}/>`;
describe('Whiteboard tests', async function() {
    this.timeout(60000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
        conversation = await client.createGroupConversation([peerUser1.userId, peerUser2.userId], 'SDK Test: Conference Call');
        call = await client.startConference(conversation.convId, {audio: true, video: true});
        await sleep(5000);
    });

    after(async function() {
        await client.endCall(call.callId);
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('Should enable whiteboard element', async () => {
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

    it('should get whiteboard', async () => {
        whiteboard = await client.getWhiteboard(call.callId);
        assert(whiteboard.callId === call.callId && whiteboard.viewbox.width === 800 && whiteboard.viewbox.height === 400 && !whiteboard.background && !whiteboard.background);
    });

    it('should add a whiteboard element', async () => {
        const res = await Promise.all([
            client.addWhiteboardElement(call.callId, element),
            expectEvents(client, [{
                type: 'whiteboardElement',
                predicate: evt => evt.action === 'added' && evt.element.xmlElement.includes(condition)
            }])
        ]);
        assert(res[1].action === 'added' && res[1].element.xmlElement.includes(condition));
    });

    it('should get whiteboard with element', async () => {
        whiteboard = await client.getWhiteboard(call.callId);
        assert(whiteboard.callId === call.callId && whiteboard.elements && whiteboard.elements.some(elm => elm.xmlElement.includes(condition)));
    });

    it('should disable whiteboard', async () => {
        const res = await Promise.all([
            client.disableWhiteboard(call.callId),
            expectEvents(client, [{
                type: 'whiteboardEnabled',
                predicate: evt => !evt.enabled
            }])
        ]);
        assert(!res[1].enabled);
    });
});
