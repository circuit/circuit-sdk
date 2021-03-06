// client logs on to create a global conversation for other tests to use
if (!exports.conversation) {
    before(async () => {
        try {
            const Circuit = require('../circuit-node');
            const config = require('./node/config.json');
            const client = new Circuit.Client(config.bot1);
            module.exports.client = client;
            const client2 = new Circuit.Client(config.bot2);
            module.exports.client2 = client2;
            const client3 = new Circuit.Client(config.sdktester1.config);
            await client.logon();
            const user2 = await client2.logon();
            const user3 = await client3.logon(config.sdktester1.credentials);
            module.exports.conversation = await client.createGroupConversation([user2.userId], `globalTestConversation${Date.now()}`);
            const existingConversations = await client.getConversations({ numberOfConversations: 10 });
            // Ensure there are at least 10 conversations present
            for (let i = 0; i < 10 - existingConversations.length; i++) {
                await client.createConferenceBridge(`newConversation${i + 1}`);
            }
            module.exports.phoneNumber = {
                phoneNumber: `+1561${Math.random().toString().substring(2,9)}`,
                type: `WORK`,
                isExternallyManaged: false
            }
            await client3.updateUser({
                userId: user3.userId,
                phoneNumbers: [module.exports.phoneNumber]
            });
            await client.logout();
            await client2.logout();
            await client3.logout();
        } catch (e) {
            console.error('Error running preparation:', e);
            process.exit(1);
        }
    });
}