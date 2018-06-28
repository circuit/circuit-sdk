'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let addedLabelsHT = {};
let conversation;
describe('Labels', () => {

    before(async () => {
        client = new Circuit.Client(config.bot1);
        await client.logon();
    });

    after(async () => {
        await client.logout();
    });

    it('should add two labels', async () => {
        if (!client.addLabels) {
            console.log('    > API not supported by circuit.');
            assert(true);
        }
        const labelValue1 = `${Date.now()}a`;
        const labelValue2 = `${Date.now()}b`;
        const res = await Promise.all([
            client.addLabels([labelValue1, labelValue2]), 
            helper.expectEvents(client, [{
                type: 'labelsAdded',
                predicate: evt => evt.labels.every(label => label.value === labelValue1 || label.value === labelValue2)
            }])
        ]);
        const addedLabels = res[0];
        addedLabels.forEach(label => addedLabelsHT[label.labelId] = label);
        const existingLabels = await client.getAllLabels();
        const existingLabelsHT = {};
        existingLabels.forEach(label => existingLabelsHT[label.labelId] = label); 
        Object.keys(addedLabelsHT).forEach(testLabelId => {
            if (!existingLabelsHT[testLabelId] || existingLabelsHT[testLabelId].value !== addedLabelsHT[testLabelId].value) {
                assert(false);
            }
        });
    });

    it('should edit one of the added labels', async () => {
        if (!client.editLabel) {
            console.log('    > API not supported by circuit.');
            assert(true);
        }
        const labelIdToEdit = Object.keys(addedLabelsHT)[0];
        const newValue = `${Date.now()}c`;
        const res = await Promise.all([
            client.editLabel({
                labelId: labelIdToEdit,
                value: newValue
            }), 
            helper.expectEvents(client, [{
                type: 'labelEdited',
                predicate: evt => evt.label.labelId === labelIdToEdit && evt.label.value === newValue
            }])
        ]);    
        const editedLabel = res[0];
        if (editedLabel.value !== newValue) {
            assert(false);
        } else {
            addedLabelsHT[labelIdToEdit] = editedLabel;
        }
        const existingLabels = await client.getAllLabels();
        const returnedLabel = existingLabels.find(label => label.labelId === labelIdToEdit);
        assert(returnedLabel.value === addedLabelsHT[labelIdToEdit].value && returnedLabel.labelId === addedLabelsHT[labelIdToEdit].labelId);
    });

    it('should assign a label to the first conversation', async () => {
        if (!client.assignLabels) {
            console.log('    > API not supported by circuit.');
            assert(true);
        }
        conversation = await client.getConversations({numberOfConversations: 1});
        conversation = conversation[0];
        const labelIdsToAssign = Object.keys(addedLabelsHT);
        const results = await Promise.all([
            client.assignLabels(conversation.convId, labelIdsToAssign),
            helper.expectEvents(client, [{
                type: 'conversationUserDataChanged',
                predicate: evt => evt.data.convId === conversation.convId && evt.data.labels.every(label => labelIdsToAssign.includes(label))
            }])
        ]);
        const res = results[0];
        res.forEach(labelId => {
            if (!labelIdsToAssign.includes(labelId)) {
                assert(false);
            }
        });
        conversation = await client.getConversationById(conversation.convId);
        labelIdsToAssign.forEach(labelId => {
            if (!conversation.userData.labelIds.includes(labelId)) {
                assert(false);
            }
        });
    });

    it('should get conversations by the added label and check API returns the correct conversation', async () => {
        sleep(3000);
        const labelIds = Object.keys(addedLabelsHT);
        const labelId = labelIds[0];
        const res = await client.getConversationsByFilter({
            filterConnector: {
                conditions: [{
                    filterTarget: Circuit.Constants.FilterTarget.LABEL_ID,
                    expectedValue: [labelId]
                }]
            },
            retrieveAction: Circuit.Enums.RetrieveAction.CONVERSATIONS
        });
        assert(res.find(conv => conv.convId === conversation.convId));

    }).timeout(8000);

    it('should unassign the two labels from first conversation', async () => {
        if (!client.unassignLabels) {
            console.log('    > API not supported by circuit.');
            assert(true);
        }
        conversation = await client.getConversations({numberOfConversations: 1});
        conversation = conversation[0];
        const labelIdsToUnassign = Object.keys(addedLabelsHT);
        const results = await Promise.all([
            client.unassignLabels(conversation.convId, labelIdsToUnassign),
            helper.expectEvents(client, [{
                type: 'conversationUserDataChanged',
                predicate: evt => evt.data.convId === conversation.convId && labelIdsToUnassign.every(labelId => !evt.data.labels || !evt.data.labels.includes(labelId))
            }])
        ]); 
        const res = results[0];         
        labelIdsToUnassign.forEach(labelId => {
            if (res.includes(labelId)) {
                assert(false);
            }
        });
        conversation = await client.getConversationById(conversation.convId);
        if (conversation.userData.labelIds) {
            labelIdsToUnassign.forEach(labelId => {
                if (conversation.userData.labelIds.includes(labelId)) {
                    assert(false);
                }
            });
        }
    });

    it('should remove the two added labels', async () => {
        if (!client.removeLabels) {
            console.log('    > API not supported by circuit.');
            assert(true);
        }
        const labelsIdsToRemove = Object.keys(addedLabelsHT);
        const res = await Promise.all([
            client.removeLabels(labelsIdsToRemove),
            helper.expectEvents(client, [{
                type: 'labelsRemoved',
                predicate: evt => evt.labelIds.every(labelId => labelsIdsToRemove.includes(labelId))
            }])
        ]); 
        const labelsIdsRemoved = res[0];    
        labelsIdsToRemove.forEach(labelId => {
            if (!labelsIdsRemoved.includes(labelId)) {
                assert(false);
            }
        });
        const remainingLabels = await client.getAllLabels();
        remainingLabels.forEach(label => {
            if (labelsIdsToRemove.includes(label.labelId)) {
                assert(false);
            }
        });
    });
});

function sleep(time) {
    const currentTime = Date.now();
    while (currentTime + time >=  Date.now());
 }