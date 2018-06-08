'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let addedLabelsHT = {};
describe('Labels', () => {

    before(async () => {
        client = new Circuit.Client(config.bot1);
        const user = await client.logon();
    });

    it('should add two labels', async () => {
        const labelValue1 = `${Date.now()}a`;
        const labelValue2 = `${Date.now()}b`;
        const addedLabels = await client.addLabels([labelValue1, labelValue2]);
        await helper.expectEvents(client, ['labelsAdded']);
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
        const labelIdToEdit = Object.keys(addedLabelsHT)[0];
        const newValue = `${Date.now()}c`;
        let editedLabel = await client.editLabel({
            labelId: labelIdToEdit,
            value: newValue
        });
        await helper.expectEvents(client, ['labelEdited']);     
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
        let conversation = await client.getConversations({numberOfConversations: 1});
        conversation = conversation[0];
        const labelIdsToAssign = Object.keys(addedLabelsHT);
        const res = await client.assignLabels(conversation.convId, labelIdsToAssign);
        await helper.expectEvents(client, ['conversationUserDataChanged']); 
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

    it('should unassign the two labels from first conversation', async () => {
        let conversation = await client.getConversations({numberOfConversations: 1});
        conversation = conversation[0];
        const labelIdsToUnassign = Object.keys(addedLabelsHT);
        const res = await client.unassignLabels(conversation.convId, labelIdsToUnassign);
        await helper.expectEvents(client, ['conversationUserDataChanged']);         
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
        await helper.expectEvents(client, ['labelsRemoved']);     
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