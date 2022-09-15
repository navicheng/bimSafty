<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="项目名称" prop="projectName">
        <el-input
          v-model="queryParams.projectName"
          placeholder="请输入项目名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName">
        <el-input
          v-model="queryParams.modelName"
          placeholder="请输入模型名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:bimModel:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:bimModel:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:bimModel:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:bimModel:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="bimModelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" align="center" prop="id" />
      <el-table-column label="项目名称" align="center" prop="projectName" />
      <el-table-column label="模型名称" align="center" prop="modelName" />
      <el-table-column label="模型地址" align="center" prop="modelUrl" >
        <template slot-scope="scope">
          <div v-if="scope.row.modelUrl" class="model">
            <el-link type="primary" @click="openModel(scope.row.modelUrl? baseUrl+'/'+scope.row.modelUrl :'')">
              下载模型
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:bimModel:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:bimModel:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改bim模型对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型地址" >
          <file-upload v-model="form.modelUrl" />
        </el-form-item>
        <el-divider content-position="center">风险信息</el-divider>
        <el-table :data="bimRiskList" :row-class-name="rowBimRiskIndex" @selection-change="handleBimRiskSelectionChange" ref="bimRisk">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="风险名称" prop="riskName" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.riskName" placeholder="请输入风险名称" />
            </template>
          </el-table-column>
          <el-table-column label="风险等级" prop="riskLevel" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.riskLevel" placeholder="请输入风险等级" />
            </template>
          </el-table-column>
          <el-table-column label="风险截图" align="center" prop="picUrl" width="100">
            <template slot-scope="scope">
              <image-preview :src="scope.row.picUrl" :width="50" :height="50"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="note" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.note" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listBimModel, getBimModel, delBimModel, addBimModel, updateBimModel } from "@/api/system/bimModel";
export default {
  name: "BimModel",
  data() {
    return {
      // 遮罩层
      loading: true,
      //文件路径
      baseUrl: process.env.VUE_APP_BASE_API,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedBimRisk: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // bim模型表格数据
      bimModelList: [],
      // 风险表格数据
      bimRiskList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        projectName: null,
        modelName: null,
        modelUrl: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询bim模型列表 */
    getList() {
      this.loading = true;
      listBimModel(this.queryParams).then(response => {
        this.bimModelList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        projectName: null,
        modelName: null,
        modelUrl: null
      };
      this.bimRiskList = [];
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加bim模型";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getBimModel(id).then(response => {
        this.form = response.data;
        this.bimRiskList = response.data.bimRiskList;
        this.open = true;
        this.title = "修改bim模型";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.bimRiskList = this.bimRiskList;
          if (this.form.id != null) {
            updateBimModel(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addBimModel(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除bim模型编号为"' + ids + '"的数据项？').then(function() {
        return delBimModel(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 风险序号 */
    rowBimRiskIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 风险添加按钮操作 */
    handleAddBimRisk() {
      let obj = {};
      obj.riskName = "";
      obj.riskLevel = "";
      obj.note = "";
      obj.picUrl = "";
      this.bimRiskList.push(obj);
    },
    /** 风险删除按钮操作 */
    handleDeleteBimRisk() {
      if (this.checkedBimRisk.length == 0) {
        this.$modal.msgError("请先选择要删除的风险数据");
      } else {
        const bimRiskList = this.bimRiskList;
        const checkedBimRisk = this.checkedBimRisk;
        this.bimRiskList = bimRiskList.filter(function(item) {
          return checkedBimRisk.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleBimRiskSelectionChange(selection) {
      this.checkedBimRisk = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/bimModel/export', {
        ...this.queryParams
      }, `bimModel_${new Date().getTime()}.xlsx`)
    },
    /** 查看模型 */
    openModel(url){
      window.open(url)// todo
      // this.$router.push(url)
    }
  }
};

</script>
