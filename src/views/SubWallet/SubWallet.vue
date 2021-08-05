<script>
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
import { useStore } from "vuex";
import { ElMessageBox, ElMessage, ElLoading } from "element-plus";

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
		const wallet = computed(() => {
			return store.getters["Wallet/getWallet"];
		});
		const id = computed(() => {
			return route.params.id;
		});
		store.dispatch("Wallet/handleGetWallet", {
			token: token.value,
			_id: id.value,
		});

		const userSelectTime = ref(new Date());
		const month = computed(() => {
			return userSelectTime.value.getMonth() + 1;
		});
		const year = computed(() => {
			return userSelectTime.value.getFullYear();
		});

		// caculate statistics of this wallet
		const totalAmounts = computed(() => {
			let ta = wallet.value.initialTotal;
			if (wallet.value && wallet.value.transaction) {
				wallet.value.transaction.forEach((item) => {
					if (item.transType === "income") {
						ta += item.amount;
					} else {
						ta -= item.amount;
					}
				});
			}
			return ta;
		});
		const stat = computed(() => {
			let expense = 0;
			let income = 0;
			if (wallet.value && wallet.value.transaction) {
				wallet.value.transaction.forEach((item) => {
					const nowTime = new Date(item.date);
					const nowYear = nowTime.getFullYear();
					const nowMonth = nowTime.getMonth() + 1;
					if (nowYear === year.value && nowMonth === month.value) {
						if (item.transType === "income") {
							income += item.amount;
						} else {
							expense += item.amount;
						}
					}
				});
			}
			return { expense, income };
		});

		// add comma to numbers
		const NtM = (num) => {
			const isNegative = num < 0;
			const str = (Math.abs(num) + "").split("");
			const l = str.length;
			let idx = 1;
			for (let i = l; i > 0; i--) {
				if (idx % 3 === 0 && i !== 1) {
					str[i - 1] = `,${str[i - 1]}`;
				}
				idx++;
			}
			return isNegative ? `-${str.join("")}` : str.join("");
		};

		// find all transactions of a certain date
		const transOfCertainDay = (day) => {
			let subTrans = [];
			let dayTotal = 0;
			if (wallet.value && wallet.value.transaction) {
				wallet.value.transaction.forEach((item) => {
					const { date, ...data } = item;
					const nowTime = new Date(date);
					const nowDate = nowTime.getDate();
					const nowMonth = nowTime.getMonth() + 1;
					const nowYear = nowTime.getFullYear();
					if (
						nowYear === year.value &&
						nowMonth === month.value &&
						nowDate === day
					) {
						if (data.transType == "income") {
							dayTotal += data.amount;
						} else {
							dayTotal -= data.amount;
						}
						data.amount = NtM(data.amount);
						subTrans.push({
							date: new Date(date).getDate(),
							...data,
						});
					}
				});
			}
			return { subTrans, dayTotal: NtM(dayTotal) };
		};
		// set style of amount
		const setStyle = ({ row, column, rowIndex, columnIndex }) => {
			if (columnIndex === 3) {
				if (row.transType === "expense") {
					return { color: "#e71d36" };
				} else {
					return { color: "#42b983" };
				}
			}
		};

		// set dialogue for editting wallet name and total amount
		const dialogueVisible = ref(false);
		const walletNameVisible = ref(false);
		const amountVisible = ref(false);
		const walletName = ref("");
		const amount = ref(0);
		const valid = ref(true);
		const setRef = (el) => {
			if (walletNameVisible && el) {
				el.focus();
			}
			if (amountVisible && el) {
				el.focus();
			}
		};
		const closeDialogue = async (bool) => {
			if (!bool) {
				walletNameVisible.value = false;
				amountVisible.value = false;
				dialogueVisible.value = false;
			} else {
				let data;
				if (walletNameVisible.value) {
					data = editWalletName();
				}
				if (amountVisible.value) {
					data = editTotal();
				}
				if (!valid.value) return false;

				walletNameVisible.value = false;
				amountVisible.value = false;
				dialogueVisible.value = false;
				walletName.value = "";
				amount.value = 0;

				try {
					const updateWallet = await store.dispatch(
						"Wallet/handleUpdateWallet",
						{
							data,
							token: token.value,
							_id: id.value,
						}
					);
					if (!updateWallet.success) throw updateWallet;
					ElMessage.success({
						message: "變更成功",
						customClass: "maxWidth-90",
						center: true,
					});
				} catch (error) {
					console.log(error.nsg || error);
				}
			}
		};

		// dropdown menu functions of wallet
		const handleAddTransaction = () => {
			router.push({
				path: "/create/transc",
				query: { id: wallet.value._id },
			});
		};

		const handleWalletNameEdit = () => {
			walletNameVisible.value = true;
			dialogueVisible.value = true;
		};
		const editWalletName = () => {
			valid.value = true;
			if (walletName.value === "") {
				valid.value = false;
				ElMessage.error({
					message: "請輸入帳戶名稱",
					customClass: "maxWidth-90",
					center: true,
				});
			} else if (
				walletName.value.length < 2 ||
				walletName.value.length > 30
			) {
				valid.value = false;
				ElMessage.error({
					message: "名稱長度需介於2至30字元之間",
					customClass: "maxWidth-90",
					center: true,
				});
			}
			return { walletName: walletName.value };
		};

		const handleTotalEdit = () => {
			amountVisible.value = true;
			dialogueVisible.value = true;
		};
		const editTotal = () => {
			valid.value = true;
			if (amount.value === "") {
				valid.value = false;
				ElMessage.error({
					message: "請輸入調整後的餘額",
					customClass: "maxWidth-90",
					center: true,
				});
			} else if (typeof amount.value !== "number") {
				valid.value = false;
				ElMessage.error({
					message: "請輸入數字",
					customClass: "maxWidth-90",
					center: true,
				});
			} else if (amount.value === totalAmounts.value) {
				valid.value = false;
				ElMessage.error({
					message: "請變更餘額",
					customClass: "maxWidth-90",
					center: true,
				});
			}
			const data = {
				date: new Date(),
				transType:
					amount.value > totalAmounts.value ? "income" : "expense",
				consumeType: "其他",
				amount: Math.abs(amount.value - totalAmounts.value),
				note: "調整餘額",
			};
			return { transaction: [...wallet.value.transaction, data] };
		};

		const handleSetMainWallet = async () => {
			if (user.value.mainWallet === id.value) {
				ElMessage.warning({
					message: "此帳戶已是主帳戶",
					customClass: "maxWidth-90",
					center: true,
				});
				return false;
			}
			try {
				await ElMessageBox.confirm(
					"確定將此帳戶設為主帳戶嗎？",
					"提示",
					{
						confirmButtonText: "確定",
						cancelButtonText: "取消",
						type: "warning",
						customClass: "maxWidth-90",
					}
				);
				const updateUser = await store.dispatch(
					"User/handleUpdateUser",
					{
						data: { mainWallet: id.value },
						token: token.value,
					}
				);
				if (!updateUser.success) throw updateUser;
				ElMessage.success({
					message: `已成功將「${wallet.value.walletName}」設為主帳戶`,
					customClass: "maxWidth-90",
					center: true,
				});
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		const handleWalletDelete = async () => {
			if (user.value.mainWallet === id.value) {
				ElMessage.error({
					message: "主帳戶不可刪除。請先變更主帳戶",
					customClass: "maxWidth-90",
					center: true,
				});
				return false;
			}
			try {
				await ElMessageBox.confirm(
					"此操作將永久刪除該帳戶與其記錄，是否繼續？",
					"提示",
					{
						confirmButtonText: "確定",
						cancelButtonText: "取消",
						type: "warning",
						customClass: "maxWidth-90",
					}
				);
				const deleteWallet = await store.dispatch(
					"Wallet/handleDeleteWallet",
					{
						token: token.value,
						_id: id.value,
					}
				);
				if (!deleteWallet.success) throw deleteWallet;
				ElMessage.success({
					message: "刪除成功",
					customClass: "maxWidth-90",
					center: true,
				});
				router.push("/wallet");
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		// dropdown menu functions of transaction
		const handleTransEdit = (index, row) => {
			const data = wallet.value.transaction.find((item) => {
				return item._id === row._id;
			});
			router.push({
				path: "/edit/transc",
				query: { id: wallet.value._id, ...data },
			});
		};

		const handleTransDelete = async (index, row) => {
			try {
				await ElMessageBox.confirm(
					"此操作將永久刪除該記錄，是否繼續？",
					"提示",
					{
						confirmButtonText: "確定",
						cancelButtonText: "取消",
						type: "warning",
						customClass: "maxWidth-90",
					}
				);
				const transcRecord = computed(() => {
					let idx;
					let transc = wallet.value.transaction;
					transc.forEach((item, index) => {
						if (item._id === row._id) {
							idx = index;
						}
					});
					transc.splice(idx, 1);
					return transc;
				});
				const deleteTransc = await store.dispatch(
					"Wallet/handleUpdateWallet",
					{
						data: {
							transaction: transcRecord.value,
						},
						token: token.value,
						_id: id.value,
					}
				);
				if (!deleteTransc.success) throw deleteTransc;
				ElMessage.success({
					message: "記錄刪除成功",
					customClass: "maxWidth-90",
					center: true,
				});
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		// when router-view changes
		onBeforeRouteUpdate((to, from) => {
			store.dispatch("Wallet/handleGetWallet", {
				token: token.value,
				_id: to.params.id,
			});
		});

		return {
			id,
			wallet,
			totalAmounts,
			stat,
			userSelectTime,
			month,
			year,
			NtM,
			transOfCertainDay,
			setStyle,
			handleAddTransaction,
			handleWalletNameEdit,
			handleTotalEdit,
			handleSetMainWallet,
			handleWalletDelete,
			handleTransEdit,
			handleTransDelete,
			dialogueVisible,
			walletNameVisible,
			amountVisible,
			walletName,
			amount,
			setRef,
			closeDialogue,
		};
	},
};
</script>

<template>
	<el-row>
		<el-col :span="22" :sm="{ span: 16, offset: 4 }" :offset="1">
			<el-card class="sub-wallet-card title" :key="wallet">
				<template #header>
					<div class="card-header">
						<span>{{ wallet.walletName }}</span>
						<span>$ {{ NtM(totalAmounts) }}</span>
						<el-dropdown
							trigger="click"
							style="position: absolute; right: 0; top: 0"
							placement="bottom-start"
							size="medium"
						>
							<el-button
								type="info"
								plain
								circle
								icon="el-icon-more"
							/>
							<template #dropdown>
								<el-dropdown-menu>
									<el-dropdown-item
										icon="el-icon-edit"
										@click="handleAddTransaction"
									>
										新增記錄
									</el-dropdown-item>
									<el-dropdown-item
										icon="el-icon-edit-outline"
										@click="handleWalletNameEdit"
									>
										修改名稱
									</el-dropdown-item>
									<el-dropdown-item
										icon="el-icon-set-up"
										@click="handleTotalEdit"
									>
										調整餘額
									</el-dropdown-item>
									<el-dropdown-item
										icon="el-icon-star-off"
										@click="handleSetMainWallet"
									>
										設為主帳戶
									</el-dropdown-item>
									<el-dropdown-item
										icon="el-icon-delete"
										@click="handleWalletDelete"
									>
										刪除帳戶
									</el-dropdown-item>
								</el-dropdown-menu>
							</template>
						</el-dropdown>
					</div>
				</template>
				<div class="time-col">
					<el-date-picker
						v-model="userSelectTime"
						type="month"
						placeholder="請選擇時間區間"
						:clearable="false"
					>
					</el-date-picker>
				</div>
				<div class="text item">
					收入
					<span class="green">$ {{ NtM(stat.income) }}</span>
				</div>
				<div class="text item">
					支出
					<span class="red">$ {{ NtM(stat.expense) }}</span>
				</div>
			</el-card>
		</el-col>
	</el-row>
	<el-row v-if="!stat.income && !stat.expense">
		<el-col style="padding: 40px 30px;">
			<span>本月尚無交易紀錄</span>
		</el-col>
	</el-row>
	<el-row v-for="n in 31" :key="n" class="data-table">
		<el-col
			:span="22"
			:sm="{ span: 16, offset: 4 }"
			:offset="1"
			v-if="transOfCertainDay(32 - n).subTrans.length"
		>
			<el-table
				:data="transOfCertainDay(32 - n).subTrans"
				:show-header="true"
				:cell-style="setStyle"
				header-row-class-name="fz-16-black"
			>
				<el-table-column
					:label="32 - n + ''"
					min-width="42"
					align="center"
				>
					<template #default="scope">
						<el-dropdown trigger="click" placement="bottom-end">
							<el-button type="text" icon="el-icon-setting" />
							<template #dropdown>
								<el-dropdown-menu>
									<el-dropdown-item
										icon="el-icon-edit"
										@click="
											handleTransEdit(
												scope.$index,
												scope.row
											)
										"
									>
										編輯
									</el-dropdown-item>
									<el-dropdown-item
										icon="el-icon-delete"
										@click="
											handleTransDelete(
												scope.$index,
												scope.row
											)
										"
									>
										刪除
									</el-dropdown-item>
								</el-dropdown-menu>
							</template>
						</el-dropdown>
					</template>
				</el-table-column>
				<el-table-column
					prop="consumeType"
					label=""
					align="center"
					min-width="70"
				>
				</el-table-column>
				<el-table-column
					prop="note"
					label=""
					align="center"
					min-width="70"
				></el-table-column>
				<el-table-column
					prop="amount"
					:label="transOfCertainDay(32 - n).dayTotal + ''"
					align="right"
					class-name="pr-45"
				></el-table-column>
			</el-table>
		</el-col>
	</el-row>
	<el-dialog
		:title="walletNameVisible ? '新帳戶名稱' : '調整餘額'"
		v-model="dialogueVisible"
		width="30%"
		destroy-on-close
		center
		@closed="closeDialogue(false)"
	>
		<span v-if="walletNameVisible">新帳戶名稱</span>
		<span v-if="amountVisible">餘額</span>
		<el-input
			v-model="walletName"
			:ref="setRef"
			v-if="walletNameVisible"
		></el-input>
		<el-input
			v-model.number.native="amount"
			:ref="setRef"
			v-if="amountVisible"
		></el-input>
		<template #footer>
			<span class="dialog-footer">
				<el-button @click="closeDialogue(false)">取消</el-button>
				<el-button type="primary" @click="closeDialogue(true)">
					確定
				</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<style lang="sass">
.sub-wallet-card
	margin-bottom: 1rem
	padding: 10px 25px
	position: relative
	border-radius: 10px
	.card-header
		font-weight: 700
		position: relative
		span
			display: block
			margin-bottom: 10px
			letter-spacing: 1.44px
	.text
		text-align: left
		margin-bottom: 15px
		span
			float: right
			letter-spacing: 1.32px
	.time-col
		text-align: center
		padding: 1rem 0px
		margin-bottom: 25px
		.el-date-editor.el-input
			width: 50%
			min-width: 150px
			.el-input__inner
				text-align: center
	&.title
		margin-bottom: 50px
.data-table
	.el-col
		margin-bottom: 40px
		.el-table--scrollable-x
			.el-table__body-wrapper
				overflow-x: hidden
.el-button
	font-size: 16px
	border: none
.green
	color: #42b983
	display: inline-block
.red
	color: #e71d36
	display: inline-block
.fz-16-black
	color: #000
	font-size: 16px
td.pr-45, th.pr-45
	padding-right: 40px
@media screen and (max-width: 500px)
	.sub-wallet-card
		.el-card__header
			padding: 18px 0px
	.fz-16-black
		font-size: 15px
	td.pr-45, th.pr-45
		padding-right: 10px
</style>
