Circuit JavaScript and Node.js SDK
==================================

[![GitHub release](https://img.shields.io/github/release/circuit/circuit-sdk.svg)](https://github.com/circuit/circuit-sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)


### Prerequisites
* Developer account on circuitsandbox.net. Get it for free at [developer registration](https://www.circuit.com/web/developers/registration).
* OAuth 2.0 `client_id` and optionally `client_secret`. Get if for free at [circuit.github.com/oauth](https://circuit.github.com/oauth).


### API Reference
https://circuitsandbox.net/sdk/ with most APIs described in the [Client](https://circuitsandbox.net/sdk/classes/Client.html) class.

More info at [circuit.github.io](https://circuit.github.io/).

### Usage

#### JavaScript
Add the the line below to the HTML file of you app. This will include the latest version of Circuit SDK and make the `Circuit` object available.
```html
<script type="text/javascript" src="https://unpkg.com/circuit-sdk"></script>
```

#### Node.js
```bash
npm install --save circuit-sdk
```

### Application Types
The majority of apps fall in one of the three types below. Each type uses a different OAuth 2.0 Grant.

1. **Client-side web applications** use the JavaScript SDK with the [OAuth 2.0 Implicit Grant](https://circuit.github.io/oauth.html#implicit).
   ```javascript
   // No client_secret needed for Implicit Grant. SDK will obtain access token.
   let client = new Circuit.Client({
     client_id: '<your client_id>',
     domain: 'circuitsandbox.net'
   });
   client.logon()
     .then(user => console.log('Logged on as ' + user.displayName))
   ```

2. **Server-side web applications** use the JavaScript SDK (or [REST API](https://circuitsandbox.net/rest/v2/swagger/ui/index.html)) on the client, but handle the authentication flow on the server using the [OAuth 2.0 Authorization Code Grant](https://circuit.github.io/oauth.html#authorization_code). The access token is obtained on the server and then passed to the client to use in the Circuit JavaScript SDK. These apps may also use the Node.js SDK on the server side to act on behalf of the user.<br>
Example apps: [node-linkify](https://github.com/circuit/node-linkify) or [circuit-google-assistant](https://github.com/circuit/circuit-google-assistant)
   ```javascript
   // access token is obtained and managed by server-side app
   let client = new Circuit.Client({
     client_id: '<your client_id>',
     domain: 'circuitsandbox.net'
   });
   client.logon({accessToken: '<access_token>'})
     .then(user => console.log('Logged on as ' + user.displayName))
   ```

3. **Bots** use the [Node.js SDK](https://www.npmjs.com/package/circuit-sdk) or the [REST API](https://circuitsandbox.net/rest/v2/swagger/ui/index.html) and use the [OAuth 2.0 Client Credentials Grant](https://circuit.github.io/oauth.html#client_credentials). Bots are a special type of user; they don't login on behalf of a regular user, hence no OAuth popup asking for a user`s credentials and permissions.<br>
Example bots: [xlator-bot](https://github.com/circuit/xlator-bot) or [node-sdk-example](https://github.com/circuit/node-sdk-example)<br>
Example electron bots: [webrtc-bot-example](https://github.com/circuit/webrtc-bot-example) or [live-cam-bot](https://github.com/circuit/live-cam-bot)
   ```javascript
   const Circuit = require('circuit-sdk');
   let client = new Circuit.Client({
     client_id: '<client_id>',
     client_secret: '<client_secret>',
     domain: 'circuitsandbox.net'
   });
   client.logon()
     .then(user => console.log('Logged on as bot: ' + user.emailAddress))
   ```



### Examples

> JavaScript examples are located at [/examples/js](/examples/js) with more examples on [jsbin](https://circuit.github.io/jssdk.html#jsbin).

> Node.js example apps are on [github](https://github.com/circuit). A summary is listed [here](https://circuit.github.io/nodejs.html). Runkit allows playing with Node.js modules live, similar to jsbin or jsfiddle on the client. [Try it on runkit](https://runkit.com/rogeru/circuit-sdk)

Here are some snippets to get you started.

#### Create Group Conversation and send text message
Logon as bot, create a group conversation with two users and send a text message.
```javascript
client.logon()
  .then(user => console.log(`Logged on as ${user.displayName}`, user))
  .then(() => client.getUsersByEmail(['kim.jackson@mailinator.com', 'maeva.barnaby@mailinator.com']))
  .then(users => users.map(user => user.userId))
  .then(userIds => client.createGroupConversation(userIds, 'runkit example'))
  .then(conv => client.addTextItem(conv.convId, 'I am test bot. What can I do for you?'))
  .then(client.logout)
  .catch(console.error)
```

#### Get Conversations
Get 10 newest conversations of logged on user.
```javascript
client.getConversations({numberOfConversations: 10})
  .then(conversations => console.log(`Retrieved ${conversations.length} conversations`))
```

#### Video call with another Circuit user
Start a video call with another user. Create conversation if not yet existing.
> Only applicable to JavaScript SDK and only on browsers supporting WebRTC
```javascript
client.makeCall('bob@company.com', {audio: true, video: true}, true)
  .then(call => console.log('New call: ', call));
```

#### Listen for events
```javascript
// Register new items added to the feed of this user. E.g. incoming text message
client.addEventListener('itemAdded', item =>
  console.log('itemAdded event received:', item));

// Register for connection state changes
client.addEventListener('connectionStateChanged', evt => {
  console.log(`New state is ${evt.state}`);
});

// Register and log all events
Circuit.supportedEvents.forEach(e => client.addEventListener(e, console.log));
```

#### Create an injector
Injectors allow extending the conversation, item and user objects within the SDK.
In this example a new attribute `teaser` is created on the item object. This `teaser` will be added to item objects in any reponse or event from the SDK.
```javascript
Circuit.Injectors.itemInjector = function (item) {
  if (item.type === Circuit.Enums.ConversationItemType.TEXT) {
    // Create item.teaser attribute with replacing br and hr tags with a space
    item.teaser = item.text.content.replace(/<(br[\/]?|\/li|hr[\/]?)>/gi, ' ');
  } else {
    item.teaser = item.type;
  }
};
```

### Supported Browsers
Chrome and Firefox are officially supported.

### Help us improve the SDK
Help us improve the SDK or examples by sending us a pull-request or opening a [GitHub Issue](https://github.com/circuit/circuit-sdk/issues/new).
