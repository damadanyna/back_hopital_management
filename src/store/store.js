import { createStore } from 'vuex'

// Create a new store instance.
const store = createStore({
  state () {
    return {
      user: {},
      notif_pop:{
          show:false,
          title:'',
          content:'',
          error:false
      },
      ua:[]
    }
  },
  mutations: {
    setUser (state,u) {
      state.user = u
    },
    setUa(state,ua){
      state.ua = ua
    },
    show_notif(state,t){
      state.notif_pop.show = t.show
      state.notif_pop.title = 'Notification'
      state.notif_pop.content = t.content
      state.notif_pop.error = t.error
    },
    hide_notif(state){
        state.notif_pop.show  = false
    }

  }
})

export default store