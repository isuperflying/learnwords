let wechat = require('../../utils/wechat.js');
var util = require('../../utils/util.js') //引入微信自带的日期格式化

const app = getApp()
var baseUrl = 'https://www.antleague.com/'
var qiniuUrl = 'https://antleague.com/'
var list = null
var page = 1
var pSize = 20
var userInfo
Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_login:false,
    base_img_url: qiniuUrl + 'words/',
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
    console.log(userInfo)
    if (userInfo) {
      this.setData({
        is_login: true
      })
    }

    wx.getSystemInfo({
      success(res) {
        app.globalData.current_system = res.platform
        console.log(res.platform)
      }
    });

    this.loadData();
  },

  loadData: function() {
    var that = this
    let url = baseUrl + 'aquerywordtypes'
    wx.request({
      url: url,
      data: {
        //token: userInfo.token
        keyindex: 0
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
  
  getUserInfo(cid,cname) {
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
        
        wx.navigateTo({
          url: '/pages/wordread/wordread?cid=' + cid + '&cname=' + cname
        })

      })
      .catch(e => {
        console.log(e);
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

    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')

    if (userInfo) {
      wx.navigateTo({
        url: '/pages/wordread/wordread?cid=' + cid + '&cname=' + cname
      })
    } else {
      this.getUserInfo(cid,cname);
    }
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