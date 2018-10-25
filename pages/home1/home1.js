// pages/home1/home1.js
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
    wx.setNavigationBarTitle({
      title: '萌宝学单词'
    })

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

  basetrain: function () {
    wx.navigateTo({
      url: '/pages/wordtype/wordtype',
    })
  },
  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})