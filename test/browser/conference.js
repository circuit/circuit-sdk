'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;

describe('Create group conversation and start conference call', async function() {
    this.timeout(5000);

    let client;
    let peerUser1, peerUser2;
    let call;

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('functions: [createGroupConversation, startConference], with event: callStatus with states: [Initiated, Waiting]', async () => {
        const conversation = await client.createGroupConversation([peerUser1.userId, peerUser2.userId], 'SDK Test: Conference Call');
        assert(!!conversation, 'createGroupConversation not successful');
        call = await client.startConference(conversation.convId, {audio: true, video: true});
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        }]);
        assert(call.callId);
        document.querySelector('#localVideo').src = call.localVideoUrl;
    });

    it('function: joinConference, with event: callStatus with reaons: [callStateChanged, participantJoined]', async () => {
        await sleep(5000); // wait to make sure the call is ready to be joined
        updateRemoteVideos(client);
        await Promise.all([
            peerUser1.exec('joinConference', call.callId, {audio: true, video: true}),
            peerUser2.exec('joinConference', call.callId, {audio: true, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
            }, {
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined'
            }])
        ]);
    });

    it('function: endConference, with event: callEnded', async () => {
        updateRemoteVideos(client);
        await Promise.all([client.endConference(call.callId), expectEvents(client, ['callEnded'])]);
        document.querySelector('#localVideo').src = '';
    });
});
