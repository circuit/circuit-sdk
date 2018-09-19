'use strict';

import { PeerUser } from '../peer-user.js';
import { expectEvents, updateRemoteVideos, sleep, logEvents } from '../helper.js';
import config from './config.js'

const assert = chai.assert;
let client;
let peerUser1, peerUser2;
let call;
describe('A...', async function() {
    this.timeout(60000);

    before(async function() {
        Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);
        client = new Circuit.Client(config.config);
        const res = await Promise.all([PeerUser.create(), PeerUser.create(), client.logon(config.credentials)]);
        peerUser1 = res[0];
        peerUser2 = res[1];
        const conversation = await client.createConferenceBridge('SDK Test: Conference Call');
        await client.addParticipant(conversation.convId, ['c2e5d330-5ea2-4f85-aba1-2c00dac2991a'], true);
        call = await client.startConference(conversation.convId, {audio: false, video: false});
        // await expectEvents(client, [{
        //     type: 'callStatus',
        //     predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Initiated
        // }, {
        //     type: 'callStatus',
        //     predicate: evt => evt.call.state === Circuit.Enums.CallStateName.Waiting
        // }]);
    });

    after(async function() {
        await Promise.all([peerUser1.destroy(), peerUser2.destroy(), client.logout()]);
    });

    afterEach(async function() {
        client.removeAllListeners();
    });

    it('should add participant to call', async () => {
        await client.addParticipantToRtcSession(call.callId, { userId: peerUser1.userId });
        await sleep(15000);
        await Promise.all([
            peerUser1.exec('joinConference', call.callId, {audio: false, video: false}),
            expectEvents(client, [{
                type: 'callStatus',
                predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
            }, {
                type: 'callStatus',
                predicate: evt => evt.reason === 'participantJoined'
            }])
        ]);
        await sleep(5000);
        call = await client.findCall(call.callId);
        console.log(call);
    });


    // it('should get callStatus event for remoteStreamUpdated and callStateChanged:Active upon users joining', async () => {
    //     await sleep(5000); // wait to make sure the call is ready to be joined
    //     updateRemoteVideos(client);
    //     const res = await Promise.all([
    //         peerUser1.exec('joinConference', call.callId, {audio: false, video: false}),
    //         peerUser2.exec('joinConference', call.callId, {audio: false, video: false}),
    //         expectEvents(client, [{
    //             type: 'callStatus',
    //             predicate: evt => evt.reason === 'callStateChanged' && evt.call.state === Circuit.Enums.CallStateName.Active
    //         }, {
    //             type: 'callStatus',
    //             predicate: evt => evt.reason === 'participantJoined'
    //         }])
    //     ]);
    //     assert(res[2].call.callId === call.callId);
    // });

    // it('should end conference and get callEnded event', async () => {
    //     updateRemoteVideos(client);
    //     const res = await Promise.all([client.endConference(call.callId), expectEvents(client, ['callEnded'])]);
    //     document.querySelector('#localVideo').src = '';
    //     assert(res[1].call.callId === call.callId);
    // });
});
