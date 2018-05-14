'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let client2;

describe('Authentication', () => {
    it('should login using Client Credentials', async () => {
        client = new Circuit.Client(config.bot1);
        const user = await client.logon();
        assert(!!user);
    });

    it('should be authenticated', async () => {
        await client.isAuthenticated();
    });

    /*
    it('should have valid token', async () => {
        const token = await client.validateToken();
        assert(token.accessToken);
    });
    */

    it('should allow login second bot in same JS context', async () => {
        client2 = new Circuit.Client(config.bot2);
        const user = await client2.logon();
        assert(!!user);
    });

    it('should read domain property', async () => {
        assert(client.domain === 'circuitsandbox.net');
    });

    it('should read accessToken property', async () => {
        assert(client.accessToken.length === 32);
    });

    it('should read expiresAt property', async () => {
        assert(client.expiresAt === undefined || Number.isInteger(client.expiresAt));
    });

    it('should logout both bots without error', async () => {
        await client.logout(true);
        await client2.logout(true);
    });

    it('should fail to login with invalid credentials', async () => {
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

    it('should login using delayed OAuth settings', async () => {
        const client = new Circuit.Client();
        client.setOauthConfig(config.bot1);
        const user = await client.logon();
        assert(!!user);
        await client.logout();
    });

    it('should login using accessToken and accessToken property is cleared after logout', async () => {
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

    it('should fail to login after revoke of token', async () => {
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

    it('should login fresh after revoke of token', async () => {
        const client = new Circuit.Client(config.bot1);
        const user = await client.logon();
        assert(!!user);
        await client.logout();
    });


    it('should renew the access token, get accessTokenRenewed event and unable to login with old token', async () => {
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

    it('should succeed to renew session token', async () => {
        let client = new Circuit.Client(config.bot1);
        await client.logon();
        const token = client.accessToken;
        await client.renewSessionToken();
        await helper.expectEvents(client, ['sessionTokenRenewed']);
    });

});