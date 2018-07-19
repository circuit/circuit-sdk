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
describe('Moderator Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
        if (!global.conversation.participants.includes(user2.userId)) {
            global.conversation = await client.addParticipant(global.conversation.convId, [user2.userId]);
        }
    });

    after(async () => {
        await client.logout();
    });

    it('should enable moderation on a conversation', async () => {
        await client.moderateConversation(global.conversation.convId);
        global.conversation = await client.getConversationById(global.conversation.convId);
        assert(global.conversation.isModerated && global.conversation.moderators.includes(user.userId));
    });

    it('should grant moderator rights to a user', async () => {
        await client.grantModeratorRights(global.conversation.convId, user2.userId);
        global.conversation = await client.getConversationById(global.conversation.convId);
        assert(global.conversation.moderators.includes(user2.userId));
    });

    it('should remove moderator rights for a user', async () => {
        await client.dropModeratorRights(global.conversation.convId, user2.userId);
        global.conversation = await client.getConversationById(global.conversation.convId);
        assert(!global.conversation.moderators || !global.conversation.moderators.includes(user2.userId));
    });

    it('should disable moderation on a conversation', async () => {
        await client.unmoderateConversation(global.conversation.convId);
        global.conversation = await client.getConversationById(global.conversation.convId);
        assert(!global.conversation.isModerated);
    });
});