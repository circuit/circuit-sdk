'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let conversation;
describe('Conversation Tests', () => {
    before(async () => {
        client = prep.client;
        // get the conversation by its Id to get the latest modification times
        conversation = await client.getConversationById(prep.conversation.convId); 
    });

    it('function: getConversations', async () => {
        const res = await client.getConversations();
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    // it('should get a number of participants for conversation', async () => {
    //     const res = await client.getConversations({
    //         numberOfParticipants: 1
    //     });
    //     assert(res && res.some(conv => conv.convId === conversation.convId) && res.every(conv => conv.participants.length <= 1));
    // });

    it('function: getConversations. with {numberOfConversations: 3}', async () => {
        const res = await client.getConversations({
            numberOfConversations: 3
        });
        assert(res && res.length === 3);
    });

    it('function: getConversations. with {direction: AFTER, timestamp: conversation.modificationTime - 1}', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.AFTER,
            timestamp: conversation.modificationTime - 1
        });
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('function: getConversations. with {direction: AFTER, timestamp: conversation.modificationTime + 1}', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.AFTER,
            timestamp: conversation.lastItemModificationTime + 1
        });
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });

    it('function: getConversations. with {direction: BEFORE, timestamp: conversation.lastItemModificationTime + 1}', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.BEFORE,
            timestamp: conversation.lastItemModificationTime + 1
        });
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('function: getConversations. with {direction: BEFORE, timestamp: conversation.lastItemModificationTime - 1}', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.BEFORE,
            timestamp: conversation.creationTime - 1
        });
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });
});