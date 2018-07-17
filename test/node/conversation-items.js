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
        const topic = `${Date.now()}a`;
        conversation = await client.createGroupConversation([user2.userId], topic);
    });

    after(async () => {
        await client.logout();
        await client2.logout();
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
        item = res[0];
        assert(item.convId === conversation.convId && item.text.content === textValue);
    });
    
    it('should update a complex text item and raise an itemUpdated event', async () => {
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
        item = res[0];
        assert(item.itemId === content.itemId && item.text.content === textValue && item.text.subject === subject);
    });

    it('should get conversation feed', async () => {
        const res  = await client.getConversationFeed(conversation.convId);
        assert(res && res.threads.some(thread => thread.parentItem.convId === conversation.convId && thread.parentItem.itemid === item.itemid));
    });

    it('should get conversation items', async () => {
        const options = {   
            creationDate: item.creationTime - 1,
            direction: 'AFTER'
        }
        const res  = await client.getConversationItems(conversation.convId, options);
        assert(res.some(conversationItem => conversationItem.itemId === item.itemId));
    }); 

    it('should flag item and get flagged item', async () => {
        if (!Circuit.supportedEvents.includes('itemFlagged')) {
            console.log('Event not supported.');
            assert(true);
            return;
        }
        await Promise.all([
            client.flagItem(conversation.convId, item.itemId),
            helper.expectEvents(client, [{
                type: 'itemFlagged',
                predicate: evt => evt.convId === conversation.convId && evt.itemId === item.itemId
            }])         
        ]);
        const res = await client.getFlaggedItems();
        assert(res && res.some(conv => conv.conversationId === conversation.convId && conv.conversationItemData.some(i => i.itemId === item.itemId)));
    });
    
    it('should unflag item', async () => {
        if (!Circuit.supportedEvents.includes('itemUnflagged')) {
            console.log('Event not supported.');
            assert(true);
            return;
        }
        await Promise.all([
            client.unflagItem(conversation.convId, item.itemId),
            helper.expectEvents(client, [{
                type: 'itemUnflagged',
                predicate: evt => evt.convId === conversation.convId && evt.itemId === item.itemId
            }])         
        ]);
        const res = await client.getFlaggedItems();      
        assert(res && !res.some(conv => conv.conversationId === conversation.convId && conv.conversationItemData.some(i => i.itemId === item.itemId)));
    });

    it('should like item and raise an itemUpdated event', async () => {
        await Promise.all([
            client.likeItem(item.itemId),
            helper.expectEvents(client, [{
                type: 'itemUpdated',
                predicate: evt => evt.item.itemId === item.itemId && evt.item.convId === conversation.convId
            }]) 
        ]);
        const res = await client.getItemById(item.itemId);
        assert(res.text.likedByUsers.includes(user.userId));
    });

    it('should unlike item and raise an itemUpdated event', async () => {
        await Promise.all([
            client.unlikeItem(item.itemId),
            helper.expectEvents(client, [{
                type: 'itemUpdated',
                predicate: evt => evt.item.itemId === item.itemId && evt.item.convId === conversation.convId
            }]) 
        ]);
        const res = await client.getItemById(item.itemId);
        assert(!res.text.likedByUsers || !res.text.likedByUsers.includes(user.userId));
    });

    it('should mark items as read', async () => {
        await client.markItemsAsRead(conversation.convId);
    });

    it('should mention the user and raise a mention event', async () => {
        await client2.updateUser({
            userId: user2.userId,
            firstName: 'John',
            lastName: 'Smith'
        });
        user2 = await client2.getUserById(user2.userId);
        const content = `<span class="mention" abbr="${user2.userId}">@${user2.displayName}</span>`;
        Circuit.Enums.TextItemContentType.RICH;
        const res  = await Promise.all([
            client.addTextItem(conversation.convId, {
                content: content,
                contentType: Circuit.Enums.TextItemContentType.RICH
            }),
            helper.expectEvents(client2, [{
                type: 'mention',
                predicate: evt => evt.mention.userReference.userId === user2.userId && evt.mention.itemReference.convId === conversation.convId
            }]) 
        ]);
        const mentionedItem = res[0];
        const mention = res[1].mention;
        assert(mentionedItem.convId === conversation.convId && mentionedItem.creatorId === user.userId && mentionedItem.itemId === mention.itemReference.itemId && mention.userReference.userId === user2.userId);
    });
});
