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

    it('functions: [archiveConversation, getArchivedConversations], with event: conversationArchived', async () => {
        await Promise.all([
            client.archiveConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationArchived',
                predicate: evt => evt.convId === conversation.convId
            }]) 
        ]);
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('functions: [unarchiveConversation, getArchivedConversations], with event: conversationUnarchived', async () => {
        await Promise.all([
            client.unarchiveConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUnarchived',
                predicate: evt => evt.convId === conversation.convId
            }]) 
        ]);
        await helper.sleep(3000);
        const res = await client.getArchivedConversations();
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });
});