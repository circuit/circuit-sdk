'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conference;
describe('Conference Bridge', () => {
    before(async () => {
        client = prep.client;
        user = client.loggedOnUser;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('function: createConferenceBridge, with event: conversationCreated', async () => {
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
   
    it('function: getConferenceInvitationText', async () => {
        if (!client.getConferenceInvitationText) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConferenceInvitationText(user.locale, conference.convId);
        if (!res || !res.includes(conference.topic)) {
            assert(false);
        }
    });

    it('function: addParticipant, with event: conversationUpdated', async () => {
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

    it('function: getConversationsByIds', async () => {
        const res = await client.getConversationsByIds([conference.convId]);
        const conf = res[0];
        assert(conf && conf.convId === conference.convId && conf.topic === conference.topic);
    });
});