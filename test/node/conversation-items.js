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

    it('should add a simple text item and raise an itemAdded event', async () => {
        const textValue = `${Date.now()}a`;
        const res  = await Promise.all([
            client.addTextItem(conversation.convId, textValue),
            helper.expectEvents(client, [{
                type: 'itemAdded',
                predicate: evt => evt.item.convId === conversation.convId
            }])           
        ]);
        item.itemId = res[0].itemId;
        item.content = res[0].text.content;
        assert(res[0].convId === conversation.convId && res[0].text.content === textValue);
    });
    
    it('should update a simple text item and raise an itemAdded event', async () => {
        const textValue = `${Date.now()}b`;
        const subject = `${Date.now()}c`;
        const content = {
            itemId: item.itemId,
            subject: subject,
            content: textValue,     
        }
        const res  = await Promise.all([
            client.updateTextItem(content),
            helper.expectEvents(client, [{
                type: 'itemUpdated',
                predicate: evt => evt.item.convId === conversation.convId && evt.item.itemId === item.itemId
            }])           
        ]);
        item.content = res[0].text.content;
        assert(res[0].itemId === item.itemId && res[0].text.content === textValue && res[0].text.subject === subject);
    }); 

    it('should get conversation feed', async () => {
        const res  = await client.getConversationFeed(conversation.convId);
        assert(res && res.threads.some(thread => thread.parentItem.convId === conversation.convId && thread.parentItem.itemid === item.itemid));
    });

    it('should get conversation items', async () => {
        const res  = await client.getConversationItems(conversation.convId);
        assert(res.some(conversationItem => conversationItem.itemId === item.itemId));
    }); 
 
    it('should flag item and get flagged item', async () => {
        await client.flagItem(conversation.convId, item.itemId);
        const res = await client.getFlaggedItems();
        assert(res && res.some(conv => conv.conversationId === conversation.convId && conv.conversationItemData.some(i => i.itemId === item.itemId)));
    });
    
    it('should unflag item', async () => {
        await client.unflagItem(conversation.convId, item.itemId);
        const res = await client.getFlaggedItems();
        assert(res && !res.some(conv => conv.conversationId === conversation.convId && conv.conversationItemData.some(i => i.itemId === item.itemId)));
    });

    it('should like item', async () => {
        await client.likeItem(item.itemId);
        const res = await client.getItemById(item.itemId);
        assert(res.text.likedByUsers.includes(user.userId));
    });

    it('should unlike item', async () => {
        await client.unlikeItem(item.itemId);
        const res = await client.getItemById(item.itemId);
        assert(!res.text.likedByUsers || !res.text.likedByUsers.includes(user.userId));
    });
});