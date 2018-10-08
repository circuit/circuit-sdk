'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let conversation;
let topic1;
let topic2;
let topic2Item;
let topic3;
describe('Conversation Topic Tests', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
        topic1 = await client.addTextItem(conversation.convId, {
            subject: `${Date.now()}1`,
            content: `${Date.now()}a`
        });
        topic2 = await client.addTextItem(conversation.convId, {
            subject: `${Date.now()}2`,
            content: `${Date.now()}b`
        });
        topic2Item = await client.addTextItem(conversation.convId, {
            parentId: topic2.itemId,
            content: `${Date.now()} item2 Last Item`
        });
        topic3 = await client.addTextItem(conversation.convId, {
            subject: `${Date.now()}3`,
            content: `${Date.now()}c`
        });
    });

    it('function: getConversationTopics', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {maxNumberOfTopics: 2});
        assert(res && res.conversationTopics.length === 2 && res.hasOlderTopics);
    });

    it('function: getConversationTopics, with {timestamp:topic3.creationTime - 1}', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {timestamp: topic3.creationTime - 1});
        const topics = res.conversationTopics;
        assert(topics && !topics.some(topic => topic.parentItem.itemId === topic3.itemId) && topics.some(topic => topic.parentItem.itemId === topic2.itemId) && topics.some(topic => topic.parentItem.itemId === topic1.itemId));
    });

    it('function: getConversationTopics, with {timestamp:topic3.creationTime + 1}', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {timestamp: topic3.creationTime + 1});
        const topics = res.conversationTopics;
        assert(topics && topics.some(topic => topic.parentItem.itemId === topic3.itemId) && topics.some(topic => topic.parentItem.itemId === topic2.itemId) && topics.some(topic => topic.parentItem.itemId === topic1.itemId));
    });

    it('function: getConversationTopics', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId);
        const topics = res.conversationTopics;
        assert(topics && topics.some(topic => topic.parentItem.itemId === topic1.itemId) && topics.some(topic => topic.parentItem.itemId === topic2.itemId && topic.lastItem.itemId === topic2Item.itemId) && topics.some(topic => topic.parentItem.itemId === topic3.itemId));
    });
});