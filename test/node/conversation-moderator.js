'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../__preperation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
describe('Moderator Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
        conversation = prep.conversation;
    });

    after(async () => {
        await client.logout();
    });

    it('should enable moderation on a conversation', async () => {
        await client.moderateConversation(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.isModerated && conversation.moderators.includes(user.userId));
    });

    it('should grant moderator rights to a user', async () => {
        await client.grantModeratorRights(conversation.convId, user2.userId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.moderators.includes(user2.userId));
    });

    it('should remove moderator rights for a user', async () => {
        await client.dropModeratorRights(conversation.convId, user2.userId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.moderators || !conversation.moderators.includes(user2.userId));
    });

    it('should disable moderation on a conversation', async () => {
        await client.unmoderateConversation(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.isModerated);
    });
});