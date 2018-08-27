'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Conversation Guest Access Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        conversation = prep.conversation;
    });

    after(async () => {
        await client.logout();
    });
    
    it('should change conversation pin', async () => {
        const res = await client.changeConversationPin(conversation.convId);
        assert(res && res.conversationCreatorId === user.userId && res.pin && res.link);
    });

    it('should disable guest access', async () => {
        await client.disableGuestAccess(conversation.convId);
        const conv = await client.getConversationById(conversation.convId);
        assert(conv.isGuestAccessDisabled);
    });

    it('should enable guest access', async () => {
        await client.enableGuestAccess(conversation.convId);
        const conv = await client.getConversationById(conversation.convId);
        assert(!conv.isGuestAccessDisabled);
    });
});