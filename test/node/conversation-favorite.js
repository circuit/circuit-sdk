'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let conversation;
describe('Conversation Favorites', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
    });

    it('functions: [favoriteConversation, getFavoriteConversationIds], with event: conversationFavorited', async () => {
        await Promise.all([
            client.favoriteConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationFavorited',
                predicate: evt => evt.convId === conversation.convId 
            }])            
        ]);
        const res = await client.getFavoriteConversationIds();
        assert(res && res.includes(conversation.convId));
    });

    it('function: getMarkedConversations', async () => {
        const res = await client.getMarkedConversations();
        assert(res && res.favoriteConvIds.some(convId => convId === conversation.convId));
    });

    it('functions: [unfavoriteConversation, getFavoriteConversationIds], with event: conversationUnfavorited', async () => {
        await Promise.all([
            client.unfavoriteConversation(conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUnfavorited',
                predicate: evt => evt.convId === conversation.convId 
            }])            
        ]);
        const res = await client.getFavoriteConversationIds();
        assert(res && !res.includes(conversation.convId));
    });  
});