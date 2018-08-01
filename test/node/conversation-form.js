'use strict';

const assert = require('assert');
const Circuit = require('../../circuit-node');
const config = require('./config.json');
const helper = require('./helper');
const prep = require('../preparation');
Circuit.logger.setLevel(Circuit.Enums.LogLevel.Error);

let client;
let user;
let client2;
let user2;
let conversation;
let item;
describe('Conversation Form', () => {
    before(async () => {
        client = new Circuit.Client(config.bot1);
        user = await client.logon();
        client2 = new Circuit.Client(config.bot2);
        user2 = await client2.logon();
        conversation = prep.conversation;
    });

    after(async () => {
        await client.logout();
        await client2.logout();
    });

    it('should create a new form', async () => {
        const form = {
            title: `${Date.now()}title`, // optional
            id: `${Date.now()}id`,
            controls: [{
                type: 'RADIO',
                name: 'radioButton',
                defaultValue: '1', // optional  
                options: [{
                    text: 'button1', 
                    value: '1'
              }, { 
                text: 'button2', 
                value: '2'
              }, {
                text: 'button3', 
                value: '3'
              }]
            }, {
                type: 'CHECKBOX',
                name: 'checkBox',
                options: [{ // required for multi select
                    text: 'check1',
                    value: '1',
                    defaultValue: 'true'  
              }, {
                text: 'check2', 
                value: '2',
              }, {
                text: 'check3', 
                value: '3', 
              }]
            }, {
                type: 'DROPDOWN',
                name: 'dropDown', 
                defaultValue: '3', // optional
                options: [{
                    text: 'dropDown1', 
                    value: '1',
              }, { 
                text: 'dropDown2',
                value: '2',
              }, {
                text: 'dropDown3',
                value: '3',    
              }]
            }, {
                type: 'INPUT',
                name: 'inputField',
                text: 'Input field',    
            }, {
                type: 'SPACER'
            }, {
                type: 'LABEL',
                text: 'Label'  
            }, {
                type: 'BUTTON', // submit the form 
                options: [{
                    text: 'Submit',
                    action: 'submit',
                    notification: 'Form submitted successfully'
              }, { 
                text: 'Reset',  
                action: 'reset', 
                notification: 'Form reset successfully' 
              }]
            }]
          }
        const content = {
            content: `${Date.now()}a`,
            form: form
          }
        item = await client.addTextItem(conversation.convId, content);
        assert(item.text.formMetaData && item.text.formMetaData.id === form.id && item.text.formMetaData.title === form.title && item.text.formMetaData.controls.length === form.controls.length);
    });

    it('should submit a form and raise a formSubmission event', async () => {
        let dataValues = {}
        const submitFormData = {
            id: item.text.formMetaData.id,
            data: [{
                name: 'radioButton',
                value: '2'
               }, {
                name: 'checkBox',
                value: '3'
               }, {
                name: 'dropDown',
                value: '1'
               }, {
                name: 'inputField',
                value: `${Date.now()}input`
               }
            ]
          }
        submitFormData.data.forEach(entry => dataValues[entry.name] = entry);
        const res  = await Promise.all([
            client2.submitForm(item.itemId, submitFormData),
            helper.expectEvents(client, [{
                type: 'formSubmission',
                predicate: evt => evt.itemId === item.itemId &&  evt.form.id === item.text.formMetaData.id && evt.form.data.every(entry => dataValues[entry.name] && dataValues[entry.name].value === entry.value)
            }])  
        ]);
        assert(res[1].itemId === item.itemId &&  res[1].form.id === item.text.formMetaData.id && res[1].form.data.every(entry => dataValues[entry.name] && dataValues[entry.name].value === entry.value));
    });
});