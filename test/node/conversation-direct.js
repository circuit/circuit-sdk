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
let conversation;
describe('Direct Conversation', () => {
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

    it('should create a direct conversation', async () => {
        const res = await client.createDirectConversation(user2.userId);
        conversation = res.conversation;
        assert(conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    });

    it('should get the direct conversation by its email', async () => {
        const res = await client.getDirectConversationWithUser(user2.emailAddress);
        assert(res && res.convId === conversation.convId && res.participants.includes(user.userId) && res.participants.includes(user2.userId));
    });

    it('should get the details of the conversation', async () => {
        const res = await client.getConversationDetails(conversation.convId);
        assert(res.conversationCreatorId === user.userId || res.conversationCreatorId === user2.userId);
    });
});