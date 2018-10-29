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
let searchResults = {} // hashtable of search results from basicSearchResults
let searchId; // results returned from searchStatus event for startBasicSearch
let searchId2; // results returned from searchStatus event for startUserSearch by name
let searchId3; // results returned from searchStatus event for startUserSearch by phone number
let searchId4; // results returned from searchStatus event for startAdvancedUserSearch by name (searchExactAssignedPhoneNumber = undefined)
let searchId5; // results returned from searchStatus event for startAdvancedUserSearch by phone number (searchExactAssignedPhoneNumber = false)
let searchId6; // results returned from searchStatus event for startAdvancedUserSearch by correct phone number (searchExactAssignedPhoneNumber = true)
let searchId7; // results returned from searchStatus event for startAdvancedUserSearch by incorrect phone number (searchExactAssignedPhoneNumber = true)
let searchId8; // results returned from searchStatus event for startAdvancedUserSearch by MEETING POINT
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
        client.addEventListener('basicSearchResults', evt => searchResults[evt.data.searchId] = evt);
        conversation = prep.conversation;
        phoneNumber = prep.phoneNumber;
    });

    after(async () => {
        await client2.logout();
    });

    it('function: startBasicSearch [conversation], with event: searchStatus', async () => {
        const res = await Promise.all([
            client.startBasicSearch(conversation.topic),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId = res[1].data && res[1].data.searchId;
        assert(searchId);
    });

    it('function: startUserSearch [firstName], with event: searchStatus', async () => {
        const res = await Promise.all([
            client.startUserSearch(user2.firstName),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId2 = res[1].data && res[1].data.searchId;
        assert(searchId2);
    });

    it('function: startUserSearch [phoneNumber], with event: searchStatus', async () => {
        const res = await Promise.all([
            client.startUserSearch(phoneNumber.phoneNumber),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId3 = res[1].data && res[1].data.searchId;
        assert(searchId3);
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
        const res = await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId4 = res[1].data && res[1].data.searchId;
        assert(searchId4);
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
        const res = await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId5 = res[1].data && res[1].data.searchId;
        assert(searchId5);
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
        const res = await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId6 = res[1].data && res[1].data.searchId;
        assert(searchId6);
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
        const res = await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId7 = res[1].data && res[1].data.searchId;
        assert(searchId7);
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
        const res = await Promise.all([
            client.startAdvancedUserSearch(searchObj),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId8 = res[1].data && res[1].data.searchId;
        assert(searchId8);
    });

    it('event: basicSearchResults [firstName]', async () => {
        // wait to allow time for searches to return
        await helper.sleep(3000);
        assert(searchResults[searchId2] && searchResults[searchId2].type === 'basicSearchResults' && searchResults[searchId2].data.users.includes(user2.userId));
    });

    it('event: basicSearchResults [phoneNumber]', async () => {
        assert(searchResults[searchId3] && searchResults[searchId3].type === 'basicSearchResults' && searchResults[searchId3].data.users.includes(user2.userId));
    });

    it('event: basicSearchResults [conversation]', async () => {
        assert(searchResults[searchId] && searchResults[searchId].type === 'basicSearchResults' && searchResults[searchId].data.searchResults.some(conv => conv.convId === conversation.convId));
    });

    it('event: basicSearchResults [startAdvancedUserSearch, firstName], with searchExactAssignedPhoneNumber = false', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        assert(searchResults[searchId4] && searchResults[searchId4].type === 'basicSearchResults' && searchResults[searchId4].data.users.includes(user2.userId));
    });

    it('event: basicSearchResults [startAdvancedUserSearch, phoneNumber], with searchExactAssignedPhoneNumber = false', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        assert(searchResults[searchId5] && searchResults[searchId5].type === 'basicSearchResults' && searchResults[searchId5].data.users.includes(user2.userId));
    });

    it('event: basicSearchResults [startAdvancedUserSearch, phoneNumber], with searchExactAssignedPhoneNumber = true, and correct phone number', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        assert(searchResults[searchId6] && searchResults[searchId6].type === 'basicSearchResults' && searchResults[searchId6].data.users.includes(user2.userId));
    });

    it('event: basicSearchResults [startAdvancedUserSearch, phoneNumber], with searchExactAssignedPhoneNumber = true, and incorrect phone number', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        assert(!searchResults[searchId7]);
    });

    it('event: basicSearchResults [startAdvancedUserSearch, MEETING_POINT]', async () => {
        if (!client.startAdvancedUserSearch) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        let users = [];
        if (searchResults[searchId8]) {
            users = await client.getUsersById(searchResults[searchId8].data.users);
        }
        assert(searchResults[searchId8] && users.some(user => user.userType === Circuit.Enums.SearchContext.MEETING_POINT && user.location === MEETING_POINT.location));
    });
});