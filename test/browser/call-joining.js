'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
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
        const conversation = await client.createGroupConversation([peerUser1.userId, peerUser2.userId], 'SDK Test: Conference Call');
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
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('should get the call then add the other user', async () => {
        await peerUser1.exec('joinConference', call.callId, {audio: true, video: false});
        await sleep(5000);
        call = await client.findCall(call.callId);
        assert(call.participants.some(user => user.userId === peerUser1.userId));
    });

    it('should get all calls and verify it contains the active call', async () => {
        const res = await peerUser1.exec('getCalls');
        assert(res && res.some(c => c.callId === call.callId));
    });

    it('should drop user from call', async () => {
        await client.dropParticipant(call.callId, peerUser1.userId);
        await sleep(5000);
        call = await client.findCall(call.callId);
        assert(!call.participants.some(user => user.userId === peerUser1.userId));
    });

    it('should allow user to leave conference', async () => {
        await peerUser2.exec('leaveConference', call.callId);
        await sleep(5000);
        call = await client.findCall(call.callId);
        assert(!call.participants.some(user => user.userId === peerUser2.userId));
    });
    
    it('should end call', async () => {
        await client.endCall(call.callId);
        await sleep(6000);
        const res = await client.getCalls();
        assert(!res.some(c => c.callId === call.callId));
    });
});
