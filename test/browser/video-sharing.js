'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
describe('Video Sharing', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
        const conversation = await client.createGroupConversation([peerUser.userId], 'SDK Test: Video Sharing');
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
        await Promise.all([peerUser.destroy(), client.logout()]);
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