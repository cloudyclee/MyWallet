<script>
import { ref, watch, computed, onErrorCaptured } from "vue";

import { useRoute } from "vue-router";
import { useStore } from "vuex";
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import Navbar from "@/components/Navebar.vue";
import NavbarHr from "@/components/NavebarHr.vue";
import "element-plus/lib/theme-chalk/display.css";

export default {
	components: {
		Header,
		Footer,
		Navbar,
		NavbarHr,
	},
	setup() {
		const store = useStore();
		const route = useRoute();

		// get token and user to decide whether to set key of menu bar
		const token = computed(() => {
			return store.getters["User/getToken"];
		});
		const user = computed(() => {
			return store.getters["User/getUserData"];
		});
		const path = computed(() => {
			return route.path;
		});

		// set menu open
		const width = ref(64);
		const isMenuOpen = computed(() => {
			return store.getters.getIsMenuOpen;
		});
		const handleMenuOpen = () => {
			store.dispatch("handleSetIsMenuOpen", isMenuOpen.value);
		};

		watch(
			() => isMenuOpen.value,
			(newVal, oldVal) => {
				if (newVal) {
					width.value = 250;
				} else {
					width.value = 64;
				}
			}
		);

		onErrorCaptured((err) => {
			console.log(err.msg || err);
		});

		return {
			token,
			user,
			path,
			width,
			isMenuOpen,
			handleMenuOpen,
		};
	},
};
</script>

<template>
	<el-container
		:class="['window-container', { 'pb-50': token && user.mainWallet }]"
	>
		<el-aside
			:width="`${width}px`"
			class="fixed-aside hidden-sm-and-down"
			v-if="token && user.mainWallet"
		>
			<Navbar :key="path + user.userName" />
		</el-aside>
		<el-aside
			:width="`${width}px`"
			class="hidden-sm-and-down"
			v-if="token && user.mainWallet"
		></el-aside>
		<el-container class="main-container">
			<el-header height="auto">
				<el-row align="middle">
					<Header />
				</el-row>
			</el-header>
			<el-main>
				<Suspense>
					<template #default>
						<router-view />
					</template>
					<template #fallback>
						<h1>Loading...</h1>
					</template>
				</Suspense>
				<div
					class="menuOpen hidden-sm-and-down"
					@click="handleMenuOpen"
					v-if="token && user.mainWallet"
					:style="{ left: `${width - 1}px` }"
				>
					{{ isMenuOpen ? "❰" : "❱" }}
				</div>
			</el-main>
			<el-footer
				:class="{ 'footer hidden-sm-and-down': token }"
				height="auto"
			>
				<Footer />
			</el-footer>
		</el-container>
	</el-container>
	<NavbarHr
		class="hidden-md-and-up md-navbar"
		v-if="token && user.mainWallet"
	/>
</template>

<style lang="sass">
*
	font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微軟雅黑", Arial, sans-serif, "微軟正黑體"

html, body
	margin: 0px
	padding: 0px
	height: 100%

#app
	font-family: Avenir, Helvetica, Arial, sans-serif
	-webkit-font-smoothing: antialiased
	-moz-osx-font-smoothing: grayscale
	text-align: center
	color: #2c3e50
	height: 100%
	.window-container
		min-height: 100%
		overflow: auto
		.fixed-aside
			position: fixed
			height: 100%
			z-index: 10
		.el-aside
			background-color: #172b3a
			transition: 0.3s
			overflow-x: hidden
			&::-webkit-scrollbar
				display: none

.main-container
	.el-header
		background-color: #f1f1f1
		padding: 0
		position: relative
	.el-footer
		text-align: center
		background-color: #444444

.el-main
	overflow-x: hidden
	position: relative
	.menuOpen
		position: fixed
		width: 20px
		height: 100px
		left: 249px
		top: 30%
		border: solid 1px
		border-radius: 0px 10px 10px 0px
		text-align: center
		color: #172b3a
		line-height: 100px
		z-index: 999
		cursor: pointer
		user-select: none
		transition: 0.3s
		z-index: 1
		&:hover
			color: #7698b3

.md-navbar
	position: fixed
	bottom: 0px

.el-popper
	&.is-light
		border: none

.maxWidth-90
	max-width: 90%
	&.el-message
		min-width: 300px

.el-notification
	width: 90%
	max-width: 390px

.el-dialog
	min-width: 300px
	.el-input
		margin-top: 1rem

@media screen and (max-width: 992px)
	.pb-50
		padding-bottom: 50px
</style>
