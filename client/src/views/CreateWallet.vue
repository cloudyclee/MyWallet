<script>
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ElMessage, ElNotification } from "element-plus";
export default {
	setup() {
		const store = useStore();
		const router = useRouter();

		const user = computed(() => {
			return store.getters["User/getUserData"];
		});
		const hasMainWallet = ref(user.value.mainWallet);
		const setMainWallet = ref(true);
		if (user.value.mainWallet) {
			setMainWallet.value = false;
		}

		const formRef = ref(null);
		const formData = reactive({
			walletName: "",
			initialTotal: 0,
		});

		const valid = ref(true);
		const makeNotification = (msg) => {
			ElNotification({
				title: "提交錯誤",
				message: msg,
				position: "bottom-right",
				offset: 20,
				type: "error",
				showClose: false,
			});
			valid.value = false;
		};

		const formValidate = () => {
			const { walletName, initialTotal } = formData;
			if (walletName === "") {
				makeNotification("請輸入名稱");
				return false;
			} else if (walletName.length < 2 || walletName.length > 30) {
				makeNotification("名稱需介於2至30字之間");
				return false;
			}
			if (initialTotal === "") {
				makeNotification("請輸入初始餘額");
				return false;
			} else if (typeof initialTotal !== "number") {
				makeNotification("請輸入數字");
				return false;
			}
			valid.value = true;
		};

		const handleCreateNewWallet = async () => {
			formValidate();
			if (!valid.value) {
				return false;
			}
			const token = computed(() => {
				return store.getters["User/getToken"];
			});

			try {
				const createWallet = await store.dispatch(
					"Wallet/handleCreateWallet",
					{
						data: formData,
						token: token.value,
					}
				);
				if (!createWallet.success) throw createWallet;
				if (setMainWallet.value) {
					const updateUser = await store.dispatch(
						"User/handleUpdateUser",
						{
							data: { mainWallet: createWallet.saveObj._id },
							token: token.value,
						}
					);
					if (!updateUser.success) throw updateUser;
				}

				router.push(`/wallet/${createWallet.saveObj._id}`);
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		return {
			hasMainWallet,
			formRef,
			formData,
			setMainWallet,
			handleCreateNewWallet,
		};
	},
};
</script>

<template>
	<el-container>
		<el-card class="box-card">
			<div class="card-header">
				<span>為您的錢包建立一個新帳戶</span>
			</div>
			<hr />
			<div class="text item">
				<el-form
					ref="formRef"
					:model="formData"
					label-position="top"
					hide-required-asterisk
					size="small"
				>
					<el-form-item label="帳戶名稱" prop="walletName">
						<el-input
							v-model="formData.walletName"
							placeholder="我的帳戶"
						></el-input>
					</el-form-item>
					<el-form-item label="初始餘額" prop="initialTotal">
						<el-input
							v-model.number.native="formData.initialTotal"
							placeholder="請輸入初始餘額"
						></el-input>
					</el-form-item>
					<el-form-item label="設為主帳戶">
						<el-radio-group v-model="setMainWallet">
							<el-radio :label="true">是</el-radio>
							<el-radio :label="false" :disabled="!hasMainWallet">
								否
							</el-radio>
						</el-radio-group>
					</el-form-item>
					<el-button
						plain
						type="primary"
						@click="handleCreateNewWallet"
					>
						建立新帳戶
					</el-button>
				</el-form>
			</div>
		</el-card>
	</el-container>
</template>

<style lang="sass" scoped>
.el-container
    padding: 2.5rem 0
    height: 100%
    display: flex
    justify-content: center
    align-items: center
    .el-card
        padding: 1rem 2rem
        position: relative
        .card-header
            position: relative
            font-weight: 600
            margin-bottom: 1.5rem
        hr
            position: absolute
            left: 50%
            transform: translateX(-50%)
            background-color: #e4e4e4
            border: none
            height: 2px
            width: 90%
        .text
            position: relative
            margin-top: 3.5rem
            .el-form-item__error
                margin-top: 4px
        .el-button
            margin-top: 1rem

.el-message
    left: calc(50% + 100px)
</style>
