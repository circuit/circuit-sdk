'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1;
let peerUser2;
let call;
describe('Video Sharing', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
        const conversation = await client.createGroupConversation([peerUser1.userId, peerUser2.userId], 'SDK Test: Video Sharing');
        call = await client.startConference(conversation.convId, {audio: true, video: false});
        console.log(call);
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        }]);
        await sleep(5000); // wait to make sure the call is ready to be joined
        await Promise.all([
            peerUser1.exec('joinConference', call.callId, {audio: true, video: true}),
            peerUser2.exec('joinConference', call.callId, {audio: true, video: true}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined'
            }])
        ]);
        call = await client.findCall(call.callId);
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });


    it('function: toggleVideo [ON], raises event: callStatus with reason: callStateChanged', async () => {
        await Promise.all([
            client.toggleVideo(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.localVideoUrl.length
            }])
        ]);
    });

    it('function: findCall, verifies stream objects of users', async () => {
        await sleep(3000);
        const res = await Promise.all([
            client.findCall(call.callId),
            peerUser1.exec('findCall', call.callId),
            peerUser2.exec('findCall', call.callId)
        ]);
        assert(res.every(userCall => userCall.localStreams.video && userCall.participants.every(participant => participant.streams.video)));
    });

    it('function: changeHDVideo [ON], raises event: callStatus with reason: sdpConnected', async () => {
        await Promise.all([
            client.changeHDVideo(call.callId, true),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'sdpConnected' && evt.call.localMediaType.hdVideo
            }])
        ]);
    });

    it('function: changeHDVideo [OFF], raises event: callStatus with reason: sdpConnected', async () => {
        await Promise.all([
            client.changeHDVideo(call.callId, false),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'sdpConnected' && !evt.call.localMediaType.hdVideo
            }])
        ]);
    });

    it('function: toggleVideo [OFF], raises event: callStatus with reason: callStateChanged', async () => {
        await Promise.all([
            client.toggleVideo(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && !evt.call.localVideoUrl.length
            }])
        ]);
    });
});