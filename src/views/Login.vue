<script>
import {
	ref,
	reactive,
	computed,
	onMounted,
	onBeforeUpdate,
	watch,
	onBeforeUnmount,
} from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";

export default {
	setup() {
		// use vuex
		const store = useStore();
		// use vue router
		const router = useRouter();
		const route = useRoute();
		// define refs
		const registerRef = ref(null);
		const loginRef = ref(null);
		const googleLoginBtn = ref(null);
		const loginBtn = ref(null);
		// set form binding data
		const registerData = reactive({
			userName: "",
			userEmail: "",
			password: "",
			pwdCheck: "",
		});
		const loginData = reactive({
			userEmail: "",
			password: "",
		});

		// valid
		const valid = ref(false);
		// password validation function used in rules
		const pwdCheckValidator = (rule, value, callback) => {
			if (value === "") {
				callback(new Error("請再次輸入密碼"));
			} else if (value !== registerData.password) {
				callback(new Error("輸入密碼不一致，請檢查後再次輸入"));
			} else {
				callback();
			}
		};
		// validation rules used by element plus
		const rules = {
			userName: [
				{
					required: true,
					message: "請輸入用戶名稱",
					trigger: "blur",
				},
				{
					min: 2,
					max: 50,
					message: "用戶名稱長度需介於2至50字之間",
					trigger: "blur",
				},
			],
			userEmail: [
				{ required: true, message: "請輸入信箱", trigger: "blur" },
			],
			password: [
				{ required: true, message: "請輸入密碼", trigger: "blur" },
				{
					min: 6,
					max: 1024,
					message: "密碼長度需大於6字元",
					trigger: "blur",
				},
			],
			pwdCheck: [
				{
					required: true,
					validator: pwdCheckValidator,
					trigger: "blur",
				},
			],
		};
		const rulesForLogin = {
			userEmail: rules.userEmail,
			password: rules.password,
		};

		// register & login buttons
		const handleRegister = async (ref) => {
			// form validation
			ref.validate((pass) => {
				valid.value = pass;
			});
			if (!valid.value) return false;

			// if pass the validator, start registration process
			try {
				const { userName, userEmail, password } = registerData;
				const registerUser = await store.dispatch(
					"User/handleRegister",
					{
						userName,
						userEmail,
						password,
						accountType: "user",
					}
				);
				if (!registerUser.success) throw registerUser;

				// if login successes
				router.push("/create/wallet");
			} catch (error) {
				console.log(error.msg || error);
			}
		};
		const handleLogin = async (ref) => {
			// form validation
			ref.validate((pass) => {
				valid.value = pass;
			});
			if (!valid.value) return false;

			try {
				// if pass the validator, then start login process
				const { userEmail, password } = loginData;
				const loginUser = await store.dispatch("User/handleLogin", {
					userEmail,
					password,
				});
				if (!loginUser.success) throw loginUser;

				// if login successes
				if (loginUser.user.mainWallet) {
					router.push("/wallet");
				} else {
					router.push("/create/wallet");
				}
			} catch (error) {
				console.log(error.msg || error);
			}
		};
		// Log in with google
		const GOOGLE_CLIENT_ID = process.env.VUE_APP_GOOGLE_CLIENT_ID;
		const handleLoginWithGoogle = async (data) => {
			try {
				const loginUser = await store.dispatch(
					"User/handleLoginWithGoogle",
					data
				);
				if (!loginUser.success) throw loginUser;

				// if login successes
				if (loginUser.user.mainWallet) {
					router.push("/wallet");
				} else {
					router.push("/create/wallet");
				}
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		const localURL = "http://localhost:3000/api/auth/login";
		const url = "https://my-wallet-by-jin.herokuapp.com/api/auth/google ";
		const googleInit = (postURL) => {
			google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				login_uri: postURL,
				cancel_on_tap_outside: false,
				callback: handleLoginWithGoogle,
			});
			google.accounts.id.renderButton(googleLoginBtn.value, {
				size: "large",
				theme: "filled_blue",
				shape: "pill",
				locale: "zh_TW",
				width: 250,
			});
			google.accounts.id.prompt();
		};
		onMounted(() => {
			googleInit(url);
		});
		onBeforeUpdate(() => {
			googleInit(url);
		});

		return {
			registerRef,
			loginRef,
			googleLoginBtn,
			registerData,
			loginData,
			rules,
			rulesForLogin,
			handleRegister,
			handleLogin,
			handleLoginWithGoogle,
			loginBtn,
		};
	},
};
</script>

<template>
	<div class="login-container">
		<el-row class="content-row">
			<el-col :span="24">
				<el-tabs model-value="login" type="border-card">
					<el-tab-pane label="註冊" name="register">
						<el-form
							ref="registerRef"
							:model="registerData"
							:rules="rules"
							label-position="top"
							status-icon
							inline-message
							size="small"
						>
							<el-form-item label="使用者名稱" prop="userName">
								<el-input
									v-model="registerData.userName"
									placeholder="請輸入用戶名稱"
								></el-input>
							</el-form-item>
							<el-form-item label="電子郵件" prop="userEmail">
								<el-input
									v-model="registerData.userEmail"
									placeholder="請輸入信箱"
								></el-input>
							</el-form-item>
							<el-form-item label="密碼" prop="password">
								<el-input
									v-model="registerData.password"
									placeholder="請輸入密碼"
									show-password
								></el-input>
							</el-form-item>
							<el-form-item label="再次輸入密碼" prop="pwdCheck">
								<el-input
									v-model="registerData.pwdCheck"
									placeholder="再次輸入密碼"
									show-password
									@keyup.enter.native="
										handleRegister(registerRef)
									"
								></el-input>
							</el-form-item>
							<el-row>
								<el-col :span="12" :offset="6">
									<el-button
										round
										type="success"
										@click="handleRegister(registerRef)"
									>
										註冊
									</el-button>
								</el-col>
							</el-row>
						</el-form>
					</el-tab-pane>
					<el-tab-pane label="登入" name="login">
						<el-form
							ref="loginRef"
							:model="loginData"
							:rules="rulesForLogin"
							label-position="top"
							status-icon
							inline-message
							size="small"
						>
							<el-form-item label="電子郵件" prop="userEmail">
								<el-input
									v-model="loginData.userEmail"
									placeholder="請輸入信箱"
								></el-input>
							</el-form-item>
							<el-form-item label="密碼" prop="password">
								<el-input
									v-model="loginData.password"
									placeholder="請輸入密碼"
									show-password
									@keyup.enter.native="handleLogin(loginRef)"
								></el-input>
							</el-form-item>
							<el-row>
								<el-col :span="24">
									<el-button
										round
										type="success"
										ref="loginBtn"
										@click="handleLogin(loginRef)"
									>
										登入
									</el-button>
								</el-col>
								<el-col :span="24">
									<div
										class="google-login-button"
										ref="googleLoginBtn"
									>
										以Google帳戶登入
									</div>
								</el-col>
							</el-row>
						</el-form>
					</el-tab-pane>
				</el-tabs>
			</el-col>
		</el-row>
	</div>
</template>

<style lang="sass">
.login-container
	position: relative
	margin: 0 auto
	padding: 0
	height: 100%
	display: flex
	justify-content: center
	align-items: center
	max-width: 290px
	.el-tabs
		width: 100%
		border-radius: 5px
		.el-tab-pane
			.el-form-item
				label
					font-weight: 600
			.el-button
				margin-top: 2rem
				width: 100%
				letter-spacing: 1.5px
				max-width: 250px
				.login-button
					text-decoration: none
					color: #fff
			.el-col
				display: flex
				justify-content: center
				.google-login-button
					margin-top: 1.5rem
@media screen and (min-width: 768px)
	.login-container
		max-width: 700px
		.content-row
			width: 70%
			.el-tab-pane
				padding: 1.5rem 3rem
</style>
