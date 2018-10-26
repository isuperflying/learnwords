const app = getApp()

var baseUrl = 'https://www.antleague.com/'

var list = null
var page = 1
var pSize = 20
var userInfo
Page({

  /**
   * 页面的初始数据
   */
  data: {
    base_img_url: baseUrl + 'words/',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '单词分类',
    })
    wx.showLoading({
      title: '加载中',
    })
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    this.loadData();
  },

  loadData: function() {
    var that = this
    let url = baseUrl + 'querywordtypes'
    wx.request({
      url: url,
      data: {
        token: userInfo.token
      },
      method: 'POST',
      success: function(result) {
        wx.hideLoading()
        wx.stopPullDownRefresh();
        console.log(result.data.data)

        var list = result.data.data
        for(let i=0;i<list.length;i++){
          
          let temp_word = list[i].category_name.split("#")
          let en_word = temp_word[0]
          let cn_word = temp_word[1]
          list[i]['en_word'] = en_word
          list[i]['cn_word'] = cn_word
        }
        list = list.slice(1,list.length)
        that.setData({
          wordlist: list
        })
      },
      fail: function (res) {
        wx.hideLoading()
        wx.stopPullDownRefresh()
      }
    })
  },
  
  /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
  onPullDownRefresh: function () {
    page = 1
    this.data.videolist = null
    this.loadData()
  },

  wordlist: function(e) {
    var cid = e.currentTarget.dataset.id
    var cname = e.currentTarget.dataset.cname
    wx.navigateTo({
      url: '/pages/wordread1/wordread1?cid=' + cid + '&cname=' + cname
    })
  },

  onShareAppMessage: function () {
    return {
      title: '儿歌乐园，宝宝快乐的源泉!',
      path: '/pages/home/home',
      imageUrl: '/images/share_img.png'
    }
  },

  version: function () {
    var text = '儿歌乐园所有内容都采集于网络,' +
      '仅为网友提供信息交流的平台。儿歌乐园自身不控' +
      '制、编辑或修改任何资源信息。如果正在使用的视频及其他的资源侵犯了你的' +
      '作品著作权，请个人或单位务必以书面的通讯方式向作者' +
      '提交权利通知。本程序一定积极配合下架资源处理。'
    wx.showModal({
      title: '免责申明',
      content: text,
      showCancel: false,
      success: function (res) {
        if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
})