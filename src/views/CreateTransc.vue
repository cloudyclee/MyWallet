<script>
import { ref, reactive, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElNotification } from "element-plus";
export default {
	setup() {
		const store = useStore();
		const router = useRouter();
		const route = useRoute();

		// set data to render
		const formRef = ref(null);
		const formData = reactive({
			id: route.query ? route.query.id : "",
			date: new Date(),
			amount: 0,
			transType: "expense",
			consumeType: "",
			note: "",
		});

		const user = computed(() => {
			return store.getters["User/getUserData"];
		});
		const type = reactive({
			expense: user.value.expenseType,
			income: user.value.incomeType,
		});
		const token = computed(() => {
			return store.getters["User/getToken"];
		});
		store.dispatch("Wallet/handleGetWallets", token.value);
		const userWallets = computed(() => {
			return store.getters["Wallet/getWallets"];
		});

		// form validation
		const valid = ref(true);
		const amountValidator = (rule, value, callback) => {
			if (value === 0) {
				callback(new Error("金額不得為0"));
			} else {
				callback();
			}
		};
		const rules = {
			id: [
				{
					required: true,
					message: "請選擇記錄帳戶",
					trigger: "change",
				},
			],
			date: [
				{
					type: "date",
					required: true,
					message: "請選擇日期",
					trigger: "change",
				},
			],
			amount: [
				{
					type: "number",
					required: true,
					message: "請輸入金額",
					trigger: "blur",
				},
				{ validator: amountValidator, trigger: "blur" },
			],
			transType: [
				{
					required: true,
					message: "請選擇交易類型",
					trigger: "change",
				},
			],
			consumeType: [
				{ required: true, message: "請選擇種類", trigger: "change" },
			],
			note: [{ max: 100, message: "字數超過上限", trigger: "change" }],
		};

		const handleAddTransaction = async (ref) => {
			ref.validate((pass) => {
				valid.value = pass;
			});
			if (!valid.value) {
				return false;
			}

			const { id, ...data } = formData;
			const transcRecord = computed(() => {
				const wallet = userWallets.value.find(
					(item) => item._id === id
				);
				return wallet.transaction;
			});

			try {
				const createTransc = await store.dispatch(
					"Wallet/handleUpdateWallet",
					{
						data: {
							transaction: [...transcRecord.value, data],
						},
						token: token.value,
						_id: id,
					}
				);
				if (!createTransc.success) throw createTransc;
				router.push(`/wallet/${formData.id}`);
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		return {
			userWallets,
			formRef,
			formData,
			type,
			rules,
			handleAddTransaction,
		};
	},
};
</script>

<template>
	<el-row class="trans-row">
		<el-col :span="24" :sm="{ span: 16, offset: 4 }">
			<el-form
				ref="formRef"
				:model="formData"
				:rules="rules"
				label-position="left"
				label-width="70px"
				inline-message
				hide-required-asterisk
			>
				<el-form-item label="帳戶" prop="id">
					<el-select v-model="formData.id" placeholder="請選擇帳戶">
						<el-option
							v-for="item in userWallets"
							:label="item.walletName"
							:value="item._id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="類型" prop="transType">
					<el-select
						v-model="formData.transType"
						placeholder="請選擇交易類型"
					>
						<el-option label="支出" value="expense" />
						<el-option label="收入" value="income" />
					</el-select>
				</el-form-item>
				<el-form-item label="種類" prop="consumeType">
					<el-select
						v-model="formData.consumeType"
						placeholder="請選擇記錄種類"
					>
						<el-option
							v-for="item in type[formData.transType]"
							:key="item"
							:label="item"
							:value="item"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="時間" prop="date">
					<el-date-picker
						type="date"
						placeholder="請選擇日期"
						v-model="formData.date"
						class="date-picker"
					></el-date-picker>
				</el-form-item>
				<el-form-item label="金額" prop="amount">
					<el-input
						v-model.number.native="formData.amount"
						placeholder="請輸入金額"
					/>
				</el-form-item>
				<el-form-item label="備註" prop="note">
					<el-input
						type="textarea"
						maxlength="100"
						show-word-limit
						:autosize="{ minRows: 2 }"
						v-model="formData.note"
						placeholder="交易備註"
					/>
				</el-form-item>
			</el-form>
		</el-col>
		<el-col
			:span="12"
			:offset="6"
			:sm="{ span: 8, offset: 8 }"
			class="button-col"
		>
			<el-button
				round
				type="success"
				@click="handleAddTransaction(formRef)"
			>
				新增交易紀錄
			</el-button>
		</el-col>
	</el-row>
</template>

<style lang="sass">
.trans-row
	margin: 5rem 0px
	.el-form-item
		margin-bottom: 30px
		.el-input, .el-textarea, .el-input.el-date-editor.date-picker
			width: 90%
		.el-select
			width: 90%
			.el-input
				width: 100%
	.button-col
		padding-top: 2rem
@media screen and (max-width: 992px)
	.trans-row
		margin: 2rem 0px
</style>
