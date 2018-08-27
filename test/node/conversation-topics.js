'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
let topic1;
let topic2;
let topic2Item;
let topic3;
describe('Conversation Topic Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        conversation = prep.conversation;
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

    after(async () => {
        await client.logout();
    });

    it('should retreive the specified number of topics', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {maxNumberOfTopics: 2});
        assert(res && res.length === 2);
    });

    it('should NOT retreive the conversation topic', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {timestamp: topic3.creationTime - 1});
        assert(res && !res.some(topic => topic.parentItem.itemId === topic3.itemId) && res.some(topic => topic.parentItem.itemId === topic2.itemId) && res.some(topic => topic.parentItem.itemId === topic1.itemId));
    });

    it('should retreive the conversation topic', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {timestamp: topic3.creationTime + 1});
        assert(res && res.some(topic => topic.parentItem.itemId === topic3.itemId) && res.some(topic => topic.parentItem.itemId === topic2.itemId) && res.some(topic => topic.parentItem.itemId === topic1.itemId));
    });

    it('should retreive the conversation topic', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId);
        assert(res && res.some(topic => topic.parentItem.itemId === topic1.itemId && topic.parentItem.text.subject === topic1.text.subject) && res.some(topic => (topic.parentItem.itemId === topic2.itemId && topic.parentItem.text.subject === topic2.text.subject) && (topic.lastItem.itemId === topic2Item.itemId && topic.lastItem.text.content === topic2Item.text.content)) && res.some(topic => topic.parentItem.itemId === topic3.itemId && topic.parentItem.text.subject === topic3.text.subject));
    });
});