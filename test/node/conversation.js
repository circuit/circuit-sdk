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
describe('Conversation Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
        conversation = prep.conversation;
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should get first page of latest conversations', async () => {
        const res = await client.getConversations();
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    // it('should get a number of participants for conversation', async () => {
    //     const res = await client.getConversations({
    //         numberOfParticipants: 1
    //     });
    //     assert(res && res.some(conv => conv.convId === conversation.convId) && res.every(conv => conv.participants.length <= 1));
    // });

    it('should get a specified number of conversations', async () => {
        //random number of conversations to retrieve numberOfConvs 
        const numberOfConvs = Math.floor(Math.random() * 10) + 1;
        const res = await client.getConversations({
            numberOfConversations: numberOfConvs
        });
        // less than or equal to in the case numberOfConvs does not exist
        assert(res && res.length <= numberOfConvs);
    });

    it('should get conversations AFTER a timestamp', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.AFTER,
            timestamp: conversation.modificationTime - 1
        });
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('should NOT get conversations AFTER a timestamp', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.AFTER,
            timestamp: conversation.lastItemModificationTime + 1
        });
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });

    it('should get conversations BEFORE a timestamp', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.BEFORE,
            timestamp: conversation.lastItemModificationTime + 1
        });
        assert(res && res.some(conv => conv.convId === conversation.convId));
    });

    it('should NOT get conversations BEFORE a timestamp', async () => {
        const res = await client.getConversations({
            direction: Circuit.Constants.SearchDirection.BEFORE,
            timestamp: conversation.creationTime - 1
        });
        assert(res && !res.some(conv => conv.convId === conversation.convId));
    });
});