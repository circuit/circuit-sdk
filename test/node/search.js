'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
let searchResults = {} // hashtable of search results from basicSearchResults
let searchId; // results returned from searchStatus event for startBasicSearch
let searchId2; // results returned from searchStatus event for startUserSearch by name
let searchId3; // results returned from searchStatus event for startUserSearch by phone number
let phoneNumber;
describe('Search Tests', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.sdktester1.config);
        user2 = await client2.logon(config.sdktester1.credentials);
        client.addEventListener('basicSearchResults', evt => searchResults[evt.data.searchId] = evt);
        conversation = prep.conversation;
        phoneNumber = prep.phoneNumber;
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should search a conversation by its topic and raise searchStatus event', async () => {
        const res = await Promise.all([
            client.startBasicSearch(conversation.topic),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId = res[1].data && res[1].data.searchId;
        assert(searchId);
    });

    it('should search for user using name and raise searchStatus event', async () => {
        const res = await Promise.all([
            client.startUserSearch(user2.firstName),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId2 = res[1].data && res[1].data.searchId;
        assert(searchId2);
    });

    it('should search for user using phone number and raise searchStatus event', async () => {
        const res = await Promise.all([
            client.startUserSearch(phoneNumber.phoneNumber),
            helper.expectEvents(client, [{
                type: 'searchStatus'
            }])
        ]);
        searchId3 = res[1].data && res[1].data.searchId;
        assert(searchId3);
    });

    it('should confirm search results for the user by name', async () => {
        // wait to allow time for searches to return
        await helper.sleep(3000);
        assert(searchResults[searchId2] && searchResults[searchId2].type === 'basicSearchResults' && searchResults[searchId2].data.users.includes(user2.userId));
    });

    it('should confirm search results for the user by phone number', async () => {
        assert(searchResults[searchId3] && searchResults[searchId3].type === 'basicSearchResults' && searchResults[searchId3].data.users.includes(user2.userId));
    });

    it('should confirm search results for the conversation', async () => {
        assert(searchResults[searchId] && searchResults[searchId].type === 'basicSearchResults' && searchResults[searchId].data.searchResults.some(conv => conv.convId === conversation.convId));
    });
});