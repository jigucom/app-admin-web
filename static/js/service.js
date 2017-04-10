Vue.http.options.emulateJSON = true;
var Vue_App = new Vue({
  el: '#app',
  data: {
    items: {},
    editItem: {}, //要编辑的items中的数据
    layer: null, //弹出框,
    addItem: {}, //增加图
    TotalCount: 0, //总数
    currCount: 15, //当前数据量
    displayCount: 15, //当前页要显示的数据量
    currPage: 1, //当前页码
    addValid: true,
    editValid: true,
    overSize: false, //图片超过限制大小
    isHide: false, //隐藏“加载”图标
    firstLoad: false,
    showEditModule: false,
    showAddModule: false,
    appModule: "",
    moduleItem: [],
    addModule: "",
    token: "Bearer " + window.localStorage.token,
    usrId: window.localStorage.usrId, //用户Id   
    ip: "", //用于服务器
    // ip: "http://192.168.31.82", //用于测试
  },
  created: function() {
    if (!this.usrId) {
      parent.location.href = "login.html";
    } else {
      this.getList(1, 15);
      this.getModule();
    }
  },
  methods: {
    getList(index, size, module) {
      var _this = this;
      var data = { "Index": index, "Size": size };
      if (module !== "") {
        data.AppModule = module;
      }
      data = JSON.stringify(data);
      this.$http.post(this.ip + "/api/Member/ListService", data, {
        headers: {
          "Authorization": this.token
        }
      }).then(function(res) {
        if (res.body.Code == 200) {
          _this.items = res.body.Data.Content;
          _this.displayCount = _this.items.length;
          _this.TotalCount = res.body.Data.TotalCount;
        } else if (res.body.Code == 204) {
          _this.items = [];
          _this.displayCount = 0;
          _this.TotalCount = 0;
          document.getElementById("page").innerHTML = "";
        } else {
          layer.msg(res.body.Message, { icon: 2, time: 2500 });
        }
        _this.isHide = true;
      }).catch(function(error) {
        _this.isHide = true;
        console.log(error);
        layer.msg("服务器错误，请稍后再试", { icon: 0, time: 2500 });
      });
      document.getElementById("isget").style.visibility = "visible";
    },
    //设置分页
    setPage() {
      var _this = this;
      var total = parseInt(this.TotalCount);
      var currcount = parseInt(this.currCount);
      if (total > currcount) {
        layui.use(['laypage'], function() {
          layui.laypage({
            cont: 'page', //分页容器的id
            pages: Math.ceil(total / currcount), //总页数
            skin: '#148cf1', //自定义选中色值
            skip: true, //开启跳页
            jump: function(obj) {
              if (!_this.firstLoad) {
                _this.isHide = false;
                //记录当前页码
                _this.currPage = obj.curr;
                //获取当前页或指定页的数据
                // console.log(obj.curr);
                _this.getList(obj.curr, _this.currCount, _this.appModule);
              }
              _this.firstLoad = false;
            },
          })
        });
      } else {
        document.getElementById("page").innerHTML = "";
      }
    },
    //获取当前页面要显示的数据量
    getData(event) {
      this.currCount = event.target.value;
      this.firstLoad = true;
      this.getList(1, this.currCount);
    },
    //获取分组http://192.168.31.82/api/Member/AppModuleEnum
    getModule() {
      this.$http.get(this.ip + "/api/Member/AppModuleEnum", {
        headers: {
          "Authorization": this.token
        }
      }).then(function(res) {
        if (res.body.Code === 200) {
          this.moduleItem = res.body.Data;
        } else {
          this.moduleItem = [];
        }
      });
    },
    //点击选择分组
    selectEditModule(item) {
      this.editItem.AppModule = item;
      this.showEditModule = false;
    },
    selectAddModule(item) {
      this.addModule = item;
      this.showAddModule = false;
    },
    showEditModules() {
      this.showEditModule = !this.showEditModule;
    },
    showAddModules() {
      this.showAddModule = !this.showAddModule;
    },
    edit(index) {
      // 编辑内容
      this.editItem = this.items[index];
      this.layer = layer.open({
        type: 1,
        title: "编辑服务",
        content: $("#editnav"),
        area: "600px",
        skin: 'layui-layer-demo', //样式类名
        anim: 2,
        shadeClose: true, //开启遮罩关闭
      });
      this.getModule();
      document.getElementById("editfile").value = "";
    },
    layer_close() {
      layer.close(this.layer);
    },
    add() {
      var _this = this;
      this.layer = layer.open({
        type: 1,
        title: "增加服务",
        content: $("#addnav"),
        area: "600px",
        skin: 'layui-layer-demo', //样式类名
        anim: 2,
        shadeClose: false, //开启遮罩关闭
        end: function() {
          _this.clearData();
        }
      });
      this.getModule();
      document.getElementById("add_name").focus();
    },
    checkAddItem(id, n) {
      var el = document.getElementById(id);
      if (el.value.length < n) {
        el.classList.add("error");
        this.addValid = false;
      } else {
        el.classList.remove("error");
      }
    },
    checkEditItem(id, n) {
      var el = document.getElementById(id);
      if (el.value.length < n) {
        el.classList.add("error");
        this.editValid = false;
      } else {
        el.classList.remove("error");
      }
    },
    //判断图片大小
    pictrue_size(id) {
      var el = document.getElementById(id);
      var filesize = el.files[0].size;
      filesize = filesize / 1000000
      var sizes = this.getFloat(filesize, 1);
      var valid = true;
      // console.log(sizes)
      if (sizes > 1) {
        // layer.msg("图片大小不能超过1M!", { icon: 2, time: 2500 });
        this.overSize = true;
        valid = false;
      } else {
        this.overSize = false;
      }
      return valid;
    },
    //保留n位小数
    getFloat(number, n) {
      n = n ? parseInt(n) : 0;
      if (n <= 0) return Math.round(number);
      number = Math.round(number * Math.pow(10, n)) / Math.pow(10, n);
      return number;
    },
    checkedAddFile() {
      var file = document.getElementById("addfile");
      if (file.value === "") {
        layer.msg("请上传图片", { icon: 0, time: 2500 });
        this.addValid = false;
      } else {
        this.addValid = this.pictrue_size("addfile");
      }
    },
    checkEditFile() {
      var file = document.getElementById("editfile");
      if (file.value != "") {
        this.editValid = this.pictrue_size("editfile");
      }
    },
    layer_submit_add() {
      var _this = this;
      this.addValid = true;
      this.checkAddItem("add_name", 1);
      this.checkAddItem("add_url", 1);
      this.checkAddItem("add_sort", 1);
      this.checkedAddFile();
      if (this.addValid) {
        this.isHide = false; //加载中
        $("#addform").ajaxSubmit({
          url: this.ip + "/api/Member/AddService",
          type: "post",
          headers: {
            "Authorization": this.token
          },
          success: function(res) {
            if (res.Code === 200) {
              _this.firstLoad = true;
              _this.getList(1, _this.currCount);
              _this.layer_close();
              _this.clearData();
              layer.msg("添加成功", { icon: 1, time: 2500 });
            } else {
              _this.isHide = true;
              layer.msg(res.Message, { icon: 2, time: 2500 });
            }
          },
          error: function(err) {
            console.log(err)
            _this.isHide = true;
            layer.msg("服务器错误，请稍后再试", { icon: 2, time: 2500 });
          }
        });
      }
    },
    formatData(data) {
      return JSON.parse(JSON.stringify(data));
    },
    layer_submit_edit() {
      var _this = this;
      this.editValid = true;
      this.checkEditItem('edit_title', 1);
      this.checkEditItem('edit_url', 1);
      this.checkEditItem('edit_sort', 1);
      this.checkEditFile();
      if (this.editValid) {
        this.isHide = false; //加载中
        $("#editform").ajaxSubmit({
          url: this.ip + "/api/Member/UpdateService",
          type: "post",
          headers: {
            "Authorization": this.token
          },
          success: function(res) {
            if (res.Code === 200) {
              _this.setPage();
              _this.layer_close();
              layer.msg("修改成功", { icon: 1, time: 2500 });
            } else {
              layer.msg(res.Message, { icon: 2, time: 2500 });
            }
            _this.isHide = true;
          },
          error: function(err) {
            console.log(err)
            _this.isHide = true;
            layer.msg("服务器错误，请稍后再试", { icon: 2, time: 2500 });
          }
        });
      }
    },
    clearData() {
      document.getElementById("add_name").value = "";
      document.getElementById("add_url").value = "";
      document.getElementById("add_sort").value = "";
      document.getElementById("addfile").value = "";
      document.getElementById("add_name").classList.remove("error");
      document.getElementById("add_url").classList.remove("error");
      document.getElementById("add_sort").classList.remove("error");
      this.overSize = false;
    },
  },
  watch: {
    TotalCount: function(val) {
      this.setPage();
    },
    currCount: function(val) {
      this.setPage();
    },
  },
  filters: {
    // 给过长的字符串中间加上省略号
    subStr: function(val) {
      if (!val) {
        return "";
      } else {
        var leng = val.length;
        if (leng > 20) {
          val = val.slice(0, 10) + "..." + val.slice(leng - 8, leng);
        }
        return val;
      }
    },
    subRemark: function(val) {
      if (!val) {
        return "";
      } else {
        var leng = val.length;
        if (leng > 20) {
          val = val.slice(0, 10) + "..." + val.slice(leng - 8, leng);
        }
        return val;
      }
    },
  }
});
