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
describe('Moderator Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should create a conversation with user2', async () => {
        const topic = `${Date.now()}a`;
        conversation = await client.createConferenceBridge(topic);
        conversation = await client.addParticipant(conversation.convId, [user2.userId]);
        assert(conversation && conversation.topic === topic && conversation.participants.includes(user.userId) && conversation.participants.includes(user2.userId));
    }); 

    it('should moderate conversation', async () => {
        await client.moderateConversation(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.isModerated && conversation.moderators.includes(user.userId));
    });

    it('should moderate user', async () => {
        await client.grantModeratorRights(conversation.convId, user2.userId);
        conversation = await client.getConversationById(conversation.convId);
        assert(conversation.moderators.includes(user2.userId));
    });

    it('should drop user as moderator', async () => {
        await client.dropModeratorRights(conversation.convId, user2.userId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.moderators || !conversation.moderators.includes(user2.userId));
    });

    it('should unmoderate conversation', async () => {
        await client.unmoderateConversation(conversation.convId);
        conversation = await client.getConversationById(conversation.convId);
        assert(!conversation.isModerated);
    });
});