'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let settings;
describe('User Settings', () => {
    before(async () => {
        client = prep.client;
    });

    it('function: getUserSettings', async () => {
        settings = await client.getUserSettings();
        assert(settings);
    });

    it('functions: [setUserSettings, getUserSettings], with event: userSettingsChanged', async () => {    
        const shareLocation = !!!settings.shareLocation;
        const newSettings = {
            shareLocation: shareLocation
        }
        await Promise.all([
            client.setUserSettings(newSettings),
            helper.expectEvents(client, [{
                type: 'userSettingsChanged',
                predicate: evt => evt.userSettings.shareLocation === shareLocation
            }])
        ]);
        settings = await client.getUserSettings();
        assert(settings && settings.shareLocation === shareLocation);
    });
});