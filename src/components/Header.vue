<script>
import { ref, watch, computed, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ElMessageBox } from "element-plus";
import { ElMessage } from "element-plus";

export default {
	setup() {
		const store = useStore();
		const router = useRouter();

		const span = ref(2);
		const offset = ref(4);

		const token = computed(() => {
			return store.getters["User/getToken"];
		});

		const logout = async () => {
			await ElMessageBox.confirm("確認是否登出？", "提示", {
				confirmButtonText: "確定",
				cancelButtonText: "取消",
				type: "warning",
				center: true,
				customClass: "maxWidth-90",
			});
			store.dispatch("User/handleRemoveUser");
			router.push("/login");
			ElMessage({
				type: "success",
				message: "已成功登出！",
				center: true,
				customClass: "maxWidth-90",
			});
		};

		watchEffect(() => {
			if (token.value) {
				span.value = 3;
				offset.value = 3;
			} else {
				span.value = 2;
				offset.value = 4;
			}
		});
		watch(
			() => token.value,
			(newToken, oldToken) => {
				if (newToken) {
					span.value = 3;
					offset.value = 3;
				} else {
					span.value = 2;
					offset.value = 4;
				}
			}
		);

		return {
			token,
			logout,
			span,
			offset,
		};
	},
};
</script>

<template>
	<el-col :span="12" :offset="6">
		<span>My Wallet Application</span>
	</el-col>
	<el-col
		:span="4"
		:offset="2"
		:sm="{ span: 3, offset: 3 }"
		:lg="{ span: span, offset: offset }"
		v-if="!token"
	>
		<router-link to="/login">登入</router-link>
	</el-col>
	<el-col
		:span="4"
		:offset="2"
		:sm="{ span: 3, offset: 3 }"
		:lg="{ span: span, offset: offset }"
		v-if="token"
	>
		<a @click="logout">登出</a>
	</el-col>
</template>

<style scoped lang="sass">
.el-col
	padding: 20px 0px
	span
		font-size: 24px
		font-weight: bold
	a
		padding: 0 1.5rem
		height: 60%
		border-left: solid 2px #fff
		color: #303133
		text-decoration: none
		box-sizing: border-box
		transition: 0.3s
		cursor: pointer
		&:hover
			font-weight: 600
@media screen and (max-width: 768px)
	.el-col
		a
			padding: 0 0.5rem
</style>
