'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
describe('Direct Call', async function() {
    this.timeout(300000);
    
    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
    });

    after(async function() {
        document.querySelector('#localVideo').srcObject  = null;
        await Promise.all([peerUser.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('function: makeCall, with event: callStatus with states: [Initiated, Delivered]', async () => {
        const res = await Promise.all([
            client.makeCall(peerUser.userId, {audio: true, video: true}, true),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
            }, {
                type: 'callStatus',
                predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Delivered
            }])
        ]);
        call = res[0];
        assert(call.callId);
        document.querySelector('#localVideo').srcObject = call.localStreams.video;
    });

    it('function: answerCall, with event: callStatus with reasons: [remoteStreamUpdated, callStateChanged]', async () => {
        updateRemoteVideos(client);
        const res = await Promise.all([
            peerUser.exec('answerCall', call.callId, {audio: true, video: true}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'remoteStreamUpdated'
            }, {
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
            }])
        ]);
        assert(res[1].call.callId === call.callId && res[1].call.state === Circuit.Enums.CallStateName.Active);
    });

    it('function: endCall, with event: callEnded', async () => {
        updateRemoteVideos(client);
        const res = await Promise.all([client.endCall(call.callId), expectEvents(client, ['callEnded'])]);
        assert(res[1].call.callId === call.callId);
    });
});
