import {
    postApiUserRegister,
    postApiUserLogin,
    postApiUserLoginWithGoogle,
    patchApiUserUpdate
} from "../../api";

export default {
    namespaced: true,
    state: {
        userData: {}
    },
    actions: {
        async handleRegister ( { commit }, payload ) {
            try {
                const { userEmail, password } = payload;
                const registerRes = await postApiUserRegister( payload );
                const loginRes = await postApiUserLogin( { userEmail, password } );
                localStorage.setItem( "user", JSON.stringify( loginRes.data.user ) );
                localStorage.setItem( "token", JSON.stringify( loginRes.data.token ) );
                commit( "setUserActive", loginRes.data );
                return loginRes.data || registerRes.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleLogin ( { commit }, payload ) {
            try {
                const res = await postApiUserLogin( payload );
                localStorage.setItem( "user", JSON.stringify( res.data.user ) );
                localStorage.setItem( "token", JSON.stringify( res.data.token ) );
                commit( "setUserActive", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleLoginWithGoogle ( { commit }, payload ) {
            try {
                const res = await postApiUserLoginWithGoogle( payload );
                localStorage.setItem( "user", JSON.stringify( res.data.user ) );
                localStorage.setItem( "token", JSON.stringify( res.data.token ) );
                commit( "setUserActive", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleUpdateUser ( { commit }, payload ) {
            const { data, token } = payload;
            try {
                const res = await patchApiUserUpdate( data, token );
                localStorage.setItem( "user", JSON.stringify( res.data.user ) );
                commit( "setUserActive", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        handleRemoveUser ( { commit } ) {
            localStorage.removeItem( "user" );
            localStorage.removeItem( "token" );
            commit( "removeUser" );
        }
    },
    mutations: {
        setUserActive ( state, payload ) {
            state.userData = payload.user;
            if ( payload.token ) {
                state.token = payload.token;
            }
        },
        removeUser ( state ) {
            state.userData = {};
            state.token = "";
        },
    },
    getters: {
        getUserData ( state ) {
            if ( localStorage.getItem( "user" ) !== "undefined" ) {
                state.userData = JSON.parse( localStorage.getItem( "user" ) );
            }
            return state.userData;
        },
        getToken ( state ) {
            if ( localStorage.getItem( "token" ) !== "undefined" ) {
                state.token = JSON.parse( localStorage.getItem( "token" ) );
            }
            return state.token;
        },
    }
};