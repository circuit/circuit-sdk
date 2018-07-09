'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let conversation;
describe('Conversation Favorites', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should create a conference', async () => {
        const topic = `${Date.now()}a`;
        const res = await client.createConferenceBridge(topic);
        conversation = res;
        assert(conversation && conversation.topic === topic && conversation.participants.includes(user.userId));
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