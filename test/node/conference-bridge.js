'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conference;
describe('Conference Bridge', () => {

    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should create a conference bridge', async () => {
        const topic = `${Date.now()}a`;
        const res = await Promise.all([
            client.createConferenceBridge(topic),
            helper.expectEvents(client, [{
                type: 'conversationCreated',
                predicate: evt => evt.conversation.topic === topic && evt.conversation.creatorId === user.userId
            }])
        ]);
        conference = res[0];
        assert(conference && conference.topic === topic && conference.creatorId === user.userId);
    });
   
    it('should get the conference invitation HTML', async () => {
        if (!client.getConferenceInvitationText) {
            console.log('    > API not supported by circuit.');
            assert(true);
        }
        const res = await client.getConferenceInvitationText(user.locale, conference.convId);
        if (!res || !res.includes(conference.topic)) {
            assert(false);
        }
    });

    it('should add the second participant to the conference', async () => {
        const res = await Promise.all([
            client.addParticipant(conference.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conference.convId && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[0].convId === conference.convId && res[0].participants.includes(user2.userId)) {  
            conference = res[0];
            assert(true);
        } else {
            assert(false);
        }
    });

    it('should get the conference by its Id', async () => {
        const res = await client.getConversationsByIds([conference.convId]);
        const conf = res && res[0];
        assert(conf && conf.convId === conference.convId && conf.topic === conference.topic);
    });
});