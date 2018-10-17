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