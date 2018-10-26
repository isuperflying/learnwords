var baseUrl = 'https://www.antleague.com/'
let wechat = require('../../utils/wechat.js');
var util = require('../../utils/util.js') //引入微信自带的日期格式化
var app = getApp();
var userInfo
var current_page = 1
let list
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '积分排行榜',
    })
    list = null
    current_page = 1;
    this.loadDataByPage();
  },
  
  loadDataByPage: function () {
    var that = this
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    wx.request({
      url: baseUrl + 'ranklist',
      method: 'POST',
      data: {
        token: userInfo.token,
        page: current_page
      },
      success: function (result) {
        //console.log(result.data)
        wx.stopPullDownRefresh();
        if (result.data.code == 0) {
          if (list == null) {
            list = result.data.data
          } else {
            list = list.concat(result.data.data)
          }
          that.setData({
            ranklist: list
          })

        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function (err) {
        wx.stopPullDownRefresh();
        console.log(err)
      }
    })
  },

  /**
    * 页面相关事件处理函数--监听用户下拉动作
    */
  onPullDownRefresh: function () {
    list = null
    current_page = 1;
    this.loadDataByPage()
  },

  /**
     * 页面上拉触底事件的处理函数
     */
  onReachBottom: function () {
    current_page++;
    this.loadDataByPage();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})