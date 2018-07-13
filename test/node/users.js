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

    it('should retrieve local user', async () => {
        const res = await client.getLoggedOnUser();
        assert(res && res.userId === user.userId);
    });

    it('should get user by their Id', async () => {
        const res = await client.getUserById(user2.userId);
        assert(res && res.userId === user2.userId);
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

    it('should update local user', async () => {
        const updatedUser = {
            userId: user.userId,
            firstName: `${Date.now()}a`,
            lastName: `${Date.now()}b`,
            emailAddresses: [{
                type: 'WORK',
                address: 'testemail@bot.com'
            },{
                type: 'OTHER',
                address: 'othertestemail@bot.com'
            }],
            jobTitle: `${Date.now()}x`,
            company: `${Date.now()}z`
        }
        const oldUser = {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddresses: user.emailAddresses,
            jobTitle: user.jobTitle || ' ',
            company: user.company || ' '
        }
        await client.updateUser(updatedUser);
        const res1 = await client.getUserById(user.userId);
        const result1 = res1 && res1.userId === user.userId && res1.firstName === updatedUser.firstName && res1.lastName === updatedUser.lastName && res1.jobTitle === updatedUser.jobTitle && res1.company === updatedUser.company;
        await client.updateUser(oldUser);
        const res2 = await client.getUserById(user.userId);
        const result2 = res2 && res2.userId === user.userId && res2.firstName === oldUser.firstName && res2.lastName === oldUser.lastName && res2.jobTitle === oldUser.jobTitle && res2.company === oldUser.company;
        assert(result1 && result2);
    });
});