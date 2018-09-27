// pages/testpay/testpay.js
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
    var that = this
    wx.login({
      success: function (res) {
        if (res.code) {
          //发起网络请求
          wx.request({
            url: 'http://192.168.1.104:8888/userLogin',
            method: 'POST',
            data: {
              code: res.code
            },
            success: function (res) {
              console.log(res.data.data.openid)
              let openid = res.data.data.openid
              that.getPayInfo(openid)
            },
            fail: function (err) {
              console.log(err)
            }
          })
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  },

  getPayInfo:function(openid){
    wx.request({
      url: 'http://192.168.1.104:8888/getpayinfo',
      method: 'POST',
      data: {
        openid: openid
      },
      success: function (res) {
        console.log(res.data.data)

        var timestamp = res.data.data.timestamp +'' //时间戳
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
          fail:function(res){
            console.log(res)
          }
        })
        
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})