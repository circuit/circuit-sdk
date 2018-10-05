'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
describe('Outgoing direct call', async function() {
    this.timeout(300000);
    
    before(async function() {
        await sleep(15000);
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

    it('should initiate direct call and get callStatus Initiated and Delivered', async () => {
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
        document.querySelector('#localVideo').src = call.localVideoUrl;
    });

    it('should get callStatus event for remoteStreamUpdated and state Active upon peer answering', async () => {
        await sleep(5000);
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

    it('should end call and get callEnded event', async () => {
        updateRemoteVideos(client);
        const res = await Promise.all([client.endCall(call.callId), expectEvents(client, ['callEnded'])]);
        document.querySelector('#localVideo').src = '';
        assert(res[1].call.callId === call.callId);
    });
});
