'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
describe('Guest Access Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });
    
    it('should change conversation pin', async () => {
        const res = await client.changeConversationPin(conversation.convId);
        assert(res && res.conversationCreatorId === user.userId && res.pin && res.link);
    });

    it('should disable guest access', async () => {
        await client.disableGuestAccess(global.conversation.convId);
        const conversation = await client.getConversationById(global.conversation.convId);
        assert(conversation.isGuestAccessDisabled);
    });

    it('should enable guest access', async () => {
        await client.enableGuestAccess(global.conversation.convId);
        const conversation = await client.getConversationById(global.conversation.convId);
        assert(!conversation.isGuestAccessDisabled);
    });
});