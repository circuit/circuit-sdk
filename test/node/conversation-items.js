'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
let item = {};
describe('Conversation Items', () => {

    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should create a group conversation and raise a conversationCreated event', async () => {
        const topic = `${Date.now()}a`;
        const res = await Promise.all([
            client.createGroupConversation([user2.userId], topic),
            helper.expectEvents(client, [{
                type: 'conversationCreated',
                predicate: evt => evt.conversation.topic === topic && evt.conversation.participants.includes(user.userId) && evt.conversation.participants.includes(user2.userId)
            }])
        ]);
        conversation = res[0];
        assert(conversation && conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    });

    it('should add a text item to the conversation and raise an itemAdded event', async () => {
        const textValue = `${Date.now()}a`;
        const res  = await Promise.all([
            client.addTextItem(conversation.convId, textValue),
            helper.expectEvents(client, [{
                type: 'itemAdded',
                predicate: evt => evt.item.convId === conversation.convId && evt.item.itemId
            }])           
        ]);
        // console.log(res[1]);
        item.itemId = res[0] && res[0].itemId;
        item.content = res[0] && res[0].text.content;
        assert(res[0] && conversation && res[0].convId === conversation.convId && res[0].text.content === textValue);
    }); 

    it('should get conversation feed', async () => {
        const res  = await client.getConversationFeed(conversation.convId);
        assert(res && res.threads.some(thread => thread.parentItem.convId === conversation.convId && thread.parentItem.itemid === item.itemid));
    });

    it('should get conversation items', async () => {
        const res  = await client.getConversationItems(conversation.convId);
        assert(res.some(conversationItem => conversationItem.itemId === item.itemId));
    }); 

});