'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Conversation Archived', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should create a conference', async () => {
        const topic = `${Date.now()}a`;
        const res = await client.createConferenceBridge(topic);
        conversation = res;
        assert(conversation && conversation.topic === topic && conversation.participants.includes(user.userId));
    }); 

    it('should archive the conversation', async () => {
        await client.archiveConversation(conversation.convId);
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('should unarchive the conversation', async () => {
        await client.unarchiveConversation(conversation.convId);
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });
});