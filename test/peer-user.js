/**
 * Proxy class to control peer users
 */
export class PeerUser {
    constructor(username) {
        this.username = username;
    }

    static async create() {
        const username = await window.onPeerUserCmd({name: 'create'});
        return new PeerUser(username);
    }

    async destroy() {
        return await window.onPeerUserCmd({name: 'destroy', username: this.username})
    }

    async exec(name, ...args) {
        return await window.onPeerUserCmd({name: name, args: args, username: this.username})
    }
}