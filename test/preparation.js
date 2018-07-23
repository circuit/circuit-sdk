// client logs on to create a global conversation for other tests to use
if (!exports.conversation) {
    before(async () => {
        try {
            const Circuit = require('../circuit-node');
            const config = require('./node/config.json');
            const client = new Circuit.Client(config.bot1);
            const client2 = new Circuit.Client(config.bot2);
            await client.logon();
            const user2 = await client2.logon();
            module.exports.conversation = await client.createGroupConversation([user2.userId], `globalTestConversation${Date.now()}`);
            await client.logout();
            await client2.logout();
        } catch (e) {
            console.error('Error running preparation:', e);
            process.exit(1);
        }
    });
}