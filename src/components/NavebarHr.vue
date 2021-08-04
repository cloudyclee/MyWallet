<script>
import { ref, watch, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import "element-plus/lib/theme-chalk/display.css";

export default {
	setup() {
		const store = useStore();
		const route = useRoute();
		const router = useRouter();

		const token = computed(() => {
			return store.getters["User/getToken"];
		});

		const user = computed(() => {
			return store.getters["User/getUserData"];
		});
		const userName = user.value.userName;

		const isMenuOpen = computed(() => {
			return store.getters.getIsMenuOpen;
		});
		const routePath = computed(() => {
			return route.path;
		});
		const routerList = computed(() => {
			return router.options.routes.slice(1, 7);
		});

		return {
			userName,
			isMenuOpen,
			routePath,
			routerList,
		};
	},
};
</script>

<template>
	<el-menu
		id="nav"
		background-color="#172b3a"
		active-text-color="#42b983"
		text-color="#fcefef"
		router
		mode="horizontal"
		:default-active="routePath.match(/^\/wallet/g) ? '/wallet' : routePath"
		menu-trigger="click"
	>
		<el-menu-item
			v-for="item in routerList"
			:key="item.name"
			:index="item.path"
		>
			<template #title>
				<i :class="item.iconClass"></i>
				<span class="hidden-sm-and-down">{{ item.text }}</span>
			</template>
		</el-menu-item>
	</el-menu>
</template>

<style scoped lang="sass">
#nav
	text-align: left
	height: 100%
	border: none
	z-index: 999
	.menu-collapse
		display: inline-block
		margin: 30px 12px
		vertical-align: middle
		margin-top: 50px
	.user-name
		margin: 30px 12px
		margin-top: 50px
		&.el-menu-item
			padding: 0px
			line-height: unset
			height: auto
		.text
			font-size: 16px
			font-weight: bold
			margin-left: 15px
		&:hover
			background-color: #172b3a !important
	.el-submenu
		.sub-menu-title
			font-size: 16px
			margin-left: 20px
		.el-menu-item-group
			margin-left: 30px
			.el-menu-item
				font-size: 14px
	.el-menu-item
		font-size: 16px
		i
			margin-right: 25px
			font-size: 18px
@media screen and (max-width: 992px)
	#nav
		display: flex
		justify-content: center
		text-align: center
		width: 100%
		height: auto
		.el-menu-item
			width: 16.66%
			i
				margin-right: 0px
</style>
