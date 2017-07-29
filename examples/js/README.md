## Circuit JS SDK Examples

Each html file is an independent example to show a particular use case. More to come.

### Live examples on rawgit

Try them [live on rawgit](https://rawgit.com/circuit/circuit-js-sdk/master/examples/index.html).

Use your own sandbox account, or one of the following playground accounts:
* kim.jackson@mailinator.com
* maeva.barnaby@mailinator.com
* derek.hopkins@mailinator.com

Password: GoCircuit!1


### Running examples locally

First [register for a free developer account](https://www.circuit.com/web/developers/registration), then [register for an OAuth client-side (Implicit) application](https://circuit.github.io/oauth) providing a local redirect URL such as `http://localhost:7000`.

Then clone the repo and serve the files using a webserver such as http-server:
```bash
git clone https://github.com/circuit/circuit-js-sdk.git
cd circuit-js-sdk
npm i -g http-server
http-server -p 7000
// browse to http://localhost:7000/examples
```
