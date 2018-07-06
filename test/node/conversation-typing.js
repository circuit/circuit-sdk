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
let item;
describe('Subscribe to Typing Indicator', () => {
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

    it('should create a direct conversation', async () => {
        const res = await client.createDirectConversation(user2.userId);
        conversation = res.conversation;
        assert(conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    });
    
    it('should add a simple text item', async () => {
        const content = {
            subject: `${Date.now()}a`,
            content: `${Date.now()}b`
        }
        item = await client.addTextItem(conversation.convId, content);
        assert(item.convId === conversation.convId && item.text.content === content.content);
    });

    it('should subscribe to typing indicator for converation', async () => {
        if (!client.subscribeTypingIndicator) {
            console.log('API not yet supported');
            assert(true);
        }
        await client.subscribeTypingIndicator(conversation.convId);
    });

    it('should call typing and raise a typing event', async () => {
        if (!client.typing) {
            console.log('API not yet supported');
            assert(true);
        }
        await Promise.all([
            client2.typing(conversation.convId, true, item.itemId),
            helper.expectEvents(client, [{
                type: 'typing',
                predicate: evt => evt.data.participantId === user2.userId && evt.data.convId === conversation.convId && evt.data.parentItemId === item.itemId
            }])    
        ]);
    });

    it('should unsubscribe to typing indicator for converation', async () => {
        if (!client.unsubscribeTypingIndicator) {
            console.log('API not yet supported');
            assert(true);
        }
        await client.unsubscribeTypingIndicator(conversation.convId);
    });
});