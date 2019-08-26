var baseUrl = 'https://www.antleague.com/'
let wechat = require('../../utils/wechat.js');
var util = require('../../utils/util.js') //引入微信自带的日期格式化
var app = getApp();
var userInfo
var current_page = 1
let list
let is_exceed = false
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
    wx.showLoading({
      title: '加载中',
    })
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
        page: current_page,
        keyindex: 0
      },
      success: function (result) {
        //console.log(result.data)
        wx.hideLoading()
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
          if(list.length >= 200){
            is_exceed = true
          }
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function (err) {
        wx.hideLoading()
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
    if (!is_exceed){
      current_page++;
      this.loadDataByPage();
    }
    
  },
  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '卡片式学单词，记忆快还有趣哦!',
      path: '/pages/home/home',
      imageUrl: '../../images/share_img.png'
    }
  }
})