'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
describe('Conversation Direct', () => {
    before(async () => {
        client = prep.client;
        user = client.loggedOnUser;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('function: createDirectConversation', async () => {
        const res = await client.createDirectConversation(user2.userId);
        conversation = res.conversation;
        assert(conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    });

    it('function: getDirectConversationWithUser', async () => {
        const res = await client.getDirectConversationWithUser(user2.emailAddress);
        assert(res && res.convId === conversation.convId && res.participants.includes(user.userId) && res.participants.includes(user2.userId));
    });

    it('function: getConversationDetails', async () => {
        const res = await client.getConversationDetails(conversation.convId);
        assert(res.conversationCreatorId === user.userId || res.conversationCreatorId === user2.userId);
    });
});