'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1, peerUser2;
let call;
describe('Call control tests', async function() {
    this.timeout(300000);

    before(async function() {
        await sleep(25000);
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
        const conversation = await client.createGroupConversation([peerUser1.userId, peerUser2.userId, 'c2e5d330-5ea2-4f85-aba1-2c00dac2991a'], 'SDK Test: Conference Call');
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
        await sleep(10000);
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('should get the call then add the other user', async () => {
        const res = await peerUser1.exec('getStartedCalls');
        await peerUser1.exec('joinConference', call.callId, {audio: true, video: false});
        assert(res.some(c => c.callId === call.callId));
    });

    it('should get the call containing the user', async () => {
        await sleep(6000);
        const res = await client.findCall(call.callId);
        assert(res.participants.some(user => user.userId === peerUser1.userId));
    });

    it('should get all calls and verify it contains the active call', async () => {
        const res = await peerUser1.exec('getCalls');
        assert(res && res.some(c => c.callId === call.callId));
    });
    // list of apis to test.
    // , , muteRtcSession, setAudioVideoStream,setMediaDevices
    //toggleRemoteAudio callStatus
    // toggleRemoteVideo callStatus
    //toggleScreenShare
    // toggleVideo
    //  . mute
    // addParticipantToCall . addParticipantToRtcSession . 
    // changeHDVideo
    // endCall .  .  . getActiveRemoteCalls
    // getAudioVideoStats . getCalls . getLastRtpStats . getLocalAudioVideoStream . getLocalScreenshareStream
    // getRemoteStreams



    it('should get the active call', async () => {
        const res = await peerUser1.exec('getActiveCall');
        assert(res.callId === call.callId);
    });

    it('should mute participant', async () => {
        await client.muteParticipant(call.callId, peerUser2.userId);
        await sleep(6000);
        // await peerUser1.exec('muteParticipant', call.callId, peerUser2.userId);
        // const res = await peerUser1.exec('findCall', call.callId);
        const res = await client.findCall(call.callId);
        assert(res.participants.find(user => user.userId === peerUser2.userId).muted);
    });

    // it('should mute the rtc session', async () => {
    //     console.log('begin');
    //     await peerUser1.exec('muteRtcSession', call.callId);
    //     await sleep(6000);
    //     const res = await peerUser1.exec('findCall', call.callId);
    //     console.log(res);
    //     assert(res.participants && res.participants.every(user => user.muted));
    // });

    it('should mute the call', async () => {
        await peerUser1.exec('mute', call.callId);
        await sleep(6000);
        const res = await peerUser1.exec('findCall', call.callId);
        assert(res.locallyMuted);
    });

    it('should unmute the call', async () => {
        await peerUser1.exec('unmute', call.callId);
        await sleep(6000);
        const res = await peerUser1.exec('findCall', call.callId);
        assert(!res.locallyMuted);
    });

    // it('should get the active remote call', async () => {
    //     const res = await peerUser1.exec('endCall', call.callId);
    //     console.log('yoooto', res);
    //     await sleep(6000);
    //     const z = await peerUser1.exec('getActiveRemoteCalls');
    //     console.log('yiiiiiiiiiiiiit', z);
    //     assert(z.some(c => c.callId === call.callId));
    // });

    it('should drop user from call', async () => {
        await client.dropParticipant(call.callId, peerUser1.userId);
        await sleep(6000);
        const res = await client.findCall(call.callId);
        assert(!res.participants.some(user => user.userId === peerUser1.userId));
    });

    it('should allow user to leave conference', async () => {
        await peerUser2.exec('leaveConference', call.callId);
        await sleep(6000);
        const res = await client.findCall(call.callId);
        assert(!res.participants.some(user => user.userId === peerUser2.userId));
    });

    // it('should add user to call with userId then leave conference', async () => {
    //     await client.addParticipantToCall(call.callId, { userId: peerUser1.userId });
    //     await sleep(6000);
    //     const joins = await client.findCall(call.callId);
    //     await peerUser2.exec('leaveConference', call.callId);
    //     await sleep(6000);
    //     const leaves = await client.findCall(call.callId);
    //     console.log('joins', joins);
    //     console.log('leaves', leaves);
    // });
    
    it('should end call', async () => {
        await client.endCall(call.callId);
        await sleep(6000);
        const res = await client.getCalls();
        console.log('p', res);
        assert(!res.some(c => c.callId === call.callId));
    });
    // it('should mute the call', async () => {
    //     await peerUser1.exec('mute', call.callId);
    //     await sleep(6000);
    //     console.log('after sleep', new Date().toLocaleTimeString());
    //     const res = await client.findCall(call.callId);
    //     console.log(res);
    //     assert(res.remotelyMuted);
    // });


    // it('should unmute the call', async () => {
    //     const res = await client.findCall(call.callId);
    //     await sleep(6000);
    //     console.log('after sleep', new Date().toLocaleTimeString());
    //     console.log(res);
    //     assert(!res.remotelyMuted);
    // });
    // it('should mute the call', async () => {
    //     const r = await client.findCall(call.callId);
    //     console.log('r', r);
    //     await client.mute(call.callId);
    //     const res = await client.findCall(call.callId);
    //     console.log(res);
    //     assert(res.remotelyMuted);
    // });
});
