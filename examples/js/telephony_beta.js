<!DOCTYPE html>
<!--
 *  Copyright 2017 Unify Software and Solutions GmbH & Co.KG.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 -->
<html lang="en">
  <head>
    <title>Circuit JS-SDK</title>
    <style>
      body {
        font-family: sans-serif;
        font-size: 14px;
      }
      section { padding-top: 20px; }
      input { margin-right: 10px; }
      button {
        margin-right: 10px;
      }
      pre {padding: 5px; margin: 5px; }
      .string { color: green; }
      .number { color: darkorange; }
      .boolean { color: blue; }
      .null { color: magenta; }
      .key { color: red; }
      .error { color: red; }
      #output span { color: blue; }
      #errorMessage {
        margin-top: 10px;
        color: red;
      }
      #dtmf button {
        background: white;
        width: 40px;
        height: 30px;
        margin-right: 0px;
        border-style: solid;
      }
      #dtmf button:hover {background: #eee;}
      #dtmf button:active {background: #ddd;}
      #dtmf button:focus {outline:0;}
    </style>
    <script src="//unpkg.com/circuit-sdk/circuit.js"></script>
  </head>

  <body>
    <h3>Telephony call</h3>
    <div>
      Make outgoing phone calls to any regular telephone. Telephony Connector needs to be setup for your tenant.<br>
      Use this page with https to allow access to your microphone.
    </div>
    <div id="mainWrapper" style="display: none">
      <section id="domainSection">
        <span>Connect to:</span>
        <select id="domain">
          <option value="beta.circuit.com">beta.circuit.com</option>
        </select>
      </section>
      <section id="connectSection">
        <button id="logon" onclick="logon()" style="">Logon</button>
        <button id="logout" onclick="logout()" style="display: none">Logout</button>
      </section>
      <section>
        <input type="text" id="number" value="81 (804)222-1111"/>
        <button onclick="call()" id="callButton">Call</button>
        <button onclick="endCall()" id="endCallButton" style="display: none">End call</button>
      </section>
      <section>
        <div id="dtmf">
          <div>Send DTMF Tones:</div>
          <div><button onclick="dtmf('1')">1</button><button onclick="dtmf('2')">2</button><button onclick="dtmf('3')">3</button></div>
          <div><button onclick="dtmf('4')">4</button><button onclick="dtmf('5')">5</button><button onclick="dtmf('6')">6</button></div>
          <div><button onclick="dtmf('7')">7</button><button onclick="dtmf('8')">8</button><button onclick="dtmf('9')">9</button></div>
          <div><button onclick="dtmf('*')">*</button><button onclick="dtmf('0')">0</button><button onclick="dtmf('#')">#</button></div>
        </div>
      </section>
      <section id="output">
        <div>Connection state: <span id="logonState">Disconnected</span></div>
        <div>Call state: <span id="callState"></span></div>
        <div>Conversation ID: <span id="convId"></span></div>
        <div>Call ID: <span id="callId"></span></div>
      </section>
    </div>
    <span id="errorMessage" style="display: none"></span>
    <audio id="remoteAudio" autoplay="autoplay"></audio>

    <script>
      var _client;
      var _localUser;
      var _conversation;
      var _call;

      var $domain = document.getElementById('domain');
      var $number = document.getElementById('number');
      var $logonButton = document.getElementById('logon');
      var $logoutButton = document.getElementById('logout');
      var $logonState = document.getElementById('logonState');
      var $remoteAudio = document.getElementById('remoteAudio');
      var $callButton = document.getElementById('callButton');
      var $endCallButton = document.getElementById('endCallButton');
      var $callState = document.getElementById('callState');
      var $convId = document.getElementById('convId');
      var $callId = document.getElementById('callId');
      var $errorMessage = document.getElementById('errorMessage');

      if (typeof Circuit === 'undefined') {
        $errorMessage.textContent = "Could not load SDK (circuit.js)";
        $errorMessage.style.display = 'block';
      } else if (!Circuit.isCompatible()) {
        $errorMessage.textContent = "Sorry, your browser is not supported. Chrome works :)";
        $errorMessage.style.display = 'block';
      } else {
        document.getElementById('mainWrapper').style.display = 'block';
      }

      function resetCallUI() {
        $callState.textContent = '';
        $callId.textContent = '';
        $convId.textContent = '';
        $callButton.style.display = '';
        $endCallButton.style.display = 'none';
        $remoteAudio.srcObject = null;
      }

      function setCallUI(call) {
        _call = call;
        $convId.textContent = _call.convId;
        $callState.textContent = _call.state;
        $callId.textContent = _call.callId;
        $callButton.style.display = 'none';
        $endCallButton.style.display = '';
        if (_call.isEstablished) {
          $remoteAudio.srcObject = _call.remoteAudioStream;
        }
      }

      function addClientEventListeners() {
        if (_client) {
          _client.addEventListener('connectionStateChanged', function onConnectionStateChanged(evt) {
            console.log('Received connectionStateChanged event - state = ', evt.state)
            $logonState.textContent = evt.state;
          });

          _client.addEventListener('callStatus', function (evt) {
            if (_call && _call.callId === evt.call.callId) {
              console.log('Received callStatus event - call = ', evt.call)
              setCallUI(evt.call);
            }
          });

          _client.addEventListener('callEnded', function (evt) {
            if (_call && _call.callId === evt.call.callId) {
              console.log('Received callEnded event - call = ', evt.call)
              _call = null;
              resetCallUI();
            }
          });
        }
      }

      function logon() {
        if (_client) {
          return;
        }
        _client = new Circuit.Client({
          domain: $domain.value,
          client_id: '913da4769e4c4a42b87a60894a05677d',
          scope: 'ALL', // Asking for ALL permissions because all these examples use the same domain
         enableTelephony: true
        });
        addClientEventListeners();

        _client.logon().then(function (user) {
          _localUser = user;
          $domain.disabled = true;
          $logonButton.style.display = 'none';
          $logoutButton.style.display = '';
        }).catch(function (e) {
          console.error(e);
          alert('Unable to logon. Error: ' + e);
          _client.removeAllListeners();
          _client = null;
        });
      }

      function logout() {
        if (!_client) {
          return;
        }
        _localUser = null;
        _client.logout();
        _client.removeAllListeners();
        _client = null;

        $domain.disabled = false;
        $logonButton.style.display = '';
        $logoutButton.style.display = 'none';
        $logonState.textContent = 'Disconnected';
      }

      function call() {
        if (_call) {
          return;
        }

        if (!_client || !_localUser) { return alert('Caller is not logged in'); }
        if (!$number.value) { return alert('Number missing'); }

        var mediaType = {audio: true, video: false};
        _client.dialNumber($number.value, null, mediaType)
          .then(setCallUI)
          .catch(function (err) {
          alert('Error initiating a call with ' + $number.value + '. ' + err);
          console.error(err);
        });
      }

      function dtmf(digit) {
        if (!_client || !_localUser) { return alert('Caller is not logged in'); }
        if (!_call) { return alert('No call in progress'); }

        var mediaType = {audio: true, video: false};
        _client.sendDigits(_call.callId, digit)
          .catch(function (err) {
          alert('Error sending DTMF digits. ' + err);
          console.error(err);
        });
      }

      function endCall() {
        if (_call) {
          _client.endCall(_call.callId).then(function () {
            console.log('Successfully ended call');
            _call = null;
            resetCallUI();
          });
        }
      }

      resetCallUI();
    </script>
  </body>
</html>

