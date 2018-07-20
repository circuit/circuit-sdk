'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../__preperation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Conversation Archived', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        conversation = prep.conversation;
    });

    after(async () => {
        await client.logout();
    });

    it('should archive the conversation and raise a conversationArchived event', async () => {
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

    it('should unarchive the conversation and raise a conversationUnarchived event', async () => {
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