const user = {
    state: () => ({
        user: {},
    }),
    mutations: {
        setUser (state,u) {
            state.user = u
        },
    },
}

export default user