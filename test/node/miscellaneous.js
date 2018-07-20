'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
describe('Miscellaneous Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should retrieve support conversation Id', async () => {
        await client.getSupportConversationId();
    });

    it('should retrieve telephony conversation Id', async () => {
        const res = await client.getTelephonyConversationId();
        assert(res);
    });

    it('should get telephony data', async () => {
        const res = await client.getTelephonyData();
        assert(res);
    });
});