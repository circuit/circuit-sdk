'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let addedLabelsHT = {};
let conversation;
let LABEL_SUPPORTED;
describe('Conversation Labels', () => {
    before(async () => {
        conversation = prep.conversation;
        client = prep.client;
        LABEL_SUPPORTED = client.addLabels && Circuit.supportedEvents.includes('labelsAdded') && client.editLabel && Circuit.supportedEvents.includes('labelEdited') && client.assignLabels && client.unassignLabels && client.removeLabels && Circuit.supportedEvents.includes('labelsRemoved');
        // Remove all labels
        const labels = await client.getAllLabels();
        if (labels.length) {
            await client.removeLabels(labels.map(l => l.labelId));
        }
    });

    it('functions: [addLabels, getAllLabels], with event: labelsAdded', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
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

    it('functions: [editLabel, getAllLabels], with event: labelEdited', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
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

    it('functions: [assignLabels, getConversationById], with event: conversationUserDataChanged', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
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

    it('function: getConversationsByFilter', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        // Has to wait because backend has to perform search for getConversationsByFilter
        await helper.sleep(3000);
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
    }).timeout(7000);

    it('function: getConversationsByLabel', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
        const labelIds = Object.keys(addedLabelsHT);
        const labelId = labelIds[0];
        const res = await client.getConversationsByLabel(labelId);
        assert(res.some(conv => conv.convId === conversation.convId));
    });

    it('functions: [unassignLabels, getConversationById], with event: conversationUserDataChanged', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
        }
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

    it('functions: [removeLabels, getAllLabels], with event: labelsRemoved', async () => {
        if (!LABEL_SUPPORTED) {
            console.log('API not yet supported');
            assert(true);
            return;
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