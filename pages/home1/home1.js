let wechat = require('../../utils/wechat.js');
var util = require('../../utils/util.js') //引入微信自带的日期格式化
var app = getApp();
let userInfo
var is_from_sign = false
var current_page = 1
var jump_type = 1 //1基础训练，2排行榜，3签到
Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_login:false,
    sign_days: [{
      day_num: 1,
      day_score: 1
    }, {
      day_num: 2,
      day_score: 3
    }, {
      day_num: 3,
      day_score: 5
    }, {
      day_num: 4,
      day_score: 7
    }, {
      day_num: 5,
      day_score: 9
    }, {
      day_num: 6,
      day_score: 'VIP免费'
    }],
    today: 0,
    today_is_sign: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '萌宝学单词'
    })

    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')

    if(userInfo){
      this.setData({
        is_login:true
      })
    }

    var animation = wx.createAnimation({
      duration: 1000,
      timingFunction: "ease",
      delay: 0
    })

    let bottom = 480
    let x = 1
    setInterval(function () {
      bottom = 480 + Math.cos(x++) * 30
      if (x > 1000) {
        x = 1
      }
      animation.bottom(bottom + "rpx").step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 400)
    
  },

  userLogin: function (e) {
    this.getUserInfo();
  },

  getUserInfo() {
    var that = this
    wechat.getCryptoData2()
      .then(d => {
        return wechat.getMyData(d);
      })
      .then(d => {
        console.log("从后端获取的openId--->", d.data);
        userInfo = d.data.data
        wechat.saveUserInfo(userInfo)
        app.globalData.userInfo = userInfo
        that.data.is_login = true
        if(jump_type == 1){
          that.basetrain()
        }else if(jump_type == 2) {
          that.rankList()
        }else{
          that.todaySignState()
        }
        
      })
      .catch(e => {
        console.log(e);
      })
  },

  basetrain: function () {
    wx.navigateTo({
      url: '/pages/wordtype/wordtype',
    })
  },
  
  rank:function(){
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    if (userInfo) {
      this.rankList()
    } else {
      jump_type = 2
      this.getUserInfo();
    }
  },

  rankList: function () {
      wx.navigateTo({
        url: '/pages/ranklist/ranklist',
      })
  },

  //获取用户的当天签到状态
  todaySignState: function () {
    var that = this
    let ndate = util.formatDate(new Date);
    console.log(ndate)
    wx.request({
      url: 'http://192.168.1.104:8888/todaysignstate',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        sdate: ndate
      },
      success: function (res) {
        console.log(res.data)
        if (res.data.code == 0) {
          console.log('sign count--->' + res.data.data[0].sign_count)
          if (res.data.data.length > 0 && res.data.data[0].sign_count > 0) {
            console.log('今天已经签到')
            wx.showToast({
              title: '今天已经签过到了',
              icon: 'none'
            })
            that.setData({
              today_is_sign: true,
              today: parseInt(userInfo.sign_day_num || 0)
            })
          } else {
            that.setData({
              today_is_sign: false,
              today: parseInt(userInfo.sign_day_num || 0),
              show_dialog: 1
            })
          }
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },

  //签到
  todaySign: function () {
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    if (userInfo) {
      this.todaySignState()
    } else {
      jump_type = 3
      this.getUserInfo();
    }
  },

  //新增签到
  signDay: function () {
    var that = this
    let ndate = util.formatDate(new Date);
    console.log(ndate)
    wx.request({
      url: 'http://192.168.1.104:8888/signtoday',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        sdate: ndate
      },
      success: function (res) {
        console.log(res.data)
        if (res.data.code == 0) {
          console.log(res.data)
          wx.showToast({
            title: '签到成功',
            icon: 'none'
          })
          that.setData({
            today_is_sign: true,
            show_dialog: 0
          })
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },

  store:function(){
    wx.showToast({
      title: '尽请期待',
      icon: 'none'
    })
    return;
  },

  closeDialog: function () {
    this.setData({
      show_dialog: 0
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})