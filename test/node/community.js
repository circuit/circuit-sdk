'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user
describe('Community', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should create a community', async () => {
        const topic = `${Date.now()}a`;
        const description = `${Date.now()}b`;
        const res = await client.createCommunity(null, topic, description);
        assert(res && res.type === Circuit.Enums.ConversationType.COMMUNITY && res.topic === topic && res.description === description);
    });
});