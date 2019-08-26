var baseUrl = 'https://www.antleague.com/'

let wechat = require('../../utils/wechat.js');
var util = require('../../utils/util.js') //引入微信自带的日期格式化
var app = getApp();
let userInfo
var is_from_sign = false
var current_page = 1
Page({

  /**
   * 页面的初始数据
   */
  data: {
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
    is_login: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '每日签到',
    })
    this.setData({
      show_dialog: 0
    })
  },

  paytest: function() {
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    this.getPayInfo()
  },

  getPayInfo: function() {
    wx.request({
      url: baseUrl + 'getpayinfo',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        keyindex: 0
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {
          var timestamp = res.data.data.timestamp + '' //时间戳
          var nonceStr = res.data.data.nonceStr //随机数
          var packages = res.data.data.package //prepay_id
          var paySign = res.data.data.paySign //签名
          var signType = 'MD5'

          wx.requestPayment({
            timeStamp: timestamp,
            nonceStr: nonceStr,
            package: packages,
            signType: signType,
            paySign: paySign,
            success: function(res) {
              console.log('pay success----')
              console.log(res)

              //支付成功后更改用户的VIP状态
              if (userInfo) {
                userInfo.isVip = true
                wechat.saveUserInfo(userInfo)
                app.globalData.userInfo = userInfo
              }

            },
            fail: function(res) {
              console.log('pay fail----')
              console.log(res)
            }
          })
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function(err) {
        console.log(err)
      }
    })
  },

  userLogin: function(e) {
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
        if (is_from_sign) {
          that.todaySignState()
        }
      })
      .catch(e => {
        console.log(e);
      })
  },

  updateUserScore: function() {
    console.log(userInfo.token)
    wx.request({
      url: baseUrl + 'updateuserscore',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        score: 11,
        keyindex: 0
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {

        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function(err) {
        console.log(err)
      }
    })
  },

  //获取用户的当天签到状态
  todaySignState: function() {
    var that = this
    let ndate = util.formatDate(new Date);
    console.log(ndate)
    wx.request({
      url: baseUrl + 'todaysignstate',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        sdate: ndate,
        keyindex: 0
      },
      success: function(res) {
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
      fail: function(err) {
        console.log(err)
      }
    })
  },

  //签到
  todaySign: function() {
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    if (userInfo) {
      is_from_sign = false
      this.todaySignState()
    } else {
      is_from_sign = true
      this.getUserInfo();
    }
  },

  //新增签到
  signDay: function() {
    var that = this
    let ndate = util.formatDate(new Date);
    console.log(ndate)
    wx.request({
      url: baseUrl + 'signtoday',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        sdate: ndate,
        keyindex: 0
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {
          console.log(res.data)
          wx.showToast({
            title: '签到成功',
            icon: 'none'
          })
          that.setData({
            today_is_sign: true
          })
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function(err) {
        console.log(err)
      }
    })
  },

  rankList:function(){
    wx.request({
      url: baseUrl + 'ranklist',
      method: 'POST',
      data: {
        token: userInfo.token,
        page: current_page,
        keyindex: 0
      },
      success: function (res) {
        console.log(res.data)
        if (res.data.code == 0) {
          console.log(res.data)
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

  closeDialog: function() {
    this.setData({
      show_dialog: 0
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})