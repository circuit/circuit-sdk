'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1, peerUser2;
let call;
describe('Call Joining', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
        const conversation = await client.createGroupConversation([peerUser2.userId], 'SDK Test: Call Joining');
        call = await client.startConference(conversation.convId, {audio: true, video: false});
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        }]);
        await sleep(3000); // wait to make sure the call is ready
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('function: getStartedCalls', async () => {
        const res = await peerUser2.exec('getStartedCalls');
        assert(res.some(c => c.callId === call.callId));
    })

    it('function: addParticipantToCall, raises event: callStatus with reason: participantAdded', async () => {
        await Promise.all([
            client.addParticipantToCall(call.callId, { userId: peerUser1.userId }),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantAdded' && evt.call.callId === call.callId && evt.participant.userId === peerUser1.userId
            }])
        ]);
        await sleep(3000); // wait to allow time so the participant can answer the call
        await Promise.all([
            peerUser1.exec('answerCall', call.callId, {audio: false, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined' && evt.call.callId === call.callId && evt.participant.userId === peerUser1.userId && evt.participant.isMeetingGuest
            }])
        ]);
    });

    it('function: joinConference, raises event: callStatus with reason: participantJoined', async () => {
        await Promise.all([
            peerUser2.exec('joinConference', call.callId, {audio: true, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined' && evt.call.callId === call.callId && evt.participant.userId === peerUser2.userId
            }])
        ]);
    });

    it('function: getCalls', async () => {
        const res = await peerUser1.exec('getCalls');
        assert(res && res.some(c => c.callId === call.callId));
    });

    it('function: dropParticipant, raises event: callStatus with reason: participantRemoved', async () => {
        await Promise.all([
            client.dropParticipant(call.callId, peerUser1.userId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantRemoved' && evt.call.callId === call.callId && !evt.call.participants.some(user => user.userId === peerUser1.userId)
            }])
        ]);
    });

    it('function: leaveConference, raises event: callStatus with reason: participantRemoved', async () => {
        await Promise.all([
            peerUser2.exec('leaveConference', call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantRemoved' && evt.call.callId === call.callId && !evt.call.participants.some(user => user.userId === peerUser2.userId)
            }])
        ]);
    });
    
    it('function: addParticipant, raises event: callStatus with reason: participantJoined', async () => {
        await client.addParticipant(call.convId, [peerUser1.userId], true);
        await sleep(3000); // wait to allow time so the participant can answer the call
        await Promise.all([
            peerUser1.exec('answerCall', call.callId, {audio: false, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined' && evt.call.callId === call.callId && evt.participant.userId === peerUser1.userId && !evt.participant.isMeetingGuest
            }])
        ]);
    });

    it('function: leaveConference, raises event: callStatus with reason: participantRemoved', async () => {
        await Promise.all([
            peerUser1.exec('leaveConference', call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantRemoved' && evt.call.callId === call.callId && !evt.call.participants.some(user => user.userId === peerUser1.userId)
            }])
        ]);
    });

    it('function: endCall, raises event: callStatus with reason: callStateChanged', async () => {
        await Promise.all([
            client.endCall(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.callId === call.callId && evt.call.state === 'Terminated'
            }])
        ]);
    });
});
