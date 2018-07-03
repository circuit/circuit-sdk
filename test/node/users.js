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
let conversation;
describe('Users', () => {
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

    it('should get the logged on users', async () => {
       const userData1 = await client.getLoggedOnUser(); 
       const userData2 = await client2.getLoggedOnUser();
       assert(userData1 && userData2 && userData1.userId === user.userId && userData2.userId === user2.userId); 
    });

    it('should get user by their Id', async () => {
        const res = await client.getUserById(user.userId);
        assert(res && res.userId === user.userId);
    });

    it('should get users by their Ids', async () => {
        const res = await client.getUsersById([user.userId, user2.userId]);
        assert(res && res.every(u => u.userId === user.userId || u.userId === user2.userId));
    });

    it('should get users by their emails', async () => {
        const res = await client.getUsersByEmail([user.emailAddress, user2.emailAddress]);
        assert(res && res.every(u => u.userId === user.userId || u.userId === user2.userId));
    });
});