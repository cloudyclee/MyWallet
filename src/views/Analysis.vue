<script>
import { ref, reactive, watch, computed, onBeforeMount } from "vue";
import { PieChart, BarChart, LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { useStore } from "vuex";
import { use } from "echarts/core"
import {
	TitleComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
	VisualMapComponent
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
	VisualMapComponent
]);

export default {
	components: {
		VChart,
	},
	async setup() {
		const store = useStore();

		const token = computed(() => {
			return store.getters["User/getToken"];
		});
		await store.dispatch("Wallet/handleGetWallets", token.value);

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
				dateBefore.setTime(new Date().getTime() - 3600 * 1000 * 24 * day);
			}
			const year = dateBefore.getFullYear();
			let month = dateBefore.getMonth() + 1;
			month = month < 10 ? "0" + month : month;
			let date = dateBefore.getDate();
			date = date < 10 ? "0" + date : date;
			return `${year}-${month}-${date}`;
		}
		// user's selections
		const userSelect = reactive({
			wallet: "all",
			timeFrom: getDateBefore(90),
			timeTo: getDateBefore(0),
			selected_expenseType: allTypes.expense,
			selected_incomeType: allTypes.income,
			customTime: [getDateBefore(90), getDateBefore(0)]
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

		// set change event for check box
		const isIndeterminate = reactive({
			expense: false,
			income: false,
		});
		const selectedAll = reactive({
			expense: true,
			income: true,
		});
		const handleCheckAllChange = (opt, val) => {
			userSelect[`selected_${opt}Type`] = val ? allTypes[opt] : [];
			isIndeterminate.[opt] = false;
		};
		const handleCheckedTypesChange = (opt, value) => {
			const checkedCount = value.length;
			selectedAll[opt] = checkedCount === allTypes[opt].length;
			isIndeterminate[opt] =
				checkedCount > 0 && checkedCount < allTypes[opt].length;
		};

		// set chart data
		const chartData = reactive({
			x: [],
			expense: [],
			income: [],
			remain: [],
			expenseData: [],
			incomeData: []
		})
		// get chart data
		const getChartData = () => {
			const start = userSelect.timeFrom === "custom"
							? userSelect.customTime[0] : userSelect.timeFrom;
			const end = userSelect.timeFrom === "custom"
							? userSelect.customTime[1] : userSelect.timeTo;
			const Mstart = start.split("-")[1] - 0;
			const Mend = end.split("-")[1] - 0;
			const date_range = [start];

			chartData.x = [];
			chartData.expense = [];
			chartData.income = [];
			chartData.remain = [];
			chartData.expenseData = [];
			chartData.incomeData = [];

			for (let i = Mstart; i < Mend + 1; i++) {
				const dateStr = new Date(`${start.split("-")[0]}-${i + 1}`);
				const dateStr2 = new Date(new Date(end).getTime() + 86400000);
				const rangeEnd = i === Mend
									? getDateBefore(0, dateStr2) : getDateBefore(0, dateStr);
				chartData.x.push(`${i}月`);
				date_range.push(rangeEnd);
			}

			chartData.x.forEach((item, idx) => {
				let e = 0;
				let i = 0;
				let r = 0;
				let pe = {};
				let pi = {};
				selectedWallets.value.forEach(wallet => {
					wallet.transaction.forEach(trans => {
						const transDate = new Date(trans.date);
						const consumeType = trans.consumeType;

						if ( transDate >= new Date(date_range[idx]) &&
							transDate < new Date(date_range[idx + 1]) &&
							(userSelect.selected_expenseType.indexOf(consumeType) !== -1 ||
							userSelect.selected_incomeType.indexOf(consumeType) !== -1)
						) {
							if (trans.transType === "income") {
								i += trans.amount;
								r += trans.amount;
								pi[consumeType] = pi[consumeType] === undefined
													? 0 + trans.amount
													: pi[consumeType] + trans.amount;
							} else {
								e += trans.amount;
								r -= trans.amount;
								pe[consumeType] = pe[consumeType] === undefined
													? 0 + trans.amount
													: pe[consumeType] + trans.amount;
							}
						}
					});
				});
				chartData.expense.push(e);
				chartData.income.push(i);
				chartData.remain.push(r);
				console.log(pe);
				Object.keys(pe).forEach(key => {
					chartData.expenseData.push({value: pe[key], name: key});
				});
				Object.keys(pi).forEach(key => {
					chartData.incomeData.push({value: pi[key], name: key});
				});
			});
		};
		getChartData();
		console.log(chartData);

		const isPie = ref(false);
		const BarChartOption = computed(() => {
			return {
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'cross',
						crossStyle: {
							color: '#999'
						}
					}
				},
				legend: {
					data: ['支出', '收入', '餘額']
				},
				xAxis: [
					{
						type: 'category',
						data: chartData.x,
						axisPointer: {
							type: 'shadow'
						}
					}
				],
				yAxis: [
					{
						type: 'value',
						name: '金額',
						axisLabel: {
							formatter: '{value} 元'
						}
					},
					{
						type: 'value',
						name: '餘額',
						axisLabel: {
							formatter: '{value} 元'
						}
					}
				],
				series: [
					{
						name: '支出',
						type: 'bar',
						color: '#ef6b7b',
						data: chartData.expense
					},
					{
						name: '收入',
						type: 'bar',
						color: '#87d4b1',
						data: chartData.income
					},
					{
						name: '餘額',
						type: 'line',
						yAxisIndex: 1,
						data: chartData.remain
					}
				]
			}
		});
		const PieChartOption = computed(() => {
			return {
				tooltip: {
					trigger: 'item',
					formatter: '{a} <br/>{b} : {c} ( {d}% )'
				},
				legend: {
					orient: 'vertical',
					left: 'left',
				},
				visualMap: [
					{
						show: false,
						min: 500,
						max: 2000,
						inRange: {
							colorLightness: [0.2, 0.65]
						},
					},
				],
				series: [
					{
						name: '占比',
						type: 'pie',
						radius: '50%',
						center: ['25%', '50%'],
						data: chartData.expenseData.sort((a, b) => b.value - a.value),
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: 'rgba(0, 0, 0, 0.5)'
							}
						},
						itemStyle: {
							color: '#ef6b7b',
							shadowColor: 'rgba(0, 0, 0, 0.5)'
						},
					},
					{
						name: '占比',
						type: 'pie',
						radius: '50%',
						center: ['75%', '50%'],
						data: chartData.incomeData.sort((a, b) => b.value - a.value),
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: 'rgba(0, 0, 0, 0.5)'
							}
						},
						itemStyle: {
							color: '#87d4b1',
							shadowColor: 'rgba(0, 0, 0, 0.5)'
						},
					}
				]
			};
		})

		watch(() => ({...userSelect}), (nv, ov) => {
			getChartData();
		})

		return {
			wallets,
			userSelect,
			selectedWallets,
			allTypes,
			isIndeterminate,
			selectedAll,
			handleCheckAllChange,
			handleCheckedTypesChange,
			BarChartOption,
			PieChartOption,
			getDateBefore,
			isPie
		};
	},
};
</script>

<template>
	<el-row>
		<el-col :span="3">
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
		<el-col :span="8" :offset="1">
			<el-radio-group v-model="userSelect.timeFrom" size="small">
				<el-radio-button :label="getDateBefore(90)">
					最近3個月
				</el-radio-button>
				<el-radio-button :label="getDateBefore(180)">
					最近6個月
				</el-radio-button>
				<el-radio-button :label="`${new Date().getFullYear()}-01-01`">
					從年初至今
				</el-radio-button>
				<el-radio-button label="custom">自訂</el-radio-button>
			</el-radio-group>
		</el-col>
		<el-col :span="6" :offset="1">
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
	<el-row class="select-row">
		<el-col :span="4">
			<span class="text">分析項目篩選</span>
		</el-col>
		<el-col :span="2">
			<el-checkbox
				:indeterminate="isIndeterminate.expense"
				v-model="selectedAll.expense"
				@change="handleCheckAllChange('expense', selectedAll.expense)"
			>
				支出項目全選
			</el-checkbox>
		</el-col>
	</el-row>
	<el-row class="group-row">
		<el-col :span="20" :offset="4">
			<el-checkbox-group
				v-model="userSelect.selected_expenseType"
				@change="
					handleCheckedTypesChange(
						'expense',
						userSelect.selected_expenseType
					)
				"
			>
				<el-checkbox
					v-for="item in allTypes.expense"
					:label="item"
					:key="item"
				>
					{{ item }}
				</el-checkbox>
			</el-checkbox-group>
		</el-col>
	</el-row>
	<el-row>
		<el-col :span="2" :offset="4">
			<el-checkbox
				:indeterminate="isIndeterminate.income"
				v-model="selectedAll.income"
				@change="handleCheckAllChange('income', selectedAll.income)"
			>
				收入項目全選
			</el-checkbox>
		</el-col>
	</el-row>
	<el-row class="group-row">
		<el-col :span="20" :offset="4">
			<el-checkbox-group
				v-model="userSelect.selected_incomeType"
				@change="
					handleCheckedTypesChange(
						'income',
						userSelect.selected_incomeType
					)
				"
			>
				<el-checkbox
					v-for="item in allTypes.income"
					:label="item"
					:key="item"
				>
					{{ item }}
				</el-checkbox>
			</el-checkbox-group>
		</el-col>
	</el-row>
	<el-row style="margin-top: 40px;">
		<el-col :span="4">
			<span class="text">呈現方式</span>
		</el-col>
		<el-col :span="6" size="small">
			<el-switch
				v-model="isPie"
				active-text="圓餅圖"
				inactive-text="柱狀折線圖"
			>
			</el-switch>
		</el-col>
	</el-row>
	<el-row>
		<el-col>
			<v-chart class="chart" :option="BarChartOption" v-if="!isPie" />
		</el-col>
		<el-col>
			<v-chart class="chart" :option="PieChartOption" v-if="isPie" />
		</el-col>
	</el-row>
</template>

<style lang="sass" scoped>
.el-row
	margin-top: 1rem
	.el-col
		text-align: left
		.el-checkbox-group
			display: flex
			justify-content: flex-start
			flex-wrap: wrap
			width: 80%
			.el-checkbox
				width: 14.85%
		.text
			padding-left: 15px
			font-size: 14px
		.chart
			margin-top: 2rem
			width: 100%
			height: 400px
	&.select-row
		margin-top: 2rem
	&.group-row
		margin-top: 0
</style>
