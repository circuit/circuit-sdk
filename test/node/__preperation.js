const Circuit = require('../../circuit-node');
const config = require('./config.json');
let client = new Circuit.Client(config.bot1);
// client logs on to create a global conversation for other tests to use
client.logon()
    .then(user => client.createConferenceBridge(`globalTestConversation${Date.now()}`))
    .then(conv => global.conversation = conv)
    .then(() => client.logout())
    .catch(console.error);
