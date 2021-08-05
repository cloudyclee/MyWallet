<script>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
export default {
	async setup() {
		const store = useStore();
		const router = useRouter();

		const token = computed(() => {
			return store.getters["User/getToken"];
		});
		const wallets = computed(() => {
			return store.getters["Wallet/getWallets"];
		});
		await store.dispatch("Wallet/handleGetWallets", token.value);

		// caculate statistics of user wallets
		const walletStat = computed(() => {
			let total = 0;
			let expense = 0;
			let income = 0;
			if (wallets.value) {
				wallets.value.forEach((wallet) => {
					total += wallet.totalAmounts;
					expense += wallet.expense;
					income += wallet.income;
				});
			}
			return { total, expense, income };
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

		return {
			wallets,
			walletStat,
			NtM,
		};
	},
};
</script>

<template>
	<el-row class="wallet-header" align="middle">
		<el-col :span="24">
			<el-card shadow="never" class="box-card">
				<div class="card-header">
					總資產
					<span class="text">$ {{ NtM(walletStat.total) }}</span>
				</div>
				<div class="card-text">
					本月總收入
					<span class="text">$ {{ NtM(walletStat.income) }}</span>
				</div>
				<div class="card-text">
					本月總支出
					<span class="text">$ {{ NtM(walletStat.expense) }}</span>
				</div>
			</el-card>
		</el-col>
	</el-row>
	<el-row>
		<el-col
			:span="12"
			:xs="24"
			v-for="wallet in wallets"
			class="display-col"
		>
			<el-card class="box-card">
				<div class="card-header">
					{{ wallet.walletName }}
					<span class="text">$ {{ NtM(wallet.totalAmounts) }}</span>
				</div>
				<el-divider></el-divider>
				<div class="card-text">
					過去1個月<span class="text"
						>$ {{ NtM(wallet.monthTotal) }}</span
					>
				</div>
				<div class="card-text">收入</div>
				<el-progress
					:text-inside="false"
					:stroke-width="14"
					:percentage="(wallet.income / wallet.total) * 100 || 0"
					status="success"
				>
					<span class="text">$ {{ NtM(wallet.income) }}</span>
				</el-progress>

				<div class="card-text">支出</div>
				<el-progress
					:text-inside="false"
					:stroke-width="14"
					:percentage="(wallet.expense / wallet.total) * 100 || 0"
					status="exception"
				>
					<span class="text">$ {{ NtM(wallet.expense) }}</span>
				</el-progress>
				<router-link
					class="el-link el-link--primary"
					:to="`/wallet/${wallet._id}`"
				>
					查看詳細 >>
				</router-link>
			</el-card>
		</el-col>
	</el-row>
</template>

<style lang="sass" scoped>
.wallet-header
	justify-content: space-between
	.box-card
		text-align: left
		border: none
		padding: 20px 30px
		letter-spacing: 1.2px
		.card-header
			font-size: 28px
			font-weight: 900
			margin-bottom: 1rem
		.card-text
			color: #a3a3a3
			margin-left: 0.25rem
			margin-bottom: 0.5rem
			letter-spacing: 1.46px
			.text
				margin-right: 5px
		.text
			float: right

.display-col
	padding: 35px
	padding-top: 0px
	margin-bottom: 2rem
	.box-card
		border-radius: 20px
		padding: 35px 35px
		text-align: left
		.card-header
			font-weight: bold
			.text
				float: right
				color: #a3a3a3
		.card-text
			margin-top: 1rem
			.text
				float: right
		.card-text:nth-child(3)
			color: #a3a3a3
			margin-bottom: 2rem
		.el-progress
			margin: 5px 0px
			.text
				font-size: 16px
				float: right
		.el-link
			margin-top: 3rem
			margin-right: -5px
			float: right

@media screen and (max-width: 500px)
	.wallet-header
		.box-card
			padding: 20px 0px
	.display-col
		padding: 35px 20px
		.box-card
			padding: 35px 10px
@media screen and (max-width: 400px)
	.wallet-header
		.box-card
			padding-bottom: 0px
			.card-header
				margin-bottom: 1.5rem
				text-align: center
			.text
				float: none
				display: block
				margin-top: 20px
			.card-text
				margin-top: 30px
				text-align: center
	.display-col
		padding: 10px 0px
		.box-card
			padding: 10px 0px
			padding-bottom: 20px
</style>
