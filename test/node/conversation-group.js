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
let conversation;
describe('Conversation Group', () => {
    before(async () => {
        client = prep.client;
        user = client.loggedOnUser;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('function: createGroupConversation, with event: conversationCreated', async () => {
        const topic = `${Date.now()}a`;
        const res = await Promise.all([
            client.createGroupConversation([user2.userId], topic),
            helper.expectEvents(client, [{
                type: 'conversationCreated',
                predicate: evt => evt.conversation.topic === topic && evt.conversation.participants.includes(user.userId) && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        conversation = res[0];
        assert(conversation && conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    });

    it('function: getConversationById', async () => {
        const res = await client.getConversationById(conversation.convId);
        assert(res && res.convId === conversation.convId && res.participants.includes(user.userId) && res.participants.includes(user2.userId));
    });

    it('function: removeParticipant, with event: conversationUpdated', async () => {
        const res = await Promise.all([
            client.removeParticipant(conversation.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && !evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[1].conversation.convId === conversation.convId && !res[1].conversation.participants.includes(user2.userId)) {  
            conversation = res[1].conversation;
            assert(true);
        } else {
            assert(false);
        }
    });

    it('function: addParticipant, with event: conversationUpdated', async () => {
        const res = await Promise.all([
            client.addParticipant(conversation.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[0].convId === conversation.convId && res[0].participants.includes(user2.userId)) {  
            conversation = res[0];
            assert(true);
        } else {
            assert(false);
        }
    });

    it('function: getConversationParticipants', async () => {
        const res = await client.getConversationParticipants(conversation.convId);
        assert(res && res.participants.some(u => u.userId === user.userId) && res.participants.some(u => u.userId === user2.userId));
    });

    it('function: updateConversation, with event: conversationUpdated', async () => {
        const topic = `${Date.now()}z`;
        const data = {
            topic: topic
        }
        const res = await Promise.all([
            client.updateConversation(conversation.convId, data),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && evt.conversation.topic === topic
            }])
        ]);
        const convId = conversation.convId;
        conversation = res[0];
        assert(conversation.convId === convId && conversation.topic === topic);
    });

    // Requires MODERATION permission
    it('functions: [moderateConversation, getConversationById], with event: conversationUpdated', async () => {
        await Promise.all([
            client.moderateConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && evt.conversation.moderators.includes(user.userId)
            }])            
        ]);
        const res = await client.getConversationById(conversation.convId);
        assert(res.convId === conversation.convId && res.moderators.includes(user.userId));
    });

    it('functions: [unmoderateConversation, getConversationById], with event: conversationUpdated', async () => {
        await Promise.all([
            client.unmoderateConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === conversation.convId && (!evt.conversation.moderators || !evt.conversation.moderators.includes(user.userId))
            }])            
        ]);
        const res = await client.getConversationById(conversation.convId);
        assert(res.convId === conversation.convId && (!res.moderators || !res.moderators.includes(user.userId)));
    });
});