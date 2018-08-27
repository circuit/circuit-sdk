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
let item;
describe('Conversation Topic Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        conversation = prep.conversation;
        item = await client.addTextItem(conversation.convId, {
            subject: `${Date.now()}xyz`,
            content: `${Date.now()}a`
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
        const res = await client.getConversationTopics(conversation.convId, {maxNumberOfTopics: 1});
        assert(res && res.length === 1);
    });

    it('should NOT retreive the conversation topic', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {timestamp: item.creationTime - 1});
        assert(res && !res.some(topic => topic.parentItem.itemId === item.itemId));
    });

    it('should retreive the conversation topic', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId, {timestamp: item.creationTime + 1});
        assert(res && res.some(topic => topic.parentItem.itemId === item.itemId));
    });

    it('should retreive the conversation topic', async () => {
        if (!client.getConversationTopics) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client.getConversationTopics(conversation.convId);
        assert(res && res.some(topic => topic.parentItem.itemId === item.itemId && topic.parentItem.text.subject === item.text.subject));
    });
});