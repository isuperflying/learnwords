// pages/testpay/testpay.js
let wechat = require('../../utils/wechat.js');
var app = getApp();
let userInfo
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  paytest:function(){
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    this.getPayInfo()
  },

  getPayInfo:function(){
    wx.request({
      url: 'http://192.168.80.97:8888/getpayinfo',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token
      },
      success: function (res) {
        console.log(res.data)
        if(res.data.code == 0){
          var timestamp = res.data.data.timestamp + '' //时间戳
          var nonceStr = res.data.data.nonceStr  //随机数
          var packages = res.data.data.package  //prepay_id
          var paySign = res.data.data.paySign  //签名
          var signType = 'MD5'

          wx.requestPayment({
            timeStamp: timestamp,
            nonceStr: nonceStr,
            package: packages,
            signType: signType,
            paySign: paySign,
            success: function (res) {
              console.log(res)
            },
            fail: function (res) {
              console.log(res)
            }
          })
        }else{
          wx.showToast({
            title: '数据异常，请重试',
            icon:'none'
          })
        }
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },
  
  userLogin:function(e){
    this.getUserInfo();
  },

  getUserInfo() {
    wechat.getCryptoData2()
      .then(d => {
        return wechat.getMyData(d);
      })
      .then(d => {
        console.log("从后端获取的openid", d.data);
        wechat.saveUserInfo(d.data.data)
        app.globalData.userInfo = d.data.data
      })
      .catch(e => {
        console.log(e);
      })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})