<script>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";

export default {
	setup() {
		// use vuex
		const store = useStore();
		// use vue router
		const route = useRoute();
		const router = useRouter();

		// set form binding data
		const user = computed(() => {
			return store.getters["User/getUserData"];
		});

		// define refs
		const formRef = ref(null);
		const formLabelPosition = ref("left");
		const formData = reactive({
			userName: user.value.userName,
			userEmail: user.value.userEmail,
			originalPwd: "",
			password: "",
			pwdCheck: "",
		});
		const isEditable = reactive({
			userName: false,
			userEmail: false,
			originalPwd: false,
			password: false,
			pwdCheck: false,
		});

		const checkLabelPosition = () => {
			const width = document.body.clientWidth;
			if (width > 500) {
				formLabelPosition.value = "left";
			} else {
				formLabelPosition.value = "top";
			}
		};

		// valid
		const valid = ref(false);
		// password validation function used in rules
		const pwdCheckValidator = (rule, value, callback) => {
			if (value !== formData.password) {
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
				{
					min: 6,
					max: 1024,
					message: "密碼長度需大於6字元",
					trigger: "blur",
				},
			],
			pwdCheck: [
				{
					validator: pwdCheckValidator,
					trigger: "blur",
				},
			],
		};

		const changeEditStatus = (key) => {
			isEditable[key] = !isEditable[key];
		};

		const isLoading = ref(false);
		const checkPwdText = ref("檢查");
		const checkPwdType = ref("warning");
		const checkOriginalPwd = async () => {
			if (!isEditable.password && !isEditable.pwdCheck) {
				isLoading.value = true;
				try {
					// if pass the validator, then start login process
					const checkUser = await store.dispatch("User/handleLogin", {
						userEmail: user.value.userEmail,
						password: formData.originalPwd,
					});
					isLoading.value = false;
					if (!checkUser || !checkUser.success) throw checkUser;

					// if login successes
					isEditable.password = true;
					isEditable.pwdCheck = true;
					checkPwdText.value = "成功";
					checkPwdType.value = "success";
					setTimeout(() => {
						checkPwdText.value = "取消";
						checkPwdType.value = "danger";
					}, 3000);
				} catch (error) {
					console.log(error.msg || error);
				}
			} else {
				isEditable.password = false;
				isEditable.pwdCheck = false;
				checkPwdText.value = "檢查";
				checkPwdType.value = "warning";
			}
		};

		// register & login buttons
		const handleUpdateUserData = async (ref) => {
			// form validation
			ref.validate((pass) => {
				valid.value = pass;
			});
			if (!valid.value) return false;

			let data = {};
			if (formData.userName !== user.value.userName) {
				data.userName = formData.userName;
			}
			if (formData.userEmail !== user.value.userEmail) {
				data.userEmail = formData.userEmail;
			}
			if (formData.password !== "") {
				data.password = formData.password;
			}

			const token = computed(() => {
				return store.getters["User/getToken"];
			});

			// if pass the validator, start registration process
			try {
				const updateUser = await store.dispatch(
					"User/handleUpdateUser",
					{
						data,
						token: token.value,
					}
				);
				if (!updateUser || !updateUser.success) throw updateUser;

				// if login successes
				ElMessage.success({
					message: "變更成功！",
					type: "success",
				});
				console.log(user.value);
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		onMounted(() => {
			checkLabelPosition();
			window.addEventListener("resize", checkLabelPosition);
		});

		return {
			formLabelPosition,
			formRef,
			isEditable,
			formData,
			rules,
			handleUpdateUserData,
			changeEditStatus,
			checkOriginalPwd,
			isLoading,
			checkPwdText,
			checkPwdType,
		};
	},
};
</script>

<template>
	<el-container class="user-container">
		<el-row>
			<el-col :span="24">
				<el-form
					ref="formRef"
					:model="formData"
					:rules="rules"
					:label-position="formLabelPosition"
					label-width="140px"
					status-icon
					:hide-required-asterisk="true"
					inline-message
				>
					<el-form-item label="使用者名稱" prop="userName">
						<el-input
							v-model="formData.userName"
							placeholder="請輸入用戶名稱"
							:disabled="!isEditable.userName"
						></el-input>
						<el-button
							plain
							:type="isEditable.userName ? 'success' : 'primary'"
							@click="changeEditStatus('userName')"
						>
							{{ isEditable.userName ? "儲存" : "編輯" }}
						</el-button>
					</el-form-item>
					<el-form-item label="電子郵件" prop="userEmail">
						<el-input
							v-model="formData.userEmail"
							placeholder="請輸入電子郵件信箱"
							:disabled="!isEditable.userEmail"
						></el-input>
						<el-button
							plain
							:type="isEditable.userEmail ? 'success' : 'primary'"
							@click="changeEditStatus('userEmail')"
						>
							{{ isEditable.userEmail ? "儲存" : "編輯" }}
						</el-button>
					</el-form-item>
					<el-form-item label="原密碼">
						<el-input
							v-model="formData.originalPwd"
							placeholder="請輸入原密碼"
							show-password
						></el-input>
						<el-button
							plain
							:type="checkPwdType"
							@click="checkOriginalPwd"
							:loading="isLoading"
						>
							{{ checkPwdText }}
						</el-button>
					</el-form-item>
					<el-form-item
						label="新密碼"
						prop="password"
						class="transparent-item"
					>
						<el-input
							v-model="formData.password"
							:placeholder="
								isEditable.password
									? '請輸入新密碼'
									: '請先輸入原密碼'
							"
							:disabled="!isEditable.password"
							:show-password="isEditable.password"
						></el-input>
						<div class="transparent-button" @click.prevent="" />
					</el-form-item>
					<el-form-item
						label="請輸入新密碼"
						prop="pwdCheck"
						class="transparent-item"
					>
						<el-input
							v-model="formData.pwdCheck"
							:placeholder="
								isEditable.pwdCheck
									? '再次輸入新密碼'
									: '請先輸入原密碼'
							"
							:disabled="!isEditable.pwdCheck"
							:show-password="isEditable.pwdCheck"
							@keyup.enter.native="handleUpdateUserData(formRef)"
						></el-input>
						<div class="transparent-button" @click.prevent="" />
					</el-form-item>
				</el-form>
			</el-col>
			<el-col
				:span="8"
				:offset="8"
				style="padding-top: 30px; padding-bottom: 20px;"
			>
				<el-button
					type="success"
					@click="handleUpdateUserData(formRef)"
				>
					確認修改
				</el-button>
			</el-col>
		</el-row>
	</el-container>
</template>

<style lang="sass">
.user-container
	padding: 3.5rem 0
	height: 100%
	display: flex
	justify-content: center
	align-items: center
	.el-form-item
		margin-bottom: 1.5rem
		.el-form-item__label
			font-weight: 700
			padding-left: 40px
		.el-input
			width: 50%
			margin-left: 20px
			margin-right: 50px
			.el-input__inner
				cursor: default
				vertical-align: middle
		.transparent-button
			display: inline-block
			min-height: none
			height: 40px
			text-align: center
			box-sizing: border-box
			user-select: none
			-moz-user-select: none
			-webkit-user-select: none
			-ms-user-select: none
			width: 70px
			font-size: 14px
			color: #fff
			background-color: #fff
			border: none
			vertical-align: middle
		.el-button
			font-size: 14px
@media screen and (min-width: 768px)
	.user-container
		.content-row
			width: 70%
@media screen and (max-width: 500px)
	.user-container
		.el-form-item
			margin-bottom: 3rem
			.el-form-item__label
				text-align: center
				padding-left: 0
			.el-input
				width: 80%
				margin-bottom: 1rem
				margin-right: 0
				margin-left: 0
				.el-input__inner
					text-align: center
			.el-button, .transparent-button
				width: 80%
			.transparent-button
				height: 0px
			&.transparent-item
				margin-bottom: 0rem
</style>
