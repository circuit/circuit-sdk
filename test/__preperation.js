// client logs on to create a global conversation for other tests to use
if (!exports.conversation) {
    before(async () => {
        try {
            const Circuit = require('../circuit-node');
            const config = require('./node/config.json');
            let client = new Circuit.Client(config.bot1);
            let client2 = new Circuit.Client(config.bot2);
            await client.logon();
            const user2 = await client2.logon();
            let conversation = await client.createConferenceBridge(`globalTestConversation${Date.now()}`);
            conversation = await client.addParticipant(conversation.convId, [user2.userId]);
            await client.logout();
            await client2.logout();
            exports.conversation = conversation;
        } catch (e) {
            console.error('Error running preparation:', e);
            process.exit(1);
        }
    });
}