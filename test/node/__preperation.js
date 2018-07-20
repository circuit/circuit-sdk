const Circuit = require('../../circuit-node');
const config = require('./config.json');
let client = new Circuit.Client(config.bot1);
let client2 = new Circuit.Client(config.bot2);
let user;
let user2;
// client logs on to create a global conversation for other tests to use
async function preperation() {
    user = await client.logon();
    global.conversation = await client.createConferenceBridge(`globalTestConversation${Date.now()}`);
    await client.logout();
}
preperation();