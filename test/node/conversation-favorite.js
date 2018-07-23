'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let conversation;
describe('Conversation Favorites', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        await client.logon();
        conversation = prep.conversation;
    });

    after(async () => {
        await client.logout();
    });

    it('should favorite the conversation and check it is favorited', async () => {
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

    it('should get marked conversations', async () => {
        const res = await client.getMarkedConversations();
        assert(res && res.favoriteConvIds.some(convId => convId === conversation.convId));
    });

    it('should unfavorite the conversation and check it is not favorited', async () => {
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