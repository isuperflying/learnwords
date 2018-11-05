// pages/about/about.js
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
      title: '联系我们',
    })
  },

  downimg:function(){
    wx.previewImage({
      current: 'https://www.antleague.com/gzh.jpg', // 当前显示图片的http链接
      urls: ['https://www.antleague.com/gzh.jpg'] // 需要预览的图片http链接列表
    })
  },

  copynumber:function(){
    wx.setClipboardData({
      data: 'ttgy033000',
      success(res) {
        wx.showToast({
          title: '已复制',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  }
})