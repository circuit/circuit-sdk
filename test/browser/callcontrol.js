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
        await sleep(5000);
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
        await sleep(5000);
        const res = await client.findCall(call.callId);
        assert(res.participants.some(user => user.userId === peerUser1.userId));
    });

    // it('should getLocalAudioVideoStream', async () => {
    //     const res = await client.getLocalAudioVideoStream();
    //     console.log(res);
    // });
    
    it('should get all calls and verify it contains the active call', async () => {
        const res = await peerUser1.exec('getCalls');
        assert(res && res.some(c => c.callId === call.callId));
    });
    
    it('should record call and delete recording', async () => {
        console.log('12345 go!');
        await client.startRecording(call.callId);
        await sleep(5000);
        await client.stopRecording(call.callId);
        await sleep(5000);
        let items = await client.getConversationItems(call.convId);
        items = items.reverse();
        console.log('----', items);
        const item = items.find(i => i.type === 'SYSTEM');
        console.log('item', item);
        await client.deleteRecording(item.itemId);
        const res = await client.getConversationItems(call.convId);
        console.log('rrrrrr', res);
        assert(item && !res.some(i => i.itemId === item.itemId));
    });
    // needs extention:
    // toggleScreenShare, getLocalScreenshareStream, setScreenshareStream

    // list of apis to test.
    // , , muteRtcSession, setAudioVideoStream,setMediaDevices
    //toggleRemoteAudio callStatus
    // toggleRemoteVideo callStatus
    //
    // toggleVideo
    //  . mute
    // addParticipantToCall . addParticipantToRtcSession . 
    // changeHDVideo
    //  .  .  . getActiveRemoteCalls
    // getAudioVideoStats .  .  . getLocalAudioVideoStream . 
    // getRemoteStreams

    it('should get last rtp stats', async () => {
        const res = await client.getLastRtpStats(call.callId);
        assert(res.some(stat => stat.pcType === 'AUDIO/VIDEO'));
    });

    it('should get the active call', async () => {
        const res = await peerUser1.exec('getActiveCall');
        assert(res.callId === call.callId);
    });


    // Can't do this test requires Chrome extention.
    // it('should toggle screen share on then off', async () => {
    //     await client.toggleScreenShare(call.callId);
    //     await sleep(5000);
    //     call = await client.findCall(call.callId);
    //     console.log('---', call);
    //     const res1 = call.localVideoUrl;
    //     await client.toggleScreenShare(call.callId);
    //     await sleep(5000);
    //     call = await client.findCall(call.callId);
    //     console.log('---', call);
    //     const res2 = !call.localVideoUrl;
    //     assert(res1 && !res2);
    // });

    // it('should get local audio video stream', async () => {
    //     const res = await peerUser1.exec('getLocalAudioVideoStream');
    //     console.log('---', res);
    // });


    it('should mute participant', async () => {
        await peerUser1.exec('muteParticipant', call.callId, peerUser2.userId);
        // await client.muteParticipant(call.callId, peerUser2.userId);
        await sleep(5000);
        const res = await peerUser1.exec('findCall', call.callId);
        assert(res.participants.find(user => user.userId === peerUser2.userId).muted);
    });

    // it('should mute the rtc session', async () => {
    //     await client.muteRtcSession(call.callId);
    //     await sleep(5000);
    //     const res = await client.findCall(call.callId);
    //     console.log(res);
    //     const user = await client.getLoggedOnUser();
    //     assert(res.participants.find(u => u.userId === user.userId).muted);
    // });

    it('should mute the call', async () => {
        await peerUser1.exec('mute', call.callId);
        await sleep(5000);
        const res = await peerUser1.exec('findCall', call.callId);
        assert(res.locallyMuted);
    });

    it('should unmute the call', async () => {
        await peerUser1.exec('unmute', call.callId);
        await sleep(5000);
        const res = await peerUser1.exec('findCall', call.callId);
        assert(!res.locallyMuted);
    });

    it('should drop user from call', async () => {
        await client.dropParticipant(call.callId, peerUser1.userId);
        await sleep(5000);
        const res = await client.findCall(call.callId);
        assert(!res.participants.some(user => user.userId === peerUser1.userId));
    });

    it('should allow user to leave conference', async () => {
        await peerUser2.exec('leaveConference', call.callId);
        await sleep(5000);
        const res = await client.findCall(call.callId);
        console.log(res);
        assert(!res.participants.some(user => user.userId === peerUser2.userId));
    });
    
    // it('should pull remote call', async () => {
    //     await peerUser2.exec('pullRemoteCall', call.callId);
    //     const res = await peerUser2.exec('findCall', call.callId);
    //     console.log(res);
    // });
    
    it('should end call', async () => {
        await client.endCall(call.callId);
        await sleep(6000);
        const res = await client.getCalls();
        assert(!res.some(c => c.callId === call.callId));
    });
});
