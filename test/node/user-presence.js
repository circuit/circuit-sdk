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
let presence;
describe('User Presence', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should subscribe to  users presence', async () => {
        const res = await client.subscribePresence([user2.userId]);
        assert(res === undefined || res);
    });

    it('should get users presence', async () => {
        const res = await client.getPresence([user2.userId]);
        presence = res && res[0];
        assert(res && res[0].userId === user2.userId);
    });

    it('should set and get status message', async () => {
        const message = `${Date.now()}a`;
        const r = await Promise.all([
            client2.setStatusMessage(message),
            helper.expectEvents(client, [{
                type: 'userPresenceChanged',
                predicate: evt => evt.presenceState.userId === user2.userId && evt.presenceState.statusMessage === message
            }])
        ]);
        const res = await client2.getStatusMessage();
        assert(res === message);
    });

    it('should set users presence and raise userPresenceChanged event', async () => {
        let newState;    
        if (presence && presence.state === Circuit.Enums.PresenceState.AVAILABLE) {
            newState = Circuit.Enums.PresenceState.OFFLINE;
        } else {
            newState = Circuit.Enums.PresenceState.AVAILABLE;
        }
        const r = await Promise.all([
            await client2.setPresence({state: newState}),
            helper.expectEvents(client, [{
                type: 'userPresenceChanged',
                predicate: evt => evt.presenceState.userId === user2.userId && evt.presenceState.state === newState
            }])
        ]);
        const res = await client.getPresence([user2.userId]);
        presence = res && res[0];
        assert(presence && presence.userId === user2.userId && presence.state === newState);
    });
});