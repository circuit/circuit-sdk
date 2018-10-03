'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Conversation Guest Access Tests', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
        user = client.loggedOnUser;
    });
    
    it('function: changeConversationPin', async () => {
        const res = await client.changeConversationPin(conversation.convId);
        assert(res && res.conversationCreatorId === user.userId && res.pin && res.link);
    });

    it('functions: [disableGuestAccess, getConversationById]', async () => {
        await client.disableGuestAccess(conversation.convId);
        const conv = await client.getConversationById(conversation.convId);
        assert(conv.isGuestAccessDisabled);
    });

    it('functions: [enableGuestAccess, getConversationById]', async () => {
        await client.enableGuestAccess(conversation.convId);
        const conv = await client.getConversationById(conversation.convId);
        assert(!conv.isGuestAccessDisabled);
    });
});