## JavaScript SDK Examples

There are places with examples, with JSBin the largest set, and Plunker the newest.
Each example snippet is meant to be as simple as possible to show a particular use case.

* [JSBin](https://circuit.github.io/jssdk.html#jsbin)
* [Plunker](https://circuit.github.io/jssdk.html#plunker)
* github, listed on this page [live on rawgit](https://rawgit.com/circuit/circuit-sdk/master/examples/js/index.html)


All examples use OAuth. Use your own sandbox account, or one of the following playground accounts. Password is `GoCircuit!1`.
* kim.jackson@mailinator.com
* maeva.barnaby@mailinator.com
* derek.hopkins@mailinator.com


### Running github examples locally

First [register for a free developer account](https://www.circuit.com/web/developers/registration), then [register for an OAuth client-side (Implicit) application](https://circuit.github.io/oauth) providing a local redirect URL such as `http://localhost:7000`.

Then clone the repo and serve the files using a webserver such as http-server:
```bash
git clone https://github.com/circuit/circuit-sdk.git
cd circuit-sdk
npm i -g http-server
http-server -p 7000
// browse to http://localhost:7000/examples/js
```
