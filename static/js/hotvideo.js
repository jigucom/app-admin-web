Vue.http.options.emulateJSON = true;
var Vue_App = new Vue({
  el: '#app',
  data: {
    items: {},
    editItem: {}, //要编辑的items中的数据
    layer: null, //弹出框,
    addItem: {}, //增加图
    currCount: 15, //当前数据量
    displayCount: 15, //当前页要显示的数据量
    TotalCount: 0,
    currPage: 1, //当前页码
    addValid: true,
    editValid: true,
    overSize: false, //图片超过限制大小
    isHide: false, //“加载中”
    count: 200, //还能输入的内容字数
    token: "Bearer " + window.localStorage.token,
    usrId: window.localStorage.usrId, //用户Id   
    firstLoad: true,
    ip: "", //用于服务器
    // ip: "http://192.168.31.82", //用于测试
  },
  created: function() {
    if (this.usrId === "" || typeof this.usrId === "undefined") {
      parent.location.href = "login.html";
    } else {
      this.getList(1, 15);
    }
  },
  methods: {
    getList(index, size) {
      var _this = this;
      var data = { "Index": index, "Size": size };
      this.$http.post(this.ip + "/api/HotVideo/List", data, {
        headers: {
          "Authorization": this.token
        }
      }).then(function(response) {
        if (response.body.Code == 200) {
          _this.items = response.body.Data.Content;
          _this.displayCount = _this.items.length;
          _this.TotalCount = response.body.Data.TotalCount;
        } else {
          if (response.body.Code == 204) {
            _this.items = [];
            _this.displayCount = 0;
            _this.TotalCount = 0;
            document.getElementById("page").innerHTML = "";
          } else {
            layer.msg(res.body.Message, { icon: 2, time: 2500 });
          }
        }
        _this.isHide = true;
      }).catch(function(error) {
        _this.isHide = true;
        console.log(error);
        layer.msg("服务器错误，请稍后再试", { icon: 2, time: 2500 });
      })
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
                _this.getList(obj.curr, _this.currCount);
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
      this.currPage = 1; //防止获取不到数据
      this.firstLoad = true;
      this.getList(1, this.currCount);
    },
    edit(index, id) {
      // console.log(index,id)
      // 编辑内容
      this.editItem = this.items[index];
      //计算内容的字数
      var content = this.editItem.Content;
      if (content != null) {
        this.count = 200 - content.length;
      } else {
        this.count = 200;
      }
      this.layer = layer.open({
        type: 1,
        title: "视频编辑",
        content: $("#editvideo"),
        area: "600px",
        skin: 'layui-layer-demo', //样式类名
        anim: 2,
        shadeClose: true, //开启遮罩关闭
      });
      $("#edit_title").focus();
      $("#editfile").val("");
      this.overSize = false;
    },
    layer_close() {
      layer.close(this.layer);
    },
    add() {
      $("#add_title").focus();
      var _this = this;
      this.layer = layer.open({
        type: 1,
        title: "视频增加",
        content: $("#addvideo"),
        area: "600px",
        skin: 'layui-layer-demo', //样式类名
        anim: 2,
        shadeClose: false, //开启遮罩关闭
        end: function() {
          _this.clearData();
          _this.overSize = false;
        }
      });
      this.count = 200;
      $("#add_title").focus();
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
    checkAddFile() {
      var file = document.getElementById("addfile");
      if (file.value === "") {
        layer.msg("请上传视频!", { icon: 0, time: 2500 });
        this.addValid = false;
      } else {
        this.addValid = this.video_size(file);
      }
    },
    checkEditFile() {
      var file = document.getElementById("editfile");
      if (file.value != "") {
        this.editValid = this.video_size(file);
      }
    },
    checkContent(id) {
      var _this = this;
      var el = document.getElementById(id);
      var length = el.value.length; //内容的字数长度
      this.count = 200 - length; //还能输入的字数
      if (this.count < 0) {
        this.count = 0;
      }
      if (length < 5 || length > 200) {
        el.classList.add("error");
        if (id == "add_content") {
          _this.addValid = false;
        } else {
          _this.editValid = false;
        }
      } else {
        el.classList.remove("error");
      }
    },
    layer_submit_add() {
      var _this = this;
      this.checkAddItem('add_title', 1);
      this.checkContent('add_content');
      this.checkAddFile();
      if (this.addValid) {
        this.isHide = false; //加载中
        $("#addform").ajaxSubmit({
          type: "post",
          url: this.ip + "/api/HotVideo/Add",
          headers: {
            "Authorization": this.token
          },
          success: function(res) {
            if (res.Code === 200) {
              _this.firstLoad = true;
              _this.getList(1, _this.currCount);
              _this.layer_close();
              _this.clearData();
              layer.msg("添加成功!", { icon: 1, time: 2500 });
            } else {
              _this.isHide = true;
              layer.msg(res.Message, { icon: 2, time: 2500 });
            }
          }
        });
      }
    },
    clearData() {
      $("#add_title").val("");
      $("#add_content").val("");
      $("#add_title").removeClass("error");
      $("#add_content").removeClass("error");
    },
    formatData(data) {
      return JSON.parse(JSON.stringify(data));
    },
    layer_submit_edit() {
      var _this = this;
      this.editValid = true;
      this.checkEditItem('edit_title', 1);
      this.checkContent('edit_content');
      this.checkEditFile();
      if (this.editValid) {
        this.isHide = false; //加载中
        $("#editform").ajaxSubmit({
          url: this.ip + "/api/HotVideo/Update",
          type: "post",
          headers: {
            "Authorization": this.token
          },
          success: function(res) {
            if (res.Code === 200) {
              _this.firstLoad = true;
              _this.getList(1, _this.currCount);
              _this.layer_close();
              layer.msg("修改成功!", { icon: 1, time: 2500 });
            } else {
              _this.isHide = true;
              layer.msg(res.Message, { icon: 2, time: 2500 });
            }
          }
        });
      }
    },
    //判断视频大小
    video_size(id) {
      var filesize = id.files[0].size / 1000000;
      var sizes = this.getFloat(filesize, 1);
      var valid = true;
      if (sizes > 10) {
        // layer.msg("视频大小不能超过10M!", { icon: 2, time: 3000 });
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
          val = val.slice(0, 10) + "..." + val.slice(leng - 9, leng);
        }
        return val;
      }
    },
    subContent: function(val) {
      if (!val) {
        return "";
      } else {
        var leng = val.length;
        if (leng > 15) {
          val = val.slice(0, 7) + "..." + val.slice(leng - 7, leng);
        }
        return val;
      }
    }
  }
});
