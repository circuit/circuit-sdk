'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, sleep } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser;
let call;
let recording;
describe('Call Recording', async function() {
    this.timeout(300000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), client.logon(config.credentials)]);
        peerUser = res[0];
        const conversation = await client.createGroupConversation([peerUser.userId], 'SDK Test: Call Recording');
        call = await client.startConference(conversation.convId, {audio: false, video: false});
        await expectEvents(client, [{
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        }, {
            type: 'callStatus',
            predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        }]);
        await sleep(5000);
        await Promise.all([
            peerUser.exec('joinConference', call.callId, {audio: false, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
            }, {
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined'
            }])
        ]);
        call = await client.findCall(call.callId);
        document.querySelector('#localVideo').srcObject = call.localStreams.video;
    });

    after(async function() {
        document.querySelector('#localVideo').srcObject = null;
        await Promise.all([peerUser.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('functions: [startRecording, stopRecording], raises event: callStatus with reason: callRecording', async () => {
        await Promise.all([
            client.startRecording(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callRecording' && evt.call.recording.state === Circuit.Enums.RecordingInfoState.STARTED

            }])
        ]);
        await sleep(3000); // allow 3 seconds for the recording time
        await Promise.all([
            client.stopRecording(call.callId),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callRecording' && evt.call.recording.state === Circuit.Enums.RecordingInfoState.STOPPED
            }])
        ]);
        // user must end call before the recording appears
        await Promise.all([
            client.leaveConference(call.callId),
            peerUser.exec('leaveConference', call.callId),
        ]);
        await sleep(3000);
        const res = await client.getConversationItems(call.convId);
        recording = res.find(item => item.type === Circuit.Enums.ConversationItemType.RTC && item.rtc);
        assert(recording);
    });

    it('function: deleteRecording, raises event: itemUpdated', async () => {
        await Promise.all([
            client.deleteRecording(recording.itemId),
            expectEvents(client, [{
                type: 'itemUpdated',
                predicate: evt => evt.item.itemId === recording.itemId && evt.item.rtc.type === Circuit.Enums.RTCItemType.ENDED
            }]) 
        ]);
    });
});
