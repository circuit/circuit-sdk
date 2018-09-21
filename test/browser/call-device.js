'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser, peerUser2;
let call;
let device;
let user;
describe('Video Sharing', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
        peerUser2 = res[1];
        user = res[2];
        const conversation = await client.createGroupConversation([peerUser.userId, peerUser2.userId], 'SDK Test: Conference Call');
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
        await Promise.all([peerUser.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('should get started calls', async () => {
        const res = await peerUser2.exec('getStartedCalls');
        assert(res.some(c => c.callId === call.callId));
    })

    it('should get media devices and confirm the correct client', async () => {
        const res = await client.getDevices();
        assert(res.some(dev => dev.clientId === user.clientId));
    })

    it('should get audio and video stats', async () => {
        const res = await client.getAudioVideoStats();
        console.log('audio/vid', res.type);
        assert(res);
    });    
    
    it('should get local audio and video stream', async () => {
        const res = await client.getLocalAudioVideoStream();
        console.log('stats/vid', res.type);
        assert(res);
    });
});