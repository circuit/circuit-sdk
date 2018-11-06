'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
describe('Miscellaneous Tests', () => {
    before(async () => {
        client = prep.client;
    });

    it('function: getSupportConversationId', async () => {
        await client.getSupportConversationId();
    });

    it('function: getTelephonyConversationId', async () => {
        const res = await client.getTelephonyConversationId();
        assert(res);
    });

    it('function: getTelephonyData', async () => {
        const res = await client.getTelephonyData();
        assert(res);
    });
});