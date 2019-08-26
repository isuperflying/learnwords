var baseUrl = 'https://www.antleague.com/'
let wechat = require('../../utils/wechat.js');
var util = require('../../utils/util.js') //引入微信自带的日期格式化
var app = getApp();
let userInfo
var is_from_sign = false
var current_page = 1
var jump_type = 1 //1基础训练，2排行榜，3签到,4收藏
Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_login: false,
    sign_days: [{
      day_num: 1,
      day_score: 1
    }, {
      day_num: 2,
      day_score: 3
    }, {
      day_num: 3,
      day_score: 'VIP免费'
    }],
    today: 0,
    today_is_sign: false,
    is_nav: true,
    isUse: true,
    new_app_id: 'wx181d47e91d301a20'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    wx.setNavigationBarTitle({
      title: '萌宝学单词'
    })

    var animation = wx.createAnimation({
      duration: 1000,
      timingFunction: "ease",
      delay: 0
    })

    var that = this
    wx.getSystemInfo({
      success(res) {
        
        app.globalData.current_system = res.platform
        console.log(res.platform)

        let temp_height = 550;

        let bottom = temp_height
        let x = 1
        setInterval(function () {
          bottom = temp_height + Math.cos(x++) * 30
          if (x > 1000) {
            x = 1
          }
          animation.bottom(bottom + "rpx").step()
          that.setData({
            animationData: animation.export()
          })
        }.bind(that), 400)

      }
    })

    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    console.log(userInfo)
    if (userInfo) {
      this.setData({
        is_login: true
      })
    }

    wx.getSystemInfo({
      success: function(res) {
        console.log('sdk version--->' + res.SDKVersion)
        var result = that.compareVersion(res.SDKVersion, '2.0.7')
        that.setData({
          isUse: result >= 0 ? true : false
        })
      },
    })
  },

  userLogin: function(e) {
    jump_type = 1
    this.getUserInfo();
  },
  
  getUserInfo() {
    var that = this
    wechat.getCryptoData2()
      .then(d => {
        return wechat.getMyData(d);
      })
      .then(d => {
        console.log("从后端获取的用户信息--->", d.data);
        userInfo = d.data.data
        wechat.saveUserInfo(userInfo)
        app.globalData.userInfo = userInfo
        that.data.is_login = true
        if (jump_type == 1) {
          that.basetrain()
        } else if (jump_type == 2) {
          that.rankList()
        } else if(jump_type == 3){
          that.todaySignState()
        }else{
          that.mycollect()
        }

      })
      .catch(e => {
        console.log(e);
      })
  },

  basetrain: function() {
    wx.navigateTo({
      url: '/pages/wordtype/wordtype',
    })
  },

  rank: function() {
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    if (userInfo) {
      this.rankList()
    } else {
      jump_type = 2
      this.getUserInfo();
    }
  },

  rankList: function() {
    wx.navigateTo({
      url: '/pages/ranklist/ranklist',
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
      this.todaySignState()
    } else {
      jump_type = 3
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

          userInfo.sign_day_num = userInfo.sign_day_num + 1;
          app.globalData.userInfo = userInfo;
          wechat.saveUserInfo(userInfo);

          if (userInfo.sign_day_num == 3) {
            that.updateTestVip();
          } else {
            wx.showToast({
              title: '签到成功',
              icon: 'none'
            })
          }

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
      fail: function(err) {
        console.log(err)
      }
    })
  },

  //获取用户的当天签到状态
  updateTestVip: function() {
    var that = this
    let end_date = util.getLaterDate(7)
    console.log(end_date)
    wx.request({
      url: baseUrl + 'updatetestvip',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        end_date: end_date,
        keyindex: 0
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {
          wx.showToast({
            title: '你已经获得7天免费VIP哦',
            icon: 'none'
          })
          userInfo.vip_end_date = end_date;
          app.globalData.userInfo = userInfo;
          wechat.saveUserInfo(userInfo);
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

  store: function() {
    wx.showToast({
      title: '尽请期待',
      icon: 'none'
    })
    return;
  },

  closeDialog: function() {
    this.setData({
      show_dialog: 0
    })
  },

  newApp: function(e) {
    if (this.data.isUse) {
      return;
    }
    var that = this
    wx.navigateToMiniProgram({
      appId: that.data.new_app_id
    })
  },

  compareVersion: function(v1, v2) {
    v1 = v1.split('.')
    v2 = v2.split('.')
    var len = Math.max(v1.length, v2.length)

    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }

    for (var i = 0; i < len; i++) {
      var num1 = parseInt(v1[i])
      var num2 = parseInt(v2[i])

      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }

    return 0
  },

  collect: function () {
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    if (userInfo) {
      this.mycollect()
    } else {
      jump_type = 4
      this.getUserInfo();
    }
  },

  mycollect: function() {
    var cid = 0
    var cname = '我的收藏'
    wx.navigateTo({
      url: '/pages/wordread/wordread?cid=' + cid + '&cname=' + cname
    })
  },

  about:function(e){
    wx.navigateTo({
      url: '/pages/about/about',
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '卡片式学单词，记忆快还有趣哦!',
      path: '/pages/home/home',
      imageUrl: '../../images/share_img.png'
    }
  },
})