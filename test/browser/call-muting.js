'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1, peerUser2;
let call;
describe('Call Muting', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
        const conversation = await client.createGroupConversation([peerUser1.userId, peerUser2.userId], 'SDK Test: Call Muting');
        call = await client.startConference(conversation.convId, {audio: true, video: false});
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        }]);
        await sleep(3000); // wait to make sure the call is ready to be joined
        await Promise.all([
            peerUser1.exec('joinConference', call.callId, {audio: true, video: false}),
            peerUser2.exec('joinConference', call.callId, {audio: true, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
            }, {
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined'
            }])
        ]);
        call = await client.findCall(call.callId);
        await sleep(5000);
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('function: muteParticipant, raises event: callStatus with reason: participantUpdated', async () => {
        await Promise.all([
            client.muteParticipant(call.callId, peerUser2.userId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantUpdated' && evt.call.callId === call.callId && evt.participant.muted
            }])
        ]);
    });

    it('function: mute, raises event: callStatus with reason: localUserSelfMuted', async () => {
        await Promise.all([
            client.mute(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'localUserSelfMuted' && evt.call.callId === call.callId && evt.call.locallyMuted
            }])
        ]);
    });

    it('function: unmute, raises event: callStatus with reason: localUserSelfUnmuted', async () => {
        await Promise.all([
            client.unmute(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'localUserSelfUnmuted' && evt.call.callId === call.callId && !evt.call.locallyMuted
            }])
        ]);
    });

    it('function: muteRtcSession, raises event: callStatus with reason: participantUpdated', async () => {
        await Promise.all([
            client.muteRtcSession(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantUpdated' && evt.call.callId === call.callId && evt.participant.muted
            }])
        ]);
        await sleep(3000); // wait 3 seconds to allow the other users to be muted
        call = await client.findCall(call.callId);
        assert(call.participants.every(user => user.muted));
    });
});
