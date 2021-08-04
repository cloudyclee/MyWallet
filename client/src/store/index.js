import { createStore } from 'vuex';
import User from "./User";
import Wallet from "./Wallet";

export default createStore( {
	state: {
		isMenuOpen: false,
	},
	actions: {
		handleSetIsMenuOpen ( { commit }, bool ) {
			commit( "setIsMenuOpen", bool );
		},
	},
	mutations: {
		setIsMenuOpen ( state, bool ) {
			state.isMenuOpen = !bool;
		},
	},
	getters: {
		getIsMenuOpen ( state ) {
			return state.isMenuOpen;
		},
	},
	modules: {
		User,
		Wallet
	}
} );
