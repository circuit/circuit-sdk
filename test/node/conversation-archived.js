'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
describe('Conversation Archived', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should archive the conversation and raise a conversationArchived event', async () => {
        await Promise.all([
            client.archiveConversation(global.conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationArchived',
                predicate: evt => evt.convId === global.conversation.convId
            }]) 
        ]);
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && res.some(conv => conv.convId === global.conversation.convId));
    });

    it('should unarchive the conversation and raise a conversationUnarchived event', async () => {
        await Promise.all([
            client.unarchiveConversation(global.conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUnarchived',
                predicate: evt => evt.convId === global.conversation.convId
            }]) 
        ]);
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && !res.some(conv => conv.convId === global.conversation.convId));
    });
});