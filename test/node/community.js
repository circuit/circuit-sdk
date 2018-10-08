'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user
describe('Community', () => {
    before(async () => {
        client = prep.client;
        user = client.loggedOnUser;
    });

    it('function: createCommunity', async () => {
        const topic = `${Date.now()}a`;
        const description = `${Date.now()}b`;
        const res = await client.createCommunity(null, topic, description);
        assert(res && res.type === Circuit.Enums.ConversationType.COMMUNITY && res.topic === topic && res.description === description);
    });
});