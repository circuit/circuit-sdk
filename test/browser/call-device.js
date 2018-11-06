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
        const conversation = await client.createGroupConversation([peerUser.userId], 'SDK Test: Call Devices');
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

    it('function: isCompatible', async () => {
        const res = await Circuit.isCompatible();
        assert(res);
    });

    it('function: supportedFeatures', async () => {
        const res = await Circuit.supportedFeatures();
        assert(res.text && res.rtc);
    });

    it('function: getMaxVideoResolution', async () => {
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

    it('function: getDevices', async () => {
        const res = await client.getDevices();
        assert(res.some(dev => dev.clientId === user.clientId));
    });

    it('function: getAudioVideoStats', async () => {
        let flag = false; // flag used to check if one of the audio/video stats is a stream
        const res = await client.getAudioVideoStats();
        res.forEach(stat => stat.type === 'stream' ? flag = true : false);
        assert(flag);
    });    
    
    it('function: getLocalAudioVideoStream', async () => {
        stream = await client.getLocalAudioVideoStream();
        assert(stream);
    });    
    it('function: setAudioVideoStream', async () => {
        await client.setAudioVideoStream(call.callId, stream);
    });

    it('function: toggleRemoteAudio [OFF], raises event: callStatus with reason: remoteStreamUpdated', async () => {
        await Promise.all([
            client.toggleRemoteAudio(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'remoteStreamUpdated' && evt.call.callId === call.callId && evt.call.remoteAudioDisabled
            }])
        ]);
    });

    it('function: toggleRemoteAudio [ON], raises event: callStatus with reason: remoteStreamUpdated', async () => {
        await Promise.all([
            client.toggleRemoteAudio(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'remoteStreamUpdated' && evt.call.callId === call.callId && !evt.call.remoteAudioDisabled
            }])
        ]);
    });

    it('function: getRemoteStreams', async () => {
        const res = await client.getRemoteStreams(call.callId);
        assert(res);
    });

    it('function: toggleRemoteVideo [OFF], raises event: callStatus with reason: sdpConnected', async () => {
        await Promise.all([
            client.toggleRemoteVideo(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'sdpConnected' && evt.call.callId === call.callId && evt.call.remoteVideoDisabled
            }])
        ]);
    });

    it('function: toggleRemoteVideo [ON], raises event: callStatus with reason: sdpConnected', async () => {
        await Promise.all([
            client.toggleRemoteVideo(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'sdpConnected' && evt.call.callId === call.callId && !evt.call.remoteVideoDisabled
            }])
        ]);
    });

    it('function: setMediaDevices, raises event: callStatus with reason: callStateChanged', async () => {
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
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.callId === call.callId
            }])
        ]);
    });
});