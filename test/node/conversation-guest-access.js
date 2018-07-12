'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Guest Access Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should create a conference bridge', async () => {
        const topic = `${Date.now()}a`;
        conversation = await client.createConferenceBridge(topic);
        assert(conversation && conversation.topic === topic && conversation.participants.includes(user.userId));
    });
    
    it('should change conversation pin', async () => {
        const res = await client.changeConversationPin(conversation.convId);
        assert(res && res.conversationCreatorId === user.userId && res.pin && res.link);
    });

    it('should disable guest access', async () => {
        await client.disableGuestAccess(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.isGuestAccessDisabled);
    });

    it('should enable guest access', async () => {
        await client.enableGuestAccess(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.isGuestAccessDisabled);
    });
});