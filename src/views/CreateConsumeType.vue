<script>
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { ElMessage, ElNotification } from "element-plus";
export default {
	setup() {
		const store = useStore();
		const router = useRouter();

		// set form data(note that directly use data from vuex to render
		// would cause maxium recursive update exceeds)
		const user = computed(() => {
			return store.getters["User/getUserData"];
		});
		const formData = reactive({
			expenseType: user.value.expenseType,
			incomeType: user.value.incomeType,
		});
		const text = { expenseType: "支出類別", incomeType: "收入類別" };
		const isEditable = reactive({
			expense: false,
			income: false,
		});

		// define template refs
		const formRef = ref([]);
		const setFormRef = (el) => {
			if (el) formRef.value.push(el);
		};

		// click function
		const removeItem = (item, key) => {
			const index = formData[key].indexOf(item);
			if (index !== -1) {
				formData[key].splice(index, 1);
			}
		};
		const addItem = (key) => {
			formData[key].push("新類別");
		};

		// form validation function
		const valid = ref(true);
		const validateTypeName = (rule, value, callback) => {
			if (value === "") {
				callback(new Error("請輸入分類名稱"));
			} else if (value.length < 2 || value.length > 10) {
				callback(new Error("名稱需介於2至10字元之間"));
			} else {
				callback();
			}
		};
		const rules = [
			{
				validator: validateTypeName,
				trigger: "blur",
			},
		];

		const handleEdit = (key) => {
			isEditable[key] = true;
		};
		// save function
		const handleCreateConsumeType = async (ref, key) => {
			// data verify
			ref.validate((pass) => {
				valid.value = pass;
			});
			if (!valid.value) {
				return false;
			}
			isEditable[key] = false;

			const token = computed(() => {
				return store.getters["User/getToken"];
			});
			try {
				const createConsumeType = await store.dispatch(
					"User/handleUpdateUser",
					{
						data: formData,
						token: token.value,
					}
				);

				if (!createConsumeType.success) throw createConsumeType;

				ElMessage.success({
					message: "儲存成功！",
					type: "success",
					center: true,
					duration: 2000,
					customClass: "maxWidth-90",
				});
			} catch (error) {
				console.log(error.msg || error);
			}
		};

		return {
			formData,
			text,
			isEditable,
			formRef,
			setFormRef,
			removeItem,
			addItem,
			rules,
			handleEdit,
			handleCreateConsumeType,
		};
	},
};
</script>

<template>
	<el-row class="type-row">
		<el-col
			:span="24"
			:sm="{ span: 12 }"
			v-for="(type, key, index) in formData"
			class="form-col"
		>
			<span>{{ text[key] }}</span>
			<el-button
				icon="el-icon-edit"
				class="edit-button"
				circle
				size="mini"
				v-if="!isEditable[key]"
				@click="handleEdit(key)"
			></el-button>
			<el-button
				plain
				circle
				icon="el-icon-check"
				class="edit-button"
				type="success"
				size="mini"
				v-if="isEditable[key]"
				@click="handleCreateConsumeType(formRef[index], key)"
			>
			</el-button>
			<el-divider></el-divider>
			<el-form :model="formData[key]" :ref="setFormRef" inline-message>
				<el-form-item
					v-for="(item, idx) in formData[key]"
					:key="idx"
					:prop="`[${idx}]`"
					:rules="rules"
				>
					<el-input
						v-model="formData[key][idx]"
						:disabled="!isEditable[key]"
					/>
					<el-button
						plain
						type="danger"
						@click="removeItem(item, key)"
						class="delete-button"
						:disabled="!isEditable[key]"
					>
						刪除
					</el-button>
				</el-form-item>
				<el-button
					class="add-button"
					plain
					type="primary"
					@click="addItem(key)"
					:disabled="!isEditable[key]"
				>
					新增類別
				</el-button>
			</el-form>
		</el-col>
	</el-row>
</template>

<style lang="sass">
.type-row
	margin: 3rem 0
	margin-bottom: 2rem
	padding: 0 5rem
	.el-col
		padding: 1rem
		&.form-col
			margin-bottom: 5rem
		span
			font-size: 14px
			font-weight: 700
			text-align: center
			vertical-align: middle
		.edit-button
			float: right
			margin-right: 10px
			vertical-align: middle
		form
			margin-top: 20px
			.el-input
				width: 50%
				margin-right: 30px
			.add-button
				margin-top: 1rem
@media screen and (max-width: 768px)
	.type-row
		margin: 2rem 0
		padding: 0 0.5rem
		.el-col
			padding: 0rem
			form
				.el-input
					width: 60%
					text-align: center
@media screen and (max-width: 500px)
	.type-row
		.el-col
			form
				.el-input
					.el-input__inner
						text-align: center
</style>
