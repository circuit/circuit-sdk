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
    });

    after(async () => {
        await client.logout();
    });

    it('should create a conversation', async () => {
        const topic = `${Date.now()}a`;
        const res = await client.createConferenceBridge(topic);
        conversation = res;
        assert(conversation && conversation.topic === topic && conversation.participants.includes(user.userId));
    }); 

    it('should retrieve support conversation Id', async () => {
        await client.getSupportConversationId();
    });

    it('should retrieve telephony conversation Id', async () => {
        const res = await client.getTelephonyConversationId();
        assert(res);
    });

    it('should change conversation pin', async () => {
        const res = await client.changeConversationPin(conversation.convId);
        assert(res && res.conversationCreatorId === user.userId && res.pin && res.link);
    });

    it('should get telephony data', async () => {
        const res = await client.getTelephonyData();
        assert(res);
    });
});