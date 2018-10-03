// 'use strict';

// const assert = require('assert');
// const Circuit = require('../../circuit-node');
// const config = require('./config.json');
// const prep = require('../preparation');
// Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

// let client;
// let client2;
// let c;
// describe('Authentication', () => {

//     // after(async () => {
//     //     // logs the bots back on for the remaining tests
//     //     await prep.client.logon();
//     //     await prep.client2.logon();
//     // });



//     it('functions: [setOauthConfig, logon]', async () => {
//         c = new Circuit.Client();
//         c.setOauthConfig(config.bot1);
//         const user = await c.logon();
//         assert(!!user);
//     });



//     it('function: logout', async () => {
//         await c.logout(true);
//     });

//     /*
//     it('should fail to login with invalid credentials', async () => {
//         client = new Circuit.Client({
//             client_id: config.bot1.client_id,
//             client_secret: config.bot2.client_secret
//         });
//         try {
//             await client.logon();
//             assert(false);
//         } catch (err) {
//             assert(true);
//         }
//     });
//     */



//     it('functions: [logon, logout], with accessToken and accessToken property is cleared after logout', async () => {
//         let c = new Circuit.Client(config.bot1);
//         await client.logon();
//         const token = client.accessToken;
//         await c.logout();

//         c = new Circuit.Client({
//             client_id: config.bot1.client_id
//         });
//         const user = await c.logon({accessToken: token});
//         assert(!!user);
//         await c.logout();
//         assert(!c.accessToken);
//     });

//     /*
//     it('should fail to login after revoke of token', async () => {
//         let client = new Circuit.Client(config.bot1);
//         await client.logon();
//         const token = client.accessToken;
//         await client.revokeToken();
//         await client.logout();

//         client = new Circuit.Client({client_id: config.bot1.client_id});

//         try {
//             await client.logon({accessToken: token});
//             assert(false);
//         } catch (err) {
//             assert(true);
//         }
//     });

//     it('should login fresh after revoke of token', async () => {
//         const client = new Circuit.Client(config.bot1);
//         const user = await client.logon();
//         assert(!!user);
//         await client.logout();
//     });


//     it('should renew the access token, get accessTokenRenewed event and unable to login with old token', async () => {
//         let client = new Circuit.Client(config.bot1);
//         await client.logon();
//         const token = client.accessToken;
//         //helper.logEvents(client, Circuit.supportedEvents);
//         const newToken = await client.renewToken();
//         await helper.expectEvents(client, ['accessTokenRenewed']);
//         assert(newToken && (newToken !== token));

//         client = new Circuit.Client({
//             client_id: config.bot1.client_id
//         });
//         try {
//             await client.logon({accessToken: token});
//             assert(false);
//         } catch (err) {
//             assert(true);
//         }

//         await client.logon({accessToken: newToken});
//         await client.logout();
//     });

//     it('should succeed to renew session token', async () => {
//         let client = new Circuit.Client(config.bot1);
//         await client.logon();
//         const token = client.accessToken;
//         await client.renewSessionToken();
//         await helper.expectEvents(client, ['sessionTokenRenewed']);
//     });
//     */
   
//    it('function: logon [user], with Client Credentials', async () => {
//         client = new Circuit.Client(config.bot1);
//         const user = await client.logon();
//         assert(!!user);
//     });

//     /*
//     it('should have valid token', async () => {
//         const token = await client.validateToken();
//         assert(token.accessToken);
//     });
//     */

//     it('function: logon [user2], with Client Credentials', async () => {
//         client2 = new Circuit.Client(config.bot2);
//         const user = await client2.logon();
//         assert(!!user);
//     });

//     it('function: isAuthenticated', async () => {
//         await client.isAuthenticated();
//     });

//     it('function: getCookie', async () => {
//         const cookie = client.getCookie();
//         assert(!!cookie);
//     });
    
//     it('asserts: client.domain', async () => {
//         assert(client.domain === 'circuitsandbox.net');
//     });

//     it('asserts: client.accessToken', async () => {
//         assert(client.accessToken.length === 32);
//     });

//     it('asserts: client.expiresAt', async () => {
//         assert(client.expiresAt === undefined || Number.isInteger(client.expiresAt));
//     });
// });