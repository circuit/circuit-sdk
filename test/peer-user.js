/**
 * Proxy class to control peer users
 */
export class PeerUser {
    constructor(user) {
        this.user = user;
    }

    get username() {
        return this.user.emailAddress;
    }

    get emailAddress() {
        return this.user.emailAddress;
    }

    get userId() {
        return this.user.userId;
    }

    get displayName() {
        return this.user.displayName;
    }

    static async create() {
        const user = await window.onPeerUserCmd({name: 'create'});
        return new PeerUser(user);
    }

    async destroy() {
        return await window.onPeerUserCmd({name: 'destroy', username: this.username})
    }

    async exec(name, ...args) {
        return await window.onPeerUserCmd({name: name, args: args, username: this.username})
    }
}