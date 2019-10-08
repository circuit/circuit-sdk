'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let client2;
let user2;
let conversation;
let phoneNumber;
const MEETING_POINT = {
    query: 'unit-test-dont',
    location: 'Tiverton'
};
describe('Search Tests', () => {
    before(async () => {
        client = prep.client;
        client2 = new Circuit.Client(config.sdktester1.config);
        user2 = await client2.logon(config.sdktester1.credentials);
        conversation = prep.conversation;
        phoneNumber = prep.phoneNumber;
    });

    after(async () => {
        await client2.logout();
    });

    afterEach(async () => await helper.sleep(500));// wait to allow time for searches to return

    it('function: startBasicSearch [conversation], with event: searchStatus', async () => {
        await Promise.all([
            client.startBasicSearch(conversation.topic),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: evt => evt.data.searchResults.some(conv => conv.convId === conversation.convId)
            }])
        ]);
    });

    it('function: startUserSearch [firstName], with event: searchStatus', async () => {
        await Promise.all([
            client.startUserSearch(user2.firstName),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: evt => evt.data.users.includes(user2.userId)
            }])
        ]);
    });

    it('function: startUserSearch [phoneNumber], with event: searchStatus', async () => {
        await Promise.all([
            client.startUserSearch(phoneNumber.phoneNumber),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: evt => evt.data.users.includes(user2.userId)
            }])
        ]);
    });

    it('function: startAdvancedUserSearch [name], with event: searchStatus and searchExactAssignedPhoneNumber = undefined', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const searchObj = {
            searchContext: Circuit.Enums.SearchContext.USER,
            query: user2.firstName,
            searchExactAssignedPhoneNumber: false
        };
        await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: evt => evt.data.users.includes(user2.userId)
            }])
        ]);
    });

    it('function: startAdvancedUserSearch [phoneNumber], with event: searchStatus and searchExactAssignedPhoneNumber = false', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const searchObj = {
            searchContext: Circuit.Enums.SearchContext.USER,
            query: phoneNumber.phoneNumber
        };
        await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: evt => evt.data.users.includes(user2.userId)
            }])
        ]);
    });

    it('function: startAdvancedUserSearch [phoneNumber], with event: searchStatus and searchExactAssignedPhoneNumber = true and correct number', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const searchObj = {
            searchContext: Circuit.Enums.SearchContext.USER,
            query: user2.phoneNumber,
            searchExactAssignedPhoneNumber: true
        };
        await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: evt => evt.data.users.includes(user2.userId)
            }])
        ]);
    });

    it('function: startAdvancedUserSearch [phoneNumber], with event: searchStatus and searchExactAssignedPhoneNumber = true and incorrect number', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const searchObj = {
            searchContext: Circuit.Enums.SearchContext.USER,
            query: user2.phoneNumber && user2.phoneNumber.substring(0, user2.phoneNumber.length - 1),
            searchExactAssignedPhoneNumber: true
        };
        await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'NO_RESULT'
            }])
        ]);
    });

    it('function: startAdvancedUserSearch [MEETING_POINT], with event: searchStatus', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const searchObj = {
            searchContext: Circuit.Enums.SearchContext.MEETING_POINT,
            query: MEETING_POINT.query
        };
        await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus',
                predicate: evt => evt.data.status === 'FINISHED'
            }, {
                type: 'basicSearchResults',
                predicate: async evt => {
                    const users = await client.getUsersById(evt.data.users);
                    return users.some(user => user.userType === Circuit.Enums.SearchContext.MEETING_POINT && user.location === MEETING_POINT.location);
                }
            }])
        ]);
    });
});