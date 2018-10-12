'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let client2;
let user2;
let conversation;
let item;
describe('Conversation Subscribe to Typing Indicator', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
        const content = {
            subject: `${Date.now()}a`,
            content: `${Date.now()}b`
        }
        item = await client.addTextItem(conversation.convId, content);
    });

    it('function: subscribeTypingIndicator', async () => {
        if (!client.subscribeTypingIndicator) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        await client.subscribeTypingIndicator(conversation.convId);
    });

    it('function: typing, with event: typing', async () => {
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

    it('function: unsubscribeTypingIndicator', async () => {
        if (!client.unsubscribeTypingIndicator) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        await client.unsubscribeTypingIndicator(conversation.convId);
    });
});