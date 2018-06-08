'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let addedLabelsHT = {};
describe('Authentication', () => {

    it('should login using Client Credentials', async () => {
        client = new Circuit.Client(config.bot1);
        const user = await client.logon();
        assert(!!user);
    });

    it('should be authenticated', async () => {
        await client.isAuthenticated();
    });


    it('should add two labels', async () => {
        const labelValue1 = Date.now().toString() + 'a';
        const labelValue2 = Date.now().toString() + 'b';
        const addedLabels = await client.addLabels([labelValue1, labelValue2]);
        addedLabels.forEach(label => addedLabelsHT[label.labelId] = label);
        const existingLabels = await client.getAllLabels();
        const existingLabelsHT = {};
        existingLabels.forEach(label => existingLabelsHT[label.labelId] = label); 
        Object.keys(addedLabelsHT).forEach(testLabelId => {
            if (!existingLabelsHT[testLabelId] || existingLabelsHT[testLabelId].value !== addedLabelsHT[testLabelId].value) {
                // if the test label doesn't exist in the labels or if they don't equal each other fails the test
                assert(false);
            }
        });
    });

    it('should edit the first added labels', async () => {
        const labelIdToEdit = Object.keys(addedLabelsHT)[0];
        const newValue = Date.now().toString() + 'c';
        const editedLabel = await client.editLabel({
            labelId: labelIdToEdit,
            value: newValue
        });
        if (editedLabel.value !== newValue) {
            assert(false);
            return;
        } else {
            addedLabelsHT[labelIdToEdit] = editedLabel;
        }
        const existingLabels = await client.getAllLabels();
        const returnedLabel = existingLabels.find(label => label.labelId === labelIdToEdit);
        assert(returnedLabel.value === addedLabelsHT[labelIdToEdit].value && returnedLabel.labelId === addedLabelsHT[labelIdToEdit].labelId);
    });

    it('should assign a label to the first conversatrion', async () => {
        let conversation = await client.getConversations({numberOfConversations: 1});
        conversation = conversation[0];
        const labelIdsToAssign = Object.keys(addedLabelsHT);
        const res = await client.assignLabels(conversation.convId, labelIdsToAssign);
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

    it('should unassign the two labels to the first conversation', async () => {
        let conversation = await client.getConversations({numberOfConversations: 1});
        conversation = conversation[0];
        const labelIdsToUnassign = Object.keys(addedLabelsHT);
        const res = await client.unassignLabels(conversation.convId, labelIdsToUnassign);
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
        const labelsIdsToRemove = Object.keys(addedLabelsHT);
        const labelsIdsRemoved = await client.removeLabels(labelsIdsToRemove);
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