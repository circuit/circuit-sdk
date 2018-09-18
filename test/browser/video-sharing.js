'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
describe('Video sharing tests', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
        const conversation = await client.createGroupConversation([peerUser.userId, 'c2e5d330-5ea2-4f85-aba1-2c00dac2991a'], 'SDK Test: Conference Call');
        call = await client.startConference(conversation.convId, {audio: true, video: false});
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        }]);
        await sleep(5000); // wait to make sure the call is ready to be joined
        await Promise.all([
            peerUser.exec('joinConference', call.callId, {audio: true, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined'
            }])
        ]);
        call = await client.findCall(call.callId);
    });

    after(async function() {
        await peerUser.exec('endCall', call.callId);
        await client.endCall(call.callId);
        await Promise.all([peerUser.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });


    it('should toggle video on', async () => {
        await client.toggleVideo(call.callId);
        await sleep(3000);
        call = await client.findCall(call.callId);
        assert(call.localVideoUrl);
    });

    it('should change hd video on', async () => {
        await client.changeHDVideo(call.callId, true);
        await sleep(3000);
        call = await client.findCall(call.callId);
        assert(call.localMediaType.hdVideo);
    });

    it('should change hd video off', async () => {
        await client.changeHDVideo(call.callId, false);
        await sleep(3000);
        call = await client.findCall(call.callId);
        assert(!call.localMediaType.hdVideo);
    });

    it('should toggle video off', async () => {
        await client.toggleVideo(call.callId);
        await sleep(3000);
        call = await client.findCall(call.callId);
        assert(!call.localVideoUrl);
    });
});