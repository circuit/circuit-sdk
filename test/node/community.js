'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let client2;
let user2;
let community;
describe('Community', () => {
    before(async () => {
        client = prep.client;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('function: createCommunity', async () => {
        const topic = `${Date.now()}a`;
        const description = `${Date.now()}b`;
        community = await client.createCommunity(null, topic, description);
        assert(community && community.type === Circuit.Enums.ConversationType.COMMUNITY && community.topic === topic && community.description === description);
    });

    it('function: joinCommunity', async () => {
        if (!client2.joinCommunity) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const res = await client2.joinCommunity(community.convId);
        assert(res && res.participants.some(participant => participant.userId === user2.userId));
    });
});