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
        const conversation = await client.createGroupConversation([peerUser2.userId], 'SDK Test: Conference Call');
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

    it('should get started calls', async () => {
        const res = await peerUser2.exec('getStartedCalls');
        assert(res.some(c => c.callId === call.callId));
    })

    it('should add participant to call with addParticipantToCall and check they are a guest', async () => {
        await Promise.all([
            client.addParticipantToCall(call.callId, { userId: peerUser1.userId }),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantAdded' && evt.call.callId === call.callId && evt.participant.userId === peerUser1.userId
            }])
        ]);
        await sleep(3000);
        await Promise.all([
            peerUser1.exec('answerCall', call.callId, {audio: false, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined' && evt.call.callId === call.callId && evt.participant.userId === peerUser1.userId && evt.participant.isMeetingGuest
            }])
        ]);
    });

    it('should allow other user to join the conference', async () => {
        await Promise.all([
            peerUser2.exec('joinConference', call.callId, {audio: true, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined' && evt.call.callId === call.callId && evt.participant.userId === peerUser2.userId
            }])
        ]);
    });

    it('should get all calls and verify it contains the active call', async () => {
        const res = await peerUser1.exec('getCalls');
        assert(res && res.some(c => c.callId === call.callId));
    });

    it('should drop user from call and raise a callStatus event with reason: participantRemoved', async () => {
        await Promise.all([
            client.dropParticipant(call.callId, peerUser1.userId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantRemoved' && evt.call.callId === call.callId && !evt.call.participants.some(user => user.userId === peerUser1.userId)
            }])
        ]);
    });

    it('should allow user to leave conference and raise a callStatus event with reason: participantRemoved', async () => {
        await Promise.all([
            peerUser2.exec('leaveConference', call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantRemoved' && evt.call.callId === call.callId && !evt.call.participants.some(user => user.userId === peerUser2.userId)
            }])
        ]);
    });
    
    it('should add participant to call with addParticipant and check that they are NOT a guest', async () => {
        await client.addParticipant(call.convId, [peerUser1.userId], true);
        await sleep(3000);
        await Promise.all([
            peerUser1.exec('answerCall', call.callId, {audio: false, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined' && evt.call.callId === call.callId && evt.participant.userId === peerUser1.userId && !evt.participant.isMeetingGuest
            }])
        ]);
    });

    it('should allow user to leave conference and raise a callStatus event with reason: participantRemoved', async () => {
        await Promise.all([
            peerUser1.exec('leaveConference', call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantRemoved' && evt.call.callId === call.callId && !evt.call.participants.some(user => user.userId === peerUser1.userId)
            }])
        ]);
    });

    it('should end call', async () => {
        await client.endCall(call.callId);
        await sleep(3000);
        const res = await client.getCalls();
        assert(!res.some(c => c.callId === call.callId));
    });
});
