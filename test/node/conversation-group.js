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
let createdConversation;
describe('Group Conversation', () => {

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

    it('should create a group conversation', async () => {
        const topic = `${Date.now()}a`;
        const res = await Promise.all([
            client.createGroupConversation([user2.userId], topic),
            helper.expectEvents(client, [{
                type: 'conversationCreated',
                predicate: evt => evt.conversation.topic === topic && evt.conversation.participants.includes(user.userId) && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        createdConversation = res[0];
        assert(createdConversation && createdConversation.participants.includes(user.userId) && createdConversation.participants.includes(user2.userId));
    });

    it('should get the group conversation by its Id', async () => {
        const res = await client.getConversationById(createdConversation.convId);
        assert(res && res.convId === createdConversation.convId && res.participants.includes(user.userId) && res.participants.includes(user2.userId));
    });

    it('should remove the second participant from the conversation', async () => {
        const res = await Promise.all([
            client.removeParticipant(createdConversation.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === createdConversation.convId && !evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[1].conversation.convId === createdConversation.convId && !res[1].conversation.participants.includes(user2.userId)) {  
            createdConversation = res[1].conversation;
            assert(true);
        } else {
            assert(false);
        }
    });

    it('should add the second participant to the comversation', async () => {
        const res = await Promise.all([
            client.addParticipant(createdConversation.convId, user2.userId),
            helper.expectEvents(client, [{
                type: 'conversationUpdated',
                predicate: evt => evt.conversation.convId === createdConversation.convId && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        if (res[0].convId === createdConversation.convId && res[0].participants.includes(user2.userId)) {  
            createdConversation = res[0];
            assert(true);
        } else {
            assert(false);
        }
    });

    it('should get the participants of the conversation', async () => {
        const res = await client.getConversationParticipants(createdConversation.convId);
        res.participants.forEach(participant => {
            if (!(participant.userId === user.userId || participant.userId === user2.userId)) {
                assert(false);
            }
        });
    });

    it('should get the details of the conversation', async () => {
        const res = await client.getConversationDetails(createdConversation.convId);
        assert(res.conversationCreatorId === user.userId);
    });

    it('should get the last 5 conversations and check if it contains the new converstion', async () => {
        const res = await client.getConversations({numberOfConversations: 5});
        const convIds = [];
        res.forEach(conv => convIds.push(conv.convId));
        assert(convIds.includes(createdConversation.convId));
    });
});