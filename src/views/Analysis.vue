<script>
import { ref, reactive, watch, computed, onBeforeMount } from "vue";
import { PieChart, BarChart, LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { useStore } from "vuex";
import { use } from "echarts/core";
import {
	TitleComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
	VisualMapComponent,
} from "echarts/components";
import VChart from "vue-echarts";

use([
	CanvasRenderer,
	PieChart,
	BarChart,
	LineChart,
	TitleComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
	VisualMapComponent,
]);

export default {
	components: {
		VChart,
	},
	setup() {
		const store = useStore();

		const token = computed(() => {
			return store.getters["User/getToken"];
		});
		const user = computed(() => {
			return store.getters["User/getUserData"];
		});
		const allTypes = reactive({
			expense: user.value.expenseType,
			income: user.value.incomeType,
		});
		const wallets = computed(() => {
			return store.getters["Wallet/getWallets"];
		});

		// get transaction data of certain days before
		const getDateBefore = (day, DateObj = null) => {
			const dateBefore = DateObj || new Date();
			if (!DateObj) {
				dateBefore.setTime(
					new Date().getTime() - 3600 * 1000 * 24 * day
				);
			}
			const year = dateBefore.getFullYear();
			let month = dateBefore.getMonth() + 1;
			month = month < 10 ? "0" + month : month;
			let date = dateBefore.getDate();
			date = date < 10 ? "0" + date : date;
			return `${year}-${month}-${date}`;
		};
		// user's selections
		const userSelect = reactive({
			wallet: "all",
			timeFrom: getDateBefore(90),
			timeTo: getDateBefore(0),
			selected_expenseType: allTypes.expense,
			selected_incomeType: allTypes.income,
			customTime: [getDateBefore(90), getDateBefore(0)],
		});

		// get selected wallets data
		const allWallets = computed(() => {
			let ids = [];
			if (wallets.value) {
				wallets.value.forEach((item) => {
					ids.push(item._id);
				});
			}
			return ids;
		});
		const selectedWallets = computed(() => {
			let ws = [];
			if (userSelect.wallet && wallets.value) {
				if (userSelect.wallet === "all") {
					allWallets.value.forEach((item) => {
						const foundWallet = wallets.value.find((wallet) => {
							return wallet._id === item;
						});
						ws.push(foundWallet);
					});
				} else {
					const foundWallet = wallets.value.find((wallet) => {
						return wallet._id === userSelect.wallet;
					});
					ws.push(foundWallet);
				}
			}
			return ws;
		});

		// set chart data
		const chartData = reactive({
			x: [],
			expense: [],
			income: [],
			remain: [],
			expenseData: [],
			incomeData: [],
		});
		// get chart data
		const getChartData = () => {
			const start =
				userSelect.timeFrom === "custom"
					? userSelect.customTime[0]
					: userSelect.timeFrom;
			const end =
				userSelect.timeFrom === "custom"
					? userSelect.customTime[1]
					: userSelect.timeTo;
			const Mstart = start.split("-")[1] - 0;
			const Mend = end.split("-")[1] - 0;
			const date_range = [];

			chartData.x = [];

			for (let i = Mstart; i < Mend + 1; i++) {
				const dateStr = new Date(`${start.split("-")[0]}-${i + 1}`);
				const dateStr2 = new Date(new Date(end).getTime() + 86400000);
				const rangeEnd =
					i === Mend
						? getDateBefore(0, dateStr2)
						: getDateBefore(0, dateStr);
				chartData.x.push(`${i}月`);
				date_range.push(rangeEnd);
			}
			const len = chartData.x.length;
			chartData.expense = new Array(len).fill(0);
			chartData.income = new Array(len).fill(0);
			chartData.remain = new Array(len).fill(0);
			chartData.expenseData = [];
			chartData.incomeData = [];
			let pe = {};
			let pi = {};

			selectedWallets.value.forEach((wallet) => {
				wallet.transaction.forEach((trans) => {
					const transDate = new Date(trans.date).getTime();
					const start_date = new Date(start).getTime() - 3600000 * 8;
					const consumeType = trans.consumeType;

					if (
						transDate >= start_date &&
						(userSelect.selected_expenseType.indexOf(
							consumeType
						) !== -1 ||
							userSelect.selected_incomeType.indexOf(
								consumeType
							) !== -1)
					) {
						let i = 0;
						let end_date =
							new Date(date_range[i]).getTime() - 3600000 * 8;

						while (i <= len && transDate >= end_date) {
							i++;
							end_date =
								new Date(date_range[i]).getTime() - 3600000 * 8;
						}

						if (trans.transType === "income") {
							chartData.income[i] += trans.amount;
							chartData.remain[i] += trans.amount;
							pi[consumeType] =
								pi[consumeType] === undefined
									? 0 + trans.amount
									: pi[consumeType] + trans.amount;
						} else {
							chartData.expense[i] += trans.amount;
							chartData.remain[i] -= trans.amount;
							pe[consumeType] =
								pe[consumeType] === undefined
									? 0 + trans.amount
									: pe[consumeType] + trans.amount;
						}
					}
				});
			});

			Object.keys(pe).forEach((key) => {
				chartData.expenseData.push({ value: pe[key], name: key });
			});
			Object.keys(pi).forEach((key) => {
				chartData.incomeData.push({ value: pi[key], name: key });
			});

			chartData.min =
				Math.min(...chartData.expense) > Math.min(...chartData.income)
					? Math.min(...chartData.income)
					: Math.min(...chartData.expense);
			chartData.max =
				Math.max(...chartData.expense) > Math.max(...chartData.income)
					? Math.max(...chartData.expense)
					: Math.max(...chartData.income);
			chartData.min = parseInt((chartData.min * 0.9) / 10) * 10;
			chartData.max = parseInt((chartData.max * 1.1) / 10) * 10;
			chartData.interval =
				parseInt((chartData.max - chartData.min) / 60) * 10;
			chartData.max = chartData.min + 6 * chartData.interval;
		};

		const bar = ref(null);
		const pie = ref(null);
		const isPie = ref(false);
		const BarChartOption = computed(() => {
			return {
				tooltip: {
					trigger: "axis",
					axisPointer: {
						type: "cross",
						crossStyle: {
							color: "#999",
						},
					},
				},
				legend: {
					data: ["支出", "收入", "餘額"],
				},
				xAxis: [
					{
						type: "category",
						data: chartData.x,
						axisPointer: {
							type: "shadow",
						},
					},
				],
				yAxis: [
					{
						type: "value",
						min: chartData.min,
						max: chartData.max,
						interval: chartData.interval,
						axisLabel: {
							formatter: "{value}",
						},
					},
					{
						show: false,
						type: "value",
						name: "月淨收入",
					},
				],
				series: [
					{
						name: "支出",
						type: "bar",
						color: "#ef6b7b",
						data: chartData.expense,
					},
					{
						name: "收入",
						type: "bar",
						color: "#87d4b1",
						data: chartData.income,
					},
					{
						name: "餘額",
						type: "line",
						yAxisIndex: 1,
						data: chartData.remain,
					},
				],
				media: [
					{
						option: {
							xAxis: [
								{
									axisLabel: {
										fontSize: 12,
									},
								},
							],
							yAxis: [
								{
									axisLabel: {
										margin: 8,
										fontSize: 12,
									},
									offset: 10,
								},
							],
						},
					},
					{
						query: {
							maxWidth: 540,
						},
						option: {
							xAxis: [
								{
									axisLabel: {
										fontSize: 8,
									},
								},
							],
							yAxis: [
								{
									axisLabel: {
										margin: 4,
										fontSize: 8,
									},
									offset: 0,
								},
							],
						},
					},
				],
			};
		});
		const PieChartOption = computed(() => {
			return {
				tooltip: {
					trigger: "item",
					formatter: "{a} <br/>{b} : {c} ( {d}% )",
				},
				legend: {
					orient: "horizontal",
				},
				visualMap: [
					{
						show: false,
						min: 500,
						max: 2000,
						inRange: {
							colorLightness: [0.2, 0.65],
						},
					},
				],
				series: [
					{
						name: "支出占比",
						type: "pie",
						radius: "50%",
						center: ["25%", "50%"],
						data: chartData.expenseData.sort(
							(a, b) => b.value - a.value
						),
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
						itemStyle: {
							color: "#ef6b7b",
							shadowColor: "rgba(0, 0, 0, 0.5)",
						},
					},
					{
						name: "收入占比",
						type: "pie",
						radius: "50%",
						center: ["75%", "50%"],
						data: chartData.incomeData.sort(
							(a, b) => b.value - a.value
						),
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
						itemStyle: {
							color: "#87d4b1",
							shadowColor: "rgba(0, 0, 0, 0.5)",
						},
					},
				],
				media: [
					{
						option: {
							series: [
								{
									radius: [0, "40%"],
									center: ["25%", "50%"],
								},
								{
									radius: [0, "40%"],
									center: ["75%", "50%"],
								},
							],
						},
					},
					{
						query: {
							maxWidth: 546,
						},
						option: {
							series: [
								{
									radius: [20, "30%"],
									center: ["50%", "30%"],
								},
								{
									radius: [20, "30%"],
									center: ["50%", "75%"],
								},
							],
						},
					},
				],
			};
		});

		onBeforeMount(async () => {
			await store.dispatch("Wallet/handleGetWallets", token.value);
			getChartData();
		});

		watch(
			() => ({ ...userSelect }),
			(nv, ov) => {
				getChartData();
			},
			{ deep: true }
		);

		return {
			wallets,
			userSelect,
			selectedWallets,
			allTypes,
			BarChartOption,
			PieChartOption,
			getDateBefore,
			isPie,
		};
	},
};
</script>

<template>
	<el-row class="analysis-row">
		<el-col :span="24" :sm="{ span: 4, offset: 3 }">
			<el-select
				v-model="userSelect.wallet"
				placeholder="請選擇帳戶"
				size="small"
			>
				<el-option label="全部帳戶" value="all" />
				<el-option
					v-for="wallet in wallets"
					:label="wallet.walletName"
					:value="wallet._id"
				/>
			</el-select>
		</el-col>
		<el-col :span="24" :sm="{ span: 4, offset: 2 }">
			<el-select v-model="userSelect.timeFrom" size="small">
				<el-option label="最近3個月" :value="getDateBefore(90)" />
				<el-option label="最近6個月" :value="getDateBefore(180)" />
				<el-option
					label="今年"
					:value="`${new Date().getFullYear()}-01-01`"
				/>
				<el-option label="自訂" value="custom" />
			</el-select>
		</el-col>
		<el-col :span="22" :offset="1" :sm="{ span: 6, offset: 2 }">
			<div>
				<el-date-picker
					v-model="userSelect.customTime"
					type="daterange"
					range-separator="至"
					start-placeholder="開始日期"
					end-placeholder="結束日期"
					unlink-panels
					:clearable="false"
					size="small"
					value-format="YYYY-MM-DD"
					:disabled="userSelect.timeFrom !== 'custom'"
				/>
			</div>
		</el-col>
	</el-row>
	<el-row class="analysis-row select-row">
		<el-col :span="24" :sm="{ span: 5, offset: 3 }">
			<el-select
				v-model="userSelect.selected_expenseType"
				multiple
				collapse-tags
				size="small"
			>
				<el-option
					v-for="item in allTypes.expense"
					:key="item"
					:label="item"
					:value="item"
				>
				</el-option>
			</el-select>
		</el-col>
		<el-col :span="24" :sm="{ span: 5, offset: 1 }">
			<el-select
				v-model="userSelect.selected_incomeType"
				multiple
				collapse-tags
				size="small"
			>
				<el-option
					v-for="item in allTypes.income"
					:key="item"
					:label="item"
					:value="item"
				>
				</el-option>
			</el-select>
		</el-col>
		<el-col :span="24" :sm="{ span: 6, offset: 1 }" class="chart-col">
			<el-switch
				v-model="isPie"
				active-text="圓餅圖"
				inactive-text="柱狀折線圖"
			>
			</el-switch>
		</el-col>
	</el-row>
	<el-row class="analysis-row">
		<el-col :span="24" :sm="{ span: 18, offset: 3 }">
			<v-chart
				class="chart"
				:option="BarChartOption"
				v-if="!isPie"
				:autoresize="true"
			/>
			<v-chart
				class="chart"
				:option="PieChartOption"
				v-if="isPie"
				:autoresize="true"
			/>
		</el-col>
	</el-row>
</template>

<style lang="sass">
.analysis-row
	margin-top: 3rem
	.el-col
		text-align: center
		.el-date-editor, .el-select
			max-width: 250px
		.text
			padding-left: 15px
			font-size: 14px
		.chart
			margin-top: 2rem
			width: 100%
			height: 500px
	&.select-row
		.el-col
			text-align: left
		.chart-col
			text-align: center
			.el-switch
				height: 32px
@media screen and (max-width: 767.9px)
	.analysis-row
		.el-col
			.el-date-editor, .el-select
				width: 250px
				margin-bottom: 1.5rem
				.el-input__inner, input
					text-align: center
				.el-select__tags
					justify-content: center
			.chart
				margin-top: -1.5rem
				margin-bottom: -50px
		&.select-row
			margin-top: 0rem
			.el-col
				text-align: center
</style>
