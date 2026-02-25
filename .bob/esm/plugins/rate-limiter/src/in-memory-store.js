class InMemoryStore {
    // The store is mutable.
    // tslint:disable-next-line readonly-keyword
    state = {};
    setForIdentity(identity, timestamps) {
        // tslint:disable-next-line no-object-mutation
        this.state = {
            ...this.state,
            [identity.contextIdentity]: {
                ...this.state[identity.contextIdentity],
                [identity.fieldIdentity]: [...timestamps],
            },
        };
    }
    getForIdentity(identity) {
        const ctxState = this.state[identity.contextIdentity];
        return (ctxState && ctxState[identity.fieldIdentity]) || [];
    }
}
export { InMemoryStore };
