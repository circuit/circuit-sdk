'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let settings;
describe('Settings', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should get user settings', async () => {
        settings = await client.getUserSettings();
        assert(settings);
    });

    it('should set user settings and raise userSettingsChanged event', async () => {    
        const shareLocation = settings && !settings.shareLocation || false;
        const newSettings = {
            shareLocation: shareLocation
        }
        const res = await Promise.all([
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