'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let item = {};
let conversation;
describe('Conversation Items', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
        user = client.loggedOnUser;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('function: addTextItem, with event: itemAdded', async () => {
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
    
    it('function: updateTextItem, with event: itemUpdated', async () => {
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

    it('functions: [addTextItem, getItemsByThread]', async () => {
        const content = {
            parentId: item.itemId,
            content: `${Date.now()}item2`
        }
        const item2 = await client.addTextItem(conversation.convId, content);
        const res = await client.getItemsByThread(conversation.convId, item.itemId);
        assert(res && res.items.some(threadItem => threadItem.parentItemId === item.itemId && threadItem.itemId === item2.itemId));
    });

    it('function: getConversationFeed', async () => {
        const res  = await client.getConversationFeed(conversation.convId);
        assert(res && res.threads.some(thread => thread.parentItem.convId === conversation.convId && thread.parentItem.itemid === item.itemid));
    });

    it('function: getConversationItems,  with {direction: AFTER}', async () => {
        const options = {   
            creationDate: item.creationTime - 1,
            direction: 'AFTER'
        }
        const res  = await client.getConversationItems(conversation.convId, options);
        assert(res.some(conversationItem => conversationItem.itemId === item.itemId));
    }); 

    it('functions: [flagItem, getFlaggedItems], with event: itemFlagged', async () => {
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
    
    it('functions: [unflagItem, getFlaggedItems], with event: itemUnflagged', async () => {
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

    it('functions: [likeItem, getItemById], with event: itemUpdated', async () => {
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

    it('functions: [unlikeItem, getItemById], with event: itemUpdated', async () => {
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

    it('function: markItemsAsRead, with event: conversationReadItems', async () => {
        const res = await Promise.all([
            client.markItemsAsRead(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationReadItems',
                predicate: evt => evt.data.convId === conversation.convId
            }]) 
        ]);
        assert(res[1].data.convId === conversation.convId);
    });

    it('functions: [updateUser, addTextItem], with event: mention', async () => {
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
                predicate: evt => evt.mention.userReference.userId === user.userId && evt.mention.itemReference.convId === conversation.convId
            }]) 
        ]);
        await client2.updateUser({
            userId: user2.userId,
            firstName: user2.firstName,
            lastName: user2.lastName
        });
        const mentionedItem = res[0];
        const mention = res[1].mention;
        assert(mentionedItem.convId === conversation.convId && mentionedItem.creatorId === user.userId && mentionedItem.itemId === mention.itemReference.itemId && mention.userReference.userId === user.userId);
    });
});
