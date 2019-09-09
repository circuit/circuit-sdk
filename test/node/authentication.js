'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let client2;

describe('Authentication', () => {

    after(async  () => {
        // logs the bots back on for the remaining tests
        await prep.client.logon();
        await prep.client2.logon();
    });

    it('function: logon [user], with Client Credentials', async () => {
        client = new Circuit.Client(config.bot1);
        const user = await client.logon();
        assert(!!user);
    });

    it('function: isAuthenticated', async () => {
        await client.isAuthenticated();
    });

    /*
    it('function: validateToken', async () => {
        const token = await client.validateToken();
        assert(token.accessToken);
    });
    */

    it('function: logon [user2], with Client Credentials', async () => {
        client2 = new Circuit.Client(config.bot2);
        const user = await client2.logon();
        assert(!!user);
    });

    it('function: getCookie', async () => {
        const cookie = client.getCookie();
        assert(!!cookie);
    });
    
    it('asserts: client.domain', async () => {
        assert(client.domain === 'circuitsandbox.net');
    });

    it('asserts: client.accessToken', async () => {
        assert(!!(client.accessToken && client.accessToken.length));
    });

    it('asserts: client.expiresAt', async () => {
        assert(client.expiresAt === undefined || Number.isInteger(client.expiresAt));
    });

    it('function: logout', async () => {
        await client.logout(true);
        await client2.logout(true);
    });

    /*
    it('function: logon, with invalid credentials', async () => {
        client = new Circuit.Client({
            client_id: config.bot1.client_id,
            client_secret: config.bot2.client_secret
        });
        try {
            await client.logon();
            assert(false);
        } catch (err) {
            assert(true);
        }
    });
    */

    it('functions: [setOauthConfig, logon]', async () => {
        const client = new Circuit.Client();
        client.setOauthConfig(config.bot1);
        const user = await client.logon();
        assert(!!user);
        await client.logout();
    });

    it('functions: [logon, logout], with accessToken and accessToken property is cleared after logout', async () => {
        let client = new Circuit.Client(config.bot1);
        await client.logon();
        const token = client.accessToken;
        await client.logout();

        client = new Circuit.Client({
            client_id: config.bot1.client_id
        });
        const user = await client.logon({accessToken: token});
        assert(!!user);
        await client.logout();
        assert(!client.accessToken);
    });

    /*
    it('functions: [logon, logout], with failure to login after revoke of token', async () => {
        let client = new Circuit.Client(config.bot1);
        await client.logon();
        const token = client.accessToken;
        await client.revokeToken();
        await client.logout();

        client = new Circuit.Client({client_id: config.bot1.client_id});

        try {
            await client.logon({accessToken: token});
            assert(false);
        } catch (err) {
            assert(true);
        }
    });

    it('function: logon, with fresh after revoke of token', async () => {
        const client = new Circuit.Client(config.bot1);
        const user = await client.logon();
        assert(!!user);
        await client.logout();
    });


    it('functions: [logon, renewToken, logout], with event:  accessTokenRenewed and unable to login with old token', async () => {
        let client = new Circuit.Client(config.bot1);
        await client.logon();
        const token = client.accessToken;
        //helper.logEvents(client, Circuit.supportedEvents);
        const newToken = await client.renewToken();
        await helper.expectEvents(client, ['accessTokenRenewed']);
        assert(newToken && (newToken !== token));

        client = new Circuit.Client({
            client_id: config.bot1.client_id
        });
        try {
            await client.logon({accessToken: token});
            assert(false);
        } catch (err) {
            assert(true);
        }

        await client.logon({accessToken: newToken});
        await client.logout();
    });

    it('functions: [logon, renewSessionToken], with event: sessionTokenRenewed', async () => {
        let client = new Circuit.Client(config.bot1);
        await client.logon();
        const token = client.accessToken;
        await client.renewSessionToken();
        await helper.expectEvents(client, ['sessionTokenRenewed']);
    });
    */

});