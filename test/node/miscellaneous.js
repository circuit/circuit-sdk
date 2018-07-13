'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Miscellaneous Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        const topic = `${Date.now()}a`;
        conversation = await client.createConferenceBridge(topic);
    });

    after(async () => {
        await client.logout();
    });

    it('should retrieve support conversation Id', async () => {
        await client.getSupportConversationId();
    });

    it('should retrieve telephony conversation Id', async () => {
        const res = await client.getTelephonyConversationId();
        assert(res);
    });

    it('should get telephony data', async () => {
        const res = await client.getTelephonyData();
        assert(res);
    });

    it('should get past conversations', async () => {
        const res = await client.getConversations({numberOfConversations: 10});
        assert(res.some(conv => conv.convId === conversation.convId));
    });
});