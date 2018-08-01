'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
let timeElapsed;
describe('Conversation Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
        conversation = prep.conversation;
        timeElapsed = Date.now() - conversation.creationTime;
        // conversation = await client.createConferenceBridge(`${Date.now()}title`);
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should get', async () => {
        const res = await client.getConversations({
            direction: 'AFTER',
            timestamp: conversation.creationTime - 1000 - timeElapsed
        });
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });

    it('should not', async () => {
        const res = await client.getConversations({
            direction: 'AFTER',
            timestamp: conversation.creationTime + 1000 + timeElapsed
        });
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('should ...', async () => {
        const res = await client.getConversations({
            direction: 'BEFORE',
            timestamp: conversation.creationTime - 1000 - timeElapsed
        });
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });

    it('should ...', async () => {
        const res = await client.getConversations({
            direction: 'BEFORE',
            timestamp: conversation.creationTime + 1000 + timeElapsed
        });
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('should ...', async () => {
        const res = await client.getConversations();
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });
});