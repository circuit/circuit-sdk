'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let conversation;
describe('Conversation Archived', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
    });

    it('function: archiveConversation, with event: conversationArchived', async () => {
        await Promise.all([
            client.archiveConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationArchived',
                predicate: evt => evt.convId === conversation.convId
            }]) 
        ]);
    });

    it('function: getArchivedConversations', async () => {
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && res.some(conv => conv.convId === conversation.convId));
    }).timeout(7000);    

    it('function: unarchiveConversation, with event: conversationUnarchived', async () => {
        await Promise.all([
            client.unarchiveConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUnarchived',
                predicate: evt => evt.convId === conversation.convId
            }]) 
        ]);
    });

    it('function: getArchivedConversations', async () => {
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    }).timeout(7000);
});