import { createRouter, createWebHistory } from 'vue-router';
import { computed } from 'vue';
import { ElMessageBox } from "element-plus";
import store from "../store";
import Home from '../views/Home.vue';
import Analysis from "../views/Analysis.vue";
import User from "../views/User.vue";
import Login from "../views/Login.vue";
import Wallet from '../views/Wallet.vue';
import CreateWallet from "../views/CreateWallet.vue";
import CreateTransc from "../views/CreateTransc.vue";
import CreateConsumeType from "../views/CreateConsumeType.vue";
import subWallet from "../views/SubWallet/SubWallet.vue";
import WalletIndex from "../views/SubWallet/WalletIndex.vue";
import EditTransc from "../views/EditTransc.vue";

const routes = [
	{
		path: '/',
		name: 'Home',
		component: Home,
	},
	{
		path: '/wallet',
		name: 'Wallet',
		// route level code-splitting
		// this generates a separate chunk (about.[hash].js) for this route
		// which is lazy-loaded when the route is visited.
		component: Wallet,
		iconClass: "el-icon-s-cooperation",
		text: "我的帳戶",
		children: [
			{ path: "", name: "walletIndex", component: WalletIndex },
			{ path: ":id", name: "subWallet", component: subWallet, }
		]
	},
	{
		path: "/analysis",
		name: "Analysis",
		component: Analysis,
		iconClass: "el-icon-s-data",
		text: "帳務分析"
	},
	{
		path: "/user",
		name: "User",
		component: User,
		iconClass: "el-icon-user-solid",
		text: "用戶設定"
	},
	{
		path: "/create/wallet",
		name: "CreateWallet",
		component: CreateWallet,
		iconClass: "el-icon-plus",
		text: "新增帳戶"
	},
	{
		path: "/create/transc",
		name: "CreateTransc",
		component: CreateTransc,
		iconClass: "el-icon-edit",
		text: "新增交易記錄"
	},
	{
		path: "/create/consumeType",
		name: "CreateConsumeType",
		component: CreateConsumeType,
		iconClass: "el-icon-first-aid-kit",
		text: "新增交易類別"
	},
	{
		path: "/edit/transc",
		name: "EditTransc",
		component: EditTransc,
	},
	{
		path: "/login",
		name: "Login",
		component: Login
	}
];

const router = createRouter( {
	history: createWebHistory( process.env.BASE_URL ),
	routes
} );

const whiteList = [ "/login", "/" ];
router.beforeEach( async ( to, from ) => {

	const token = computed( () => {
		return store.getters[ "User/getToken" ];
	} );
	const user = computed( () => {
		return store.getters[ "User/getUserData" ];
	} );

	if ( to.path === "/login" && token.value ) {
		if ( !user.value.mainWallet ) {
			return "/create/wallet";
		} else {
			return "/wallet";
		}
	}
	if ( !whiteList.includes( to.path ) && !token.value ) {
		await ElMessageBox.alert( "請先登入", "提示", {
			confirmButtonText: "確定",
			type: "warning",
			center: true,
			customClass: "maxWidth-90"
		} );
		return "/login";
	}
} );

export default router;
