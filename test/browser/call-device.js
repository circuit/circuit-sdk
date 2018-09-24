'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
let user;
let stream;
describe('Call Devices', async function() {
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

    it('should check if browser is compatible', async () => {
        const res = await Circuit.isCompatible();
        assert(res);
    });

    it('should get supported features', async () => {
        const res = await Circuit.supportedFeatures();
        assert(res.text && res.rtc);
    });

    it('should get max video resolution', async () => {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevice = mediaDevices.find(d => d.kind === 'videoinput');
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
        assert(res);
    });    
    
    it('should get local audio and video stream', async () => {
        stream = await client.getLocalAudioVideoStream();
        assert(stream);
    });    
    it('should set local audio and video stream', async () => {
        await client.setAudioVideoStream(call.callId, stream);
    });

    it('should toggle remote audio OFF', async () => {
        await sleep(5000);
        await Promise.all([
            client.toggleRemoteAudio(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'remoteStreamUpdated' && evt.call.remoteAudioDisabled
            }])
        ]);
        call = await client.findCall(call.callId);
        assert(call.remoteAudioDisabled);
    });

    it('should toggle remote audio ON', async () => {
        await sleep(5000);
        await Promise.all([
            client.toggleRemoteAudio(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'remoteStreamUpdated' && !evt.call.remoteAudioDisabled
            }])
        ]);
        call = await client.findCall(call.callId);
        assert(!call.remoteAudioDisabled);
    });

    it('should get remote streams', async () => {
        const res = await client.getRemoteStreams(call.callId);
        assert(res);
    });

    it('should toggle remote video OFF', async () => {
        await sleep(5000);
        await Promise.all([
            client.toggleRemoteVideo(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'sdpConnected' && evt.call.remoteVideoDisabled
            }])
        ]);
        call = await client.findCall(call.callId);
        assert(call.remoteVideoDisabled);
    });

    it('should toggle remote video ON', async () => {
        await sleep(5000);
        await Promise.all([
            client.toggleRemoteVideo(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'sdpConnected' && !evt.call.remoteVideoDisabled
            }])
        ]);
        call = await client.findCall(call.callId);
        assert(!call.remoteVideoDisabled);
    });

    it('should set media devices', async () => {
        const  mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevice = mediaDevices.find(d => d.kind === 'videoinput');
        const audioInputDevice = mediaDevices.find(d => d.kind === 'audioinput');
        const audioOutputDevice = mediaDevices.find(d => d.kind === 'audiooutput');
        let devices = {
            recording: audioInputDevice.deviceId,
            playback: audioOutputDevice.deviceId,
            video: videoInputDevice.deviceId,
            ringiing: audioOutputDevice.deviceId
        }
        await Promise.all([
            client.setMediaDevices(devices),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged'
            }])
        ]);
    });
});