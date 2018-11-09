'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let client2;
let user2;
let presence;
describe('User Presence', () => {
    before(async () => {
        client = prep.client;
        client2 = prep.client2;
        user2 = client2.loggedOnUser;
    });

    it('function: subscribePresence', async () => {
        await client.subscribePresence([user2.userId]);
    });

    it('function: getPresence', async () => {
        const res = await client.getPresence([user2.userId]);
        presence = res[0];
        assert(presence.userId === user2.userId);
    });

    it('functions: [setStatusMessage, getStatusMessage], with event: userPresenceChanged', async () => {
        const message = `${Date.now()}a`;
        await Promise.all([
            client2.setStatusMessage(message),
            helper.expectEvents(client, [{
                type: 'userPresenceChanged',
                predicate: evt => evt.presenceState.userId === user2.userId && evt.presenceState.statusMessage === message
            }])
        ]);
        const res = await client2.getStatusMessage();
        console.log('RES', res);
        console.log('MES', message);
        assert(res === message);
    });

    it('functions: [setPresence, getPresence], with event: userPresenceChanged', async () => {
        const newState = Circuit.Enums.PresenceState.DND;

        await Promise.all([
            client2.setPresence({
                state: newState,
                dndUntil: Date.now() + 5000
            }),
            helper.expectEvents(client, [{
                type: 'userPresenceChanged',
                predicate: evt => evt.presenceState.userId === user2.userId && evt.presenceState.state === newState
            }])
        ]);

        const res = await client.getPresence([user2.userId]);
        presence = res[0];
        assert(presence && presence.userId === user2.userId && presence.state === newState);
    });

    it('function: unsubscribePresence', async () => {
        await client.unsubscribePresence([user2.userId]);
    });
});