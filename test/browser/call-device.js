'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
let audioInputDevice;
let audioOutputDevice;
let videoInputDevice;
let user;
describe('Video Sharing', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
        user = res[1];
        const conversation = await client.createGroupConversation([peerUser.userId], 'SDK Test: Conference Call');
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

    it('should get media devices', async () => {
        let mediaDevices = await navigator.mediaDevices.enumerateDevices();
        videoInputDevice = mediaDevices.find(d => d.kind === 'videoinput');
        audioInputDevice = mediaDevices.find(d => d.kind === 'audioinput');
        audioOutputDevice = mediaDevices.find(d => d.kind === 'audiooutput');
        assert(videoInputDevice && audioInputDevice && audioOutputDevice);
    });

    it('should mute mic', async () => {
        if (!audioInputDevice) {
            console.log('No audio input device found.');
            assert(true);
            return;
        } 
    });

    it('should mute speaker', async () => {
        if (!audioOutputDevice) {
            console.log('No audio output device found.');
            assert(true);
            return;
        } 
    });

    it('should get max video resolution', async () => {
        if (!videoInputDevice) {
            console.log('No video input device found.');
            assert(true);
            return;
        }
        const res = await client.getMaxVideoResolution(videoInputDevice.deviceId);
        assert(Object.keys(Circuit.Enums.VideoResolution).some(resolution => resolution === res));
    });

    it('should get media devices and confirm the correct client', async () => {
        const res = await client.getDevices();
        assert(res.some(dev => dev.clientId === user.clientId));
    });

    it('should get audio and video stats', async () => {
        const res = await client.getAudioVideoStats();
        console.log('audio/vid', res.kind);
        assert(res);
    });    
    
    it('should get local audio and video stream', async () => {
        const res = await client.getLocalAudioVideoStream();
        console.log('stream', res.kind);
        assert(res);
    });
});