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
describe('Conversation Moderator', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
        user = client.loggedOnUser;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('functions: [moderateConversation, getConversationById]', async () => {
        await client.moderateConversation(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.isModerated && conversation.moderators.includes(user.userId));
    });

    it('functions: [grantModeratorRights, getConversationById]', async () => {
        await client.grantModeratorRights(conversation.convId, user2.userId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.moderators.includes(user2.userId));
    });

    it('functions: [dropModeratorRights, getConversationById]', async () => {
        await client.dropModeratorRights(conversation.convId, user2.userId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.moderators || !conversation.moderators.includes(user2.userId));
    });

    it('functions: [unmoderateConversation, getConversationById]', async () => {
        await client.unmoderateConversation(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.isModerated);
    });
});