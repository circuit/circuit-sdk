'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
describe('Conversation Favorites', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should favorite the conversation and check it is favorited', async () => {
        await Promise.all([
            client.favoriteConversation(global.conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationFavorited',
                predicate: evt => evt.convId === global.conversation.convId 
            }])            
        ]);
        const res = await client.getFavoriteConversationIds();
        assert(res && res.includes(global.conversation.convId));
    });

    it('should get marked conversations', async () => {
        const res = await client.getMarkedConversations();
        assert(res && res.favoriteConvIds.some(convId => convId === global.conversation.convId));
    });

    it('should unfavorite the conversation and check it is not favorited', async () => {
        await Promise.all([
            client.unfavoriteConversation(global.conversation.convId),
            helper.expectEvents(client, [{
                type: 'conversationUnfavorited',
                predicate: evt => evt.convId === global.conversation.convId 
            }])            
        ]);
        const res = await client.getFavoriteConversationIds();
        assert(res && !res.includes(global.conversation.convId));
    });  
});