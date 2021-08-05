import {
    postApiWalletCreate,
    getApiWalletsRead,
    getApiWalletRead,
    patchApiWalletUpdate,
    deleteApiWalletsDelete,
    deleteApiWalletDelete,
} from "../../api";

export default {
    namespaced: true,
    state: {
        wallets: [],
        wallet: {},
    },
    actions: {
        async handleCreateWallet ( { commit }, payload ) {
            const { data, token } = payload;
            try {
                const res = await postApiWalletCreate( data, token );
                commit( "createWallet", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleGetWallets ( { commit }, token ) {
            try {
                const res = await getApiWalletsRead( token );
                commit( "setWallets", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleGetWallet ( { commit }, payload ) {
            try {
                const { token, _id } = payload;
                const res = await getApiWalletRead( token, _id );
                commit( "setWallet", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleUpdateWallet ( { commit }, payload ) {
            const { data, token, _id } = payload;

            try {
                const res = await patchApiWalletUpdate( data, token, _id );
                commit( "setWallet", res.data );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
        async handleDeleteWallet ( { commit }, payload ) {
            const { token, _id } = payload;
            try {
                const res = await deleteApiWalletDelete( token, _id );
                commit( "deleteWallet" );
                return res.data;
            } catch ( err ) {
                return err;
            }
        },
    },
    mutations: {
        createWallet ( state ) {
            console.log( "create successfully" );
        },
        setWallets ( state, payload ) {
            const { wallets } = payload;
            wallets.forEach( item => {
                let totalAmounts = item.initialTotal;
                let expense = 0;
                let income = 0;
                item.transaction.forEach( trans => {
                    if ( trans.transType === "income" ) {
                        totalAmounts += trans.amount;
                    } else {
                        totalAmounts -= trans.amount;
                    }
                    if ( new Date() - new Date( trans.date ) < 60 * 60 * 24 * 30 * 1000 ) {
                        if ( trans.transType === "income" ) {
                            income += trans.amount;
                        } else {
                            expense += trans.amount;
                        }
                    }
                } );
                item.totalAmounts = totalAmounts;
                item.expense = expense;
                item.income = income;
                item.total = expense + income;
                item.monthTotal = -expense + income;
            } );
            state.wallets = wallets;
        },
        setWallet ( state, payload ) {
            state.wallet = payload.wallet;
        },
        deleteWallet ( state ) {
            console.log( "delete successfully" );
        },
    },
    getters: {
        getWallets ( state ) {
            return state.wallets;
        },
        getWallet ( state ) {
            return state.wallet;
        },
    }
};