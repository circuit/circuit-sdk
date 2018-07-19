const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
let client = new Circuit.Client(config.bot1);
let client2 = new Circuit.Client(config.bot2);
// client logs on to create a global conversation for other tests to use
client.logon()
    .then(() => client.createConferenceBridge(`globalTestConversation${Date.now()}`))
    .then(conv => global.conversation = conv)
    .then(() => client.logout())
    .catch(console.error);