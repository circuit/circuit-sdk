'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
let item;
describe('Conversation Subscribe to Typing Indicator', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
        conversation = prep.conversation;
        const content = {
            subject: `${Date.now()}a`,
            content: `${Date.now()}b`
        }
        item = await client.addTextItem(conversation.convId, content);
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should subscribe to typing indicator for converation', async () => {
        if (!client.subscribeTypingIndicator) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        await client.subscribeTypingIndicator(conversation.convId);
    });

    it('should call typing and raise a typing event', async () => {
        if (!client.typing) {
            console.log('API not yet supported');
            assert(true);
            return;
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
            return;
        }
        await client.unsubscribeTypingIndicator(conversation.convId);
    });
});