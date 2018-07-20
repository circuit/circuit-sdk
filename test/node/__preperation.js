const Circuit = require('../../circuit-node');
const config = require('./config.json');
let client = new Circuit.Client(config.bot1);
let user;
// client logs on to create a global conversation for other tests to use
before(async () => {
    try {
        user = await client.logon();
        global.conversation = await client.createConferenceBridge(`globalTestConversation${Date.now()}`);
        await client.logout();
    } catch (e) {
        console.error('Error running preparation:', e);
        process.exit(1);
    }
});