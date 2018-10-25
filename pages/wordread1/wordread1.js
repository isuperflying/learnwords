let wechat = require('../../utils/wechat.js');
var baseUrl = 'https://www.antleague.com/'
var plugin = requirePlugin("WechatSI")
let manager = plugin.getRecordRecognitionManager()

const app = getApp()
var innerAudioContext
var vowel_audio_src
var isPlay = false

var current_index = 0
var words
var timer; // 计时器
var currentObj
var isRecord = false //是否开始录用
var word_name
var tapeResult
var tapeAudioPath //录音文件
var last_index = -1
var user_is_vip = false
var free_read_count = 3
var userInfo
Page({
  data: {
    swiperIndex: 0,
    musicStatus: 'on',
    keep_icon: '../../images/is_keep.png',
    not_keep_icon: '../../images/is_not_keep.png',
    play_img: '/images/word_bt_reading.png',
    tape_img: '../../images/word_bt_record.png',
    play_tape_img: '../../images/word_bt_play.png',
    is_test_result: false,
    result_img: '../../images/result_yes.png',
    result_txt: '太棒了，继续加油!',
    isSpeaking: false,
    j: 1, //帧动画初始图片
    current_num: 1,
    total_count: 1,
    showModal: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('onLoad--->')
    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    user_is_vip = userInfo.is_vip == 1 ? true : false
    //var cid = options.cid
    var cid = 7;
    console.log('cid--->' + cid)
    wx.setNavigationBarTitle({
      title: options.cname || '萌宝学单词',
    })
    var that = this
    let url = baseUrl + 'querywords'
    wx.request({
      url: url,
      data: {
        'cid': cid
      },
      method: 'POST',
      success: function(result) {
        console.log(result.data.data)
        words = result.data.data

        for (let i = 0; i < words.length; i++) {
          words[i].current_word_img = baseUrl + 'words/' + words[i].word_img
          words[i].is_keep = false
        }

        that.setData({
          words: words,
          total_count:words.length
        })

        that.setCurrentWord()
      }
    })
  },

  onShow:function(e){
    console.log('onShow--->')
    current_index = 0;
    vowel_audio_src = null;
    this.innerAudioContext = null;
  },

  swiperChange(e) {
    clearTimeout(timer)
    let temp_index = e.detail.current
    if (!user_is_vip && temp_index > free_read_count - 1){
      this.setData({
        showModal:true,
        current_num: temp_index + 1
      })
    }else{
      this.setData({
        word_anim: '',
        is_test_result: false,
        current_num: temp_index+1
      })
      if (words) {
        current_index = temp_index
        this.setData({
          current_index
        })
        this.setCurrentWord()
      }
    }
  },

  setCurrentWord: function() {
    console.log('current_index--->' + current_index)
    var that = this
    currentObj = words[current_index]
    vowel_audio_src = baseUrl + 'words/mp3/' + currentObj.mp3_url
    word_name = currentObj.word.toLowerCase()
    timer = setTimeout(function() {
      that.setData({
        current_word_img: baseUrl + 'words/' + words[current_index].word_img,
        en_word: currentObj.word,
        cn_word: currentObj.word_mean,
        //word_anim: 'bounceIn'
      })
      that.playWord()
    }, 300);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    this.initRecord()
  },

  preWord: function() {
    clearTimeout(timer)
    this.setData({
      word_anim: '',
      is_test_result: false
    })
    if (words) {
      current_index--
      if (current_index > -1) {
        this.setCurrentWord()
        this.setData({
          current_index: current_index
        })
      } else {
        current_index = 0;
      }
    }
  },

  changeWord: function(e) {
    console.log(e.detail.current)
    current_index = e.detail.current
    clearTimeout(timer)
    this.setData({
      //word_anim: '',
      is_test_result: false
    })
    if (words) {
      if (current_index < words.length) {
        this.setCurrentWord()
      } else {
        current_index = words.length - 1
      }
    }
  },

  nextWord: function() {
    clearTimeout(timer)
    this.setData({
      word_anim: '',
      is_test_result: false
    })
    if (words) {
      current_index++
      if (current_index < words.length) {
        this.setCurrentWord()
        this.setData({
          current_index: current_index
        })
      } else {
        current_index = words.length - 1
      }
    }
  },

  playMusic(src, loop = false) {
    if (this.data.musicStatus != "on") {
      this.stopMusic()
      return
    }
    isPlay = true
    const innerAudioContext = wx.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
    innerAudioContext.src = src
    innerAudioContext.loop = loop
    innerAudioContext.play()

    //播放结束
    innerAudioContext.onEnded(() => {
      isPlay = false
      this.setData({
        play_img: '/images/word_bt_reading.png',
        play_tape_img: '../../images/word_bt_play.png'
      })
    })
  },

  stopMusic() {
    if (this.innerAudioContext) {
      console.log('stop music --->')
      this.innerAudioContext.stop()
    }
    isPlay = false;
    this.setData({
      play_img: '/images/word_bt_reading.png'
    })
  },

  invisiable() {
    this.data.musicStatus = "off"
    this.stopMusic();
    if (this.loopInnerAudioContext) {
      this.loopInnerAudioContext.stop()
    }
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
    }
  },

  playWord: function() {
    if (isPlay) {
      this.stopMusic()
    } else {
      this.setData({
        is_test_result: false,
        play_img: '/images/word_bt_reading.png'
      })
      this.playMusic(vowel_audio_src, false)
    }
  },

  //麦克风帧动画  
  speaking: function() {
    var that = this;
    //话筒帧动画  
    var i = 1;
    this.timer = setInterval(function() {
      i++;
      i = i % 5;
      that.setData({
        j: i
      })
    }, 200);
  },

  initRecord: function() {
    var that = this
    tapeResult = ''
    manager.onRecognize = function(res) {
      console.log("current--->", res.result)
      tapeResult = res.result
    }
    manager.onStop = function(res) {

      clearInterval(this.timer)
      that.setData({
        isSpeaking: false,
      })

      isRecord = false
      console.log("record file path--->", res.tempFilePath)
      console.log("listen result --->", res.result)
      tapeAudioPath = res.tempFilePath
      if (res.result) {
        tapeResult = res.result
      }

      var result_img
      var result_txt
      if (tapeResult) {
        tapeResult = tapeResult.trim().toLowerCase()
        console.log('last char--->' + tapeResult.substr(tapeResult.length - 1, 1))
        if (tapeResult.length > 1 && tapeResult.substr(tapeResult.length - 1, 1) == ".") {
          tapeResult = tapeResult.substring(0, tapeResult.length - 1)
        }
        word_name = word_name.replace(new RegExp('#', 'g'), '').trim();

        console.log('result===>' + tapeResult + '----word_name---->' + word_name)
        if (tapeResult == word_name) {
          console.log('result is same--->')
          result_img = '../../images/result_yes.png'
          result_txt = '太棒了，继续加油!'

          //回答正确后，用户积分+1
          app.globalData.user_score++;
          that.updateUserScore();
        } else {
          result_img = '../../images/result_no.png'
          result_txt = '拼读错误，再试一次'
        }

      } else {
        result_img = '../../images/result_no.png'
        result_txt = '拼读错误，再试一次'
      }

      that.setData({
        is_first: false,
        tape_img: '../../images/record_icon.png',
        result_img: result_img,
        result_txt: result_txt,
        is_test_result: true
      })
    }

    manager.onError = function(res) {
      console.error("error msg", res.msg)
    }
  },

  updateUserScore: function () {
    console.log(userInfo.token)
    wx.request({
      url: 'http://192.168.80.97:8888/updateuserscore',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        score: app.globalData.user_score
      },
      success: function (res) {
        console.log(res.data)
        if (res.data.code == 0) {
          
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },


  record: function() {
    this.initRecord()

    console.log('isRecord-->' + isRecord)
    if (isRecord) {
      manager.stop();
      isRecord = false
      this.setData({
        tape_img: '../../images/word_bt_record.png'
      })
    } else {
      this.setData({
        isSpeaking: true
      })

      this.speaking()

      manager.start({
        duration: 2000,
        lang: "en_US"
      })
      isRecord = true;
      this.setData({
        is_test_result: false,
        tape_img: '../../images/word_bt_record.png'
      })
    }
  },

  touchstart: function() {
    console.log('touchstart')
    this.setData({
      isSpeaking: true
    })

    this.speaking()

    manager.start({
      duration: 2000,
      lang: "en_US"
    })
    isRecord = true;
    this.setData({
      is_test_result: false,
      tape_img: '../../images/recording.png'
    })
  },
  //手指抬起  
  touchup: function() {
    console.log('touchup')
    clearInterval(this.timer)
    this.setData({
      isSpeaking: false,
    })

    var that = this
    setTimeout(function() {
      manager.stop();
      isRecord = false
      that.setData({
        tape_img: '../../images/record_icon.png'
      })
    }, 300)
  },

  playTape: function(e) {
    if (isPlay) {
      this.setData({
        play_tape_img: '../../images/play_tape_img.png'
      })
      this.stopMusic()
    } else {
      if (tapeAudioPath) {
        this.setData({
          is_test_result: false,
          play_tape_img: '../../images/play_tape_img.png'
        })
        this.playMusic(tapeAudioPath, false)
      } else {
        wx.showToast({
          title: '暂无录音文件',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    this.invisiable()
  },

  /**
   * 生命周期函数--监听页面卸载
   */

  onUnload: function() {
    this.invisiable()
  },

  keepChange: function(e) {
    //let cindex = e.currentTarget.dataset.i
    this.data.words[current_index].is_keep = true
    this.setData({
      words: this.data.words
    })
  },

  vipBuy: function () {
    var that = this
    wx.request({
      url: 'http://192.168.1.104:8888/getpayinfo',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token
      },
      success: function (res) {
        console.log(res.data)
        if (res.data.code == 0) {
          var timestamp = res.data.data.timestamp + '' //时间戳
          var nonceStr = res.data.data.nonceStr //随机数
          var packages = res.data.data.package //prepay_id
          var paySign = res.data.data.paySign //签名
          var signType = 'MD5'

          wx.requestPayment({
            timeStamp: timestamp,
            nonceStr: nonceStr,
            package: packages,
            signType: signType,
            paySign: paySign,
            success: function (res) {
              console.log('pay success----')
              //console.log(res)
              wx.showToast({
                title: '购买成功',
                icon : 'none'
              })
              //支付成功后更改用户的VIP状态
              user_is_vip = true
              if (userInfo) {
                userInfo.is_vip = 1
                wechat.saveUserInfo(userInfo)
                app.globalData.userInfo = userInfo
              }
              
              current_index++;
              that.setCurrentWord()
              that.setData({
                showModal: false
              });
            },
            fail: function (res) {
              console.log('pay fail----')
              console.log(res)
              wx.showToast({
                title: '支付失败',
                icon: 'none'
              })
            }
          })
        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function (err) {
        console.log(err)
      }
    })
  },

  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function() {},
  /**
   * 隐藏模态对话框
   */
  hideModal: function() {
    console.log("hide");
    this.setData({
      showModal: false,
      current_index
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})