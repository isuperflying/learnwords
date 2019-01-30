let wechat = require('../../utils/wechat.js');
var baseUrl = 'https://www.antleague.com/'
var qiniuUrl = 'https://antleague.com/'
var plugin = requirePlugin("WechatSI")
var util = require('../../utils/util.js') //引入微信自带的日期格式化
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
var free_read_count = 4
var userInfo

var current_system

Page({
  data: {
    swiperIndex: 0,
    musicStatus: 'on',
    keep_icon: '../../images/is_keep.png',
    not_keep_icon: '../../images/is_not_keep.png',
    play_img: '/images/word_bt_read.png',
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
    var that = this
    
    wx.getSystemInfo({
      success(res) {
        console.log(res.windowHeight * res.pixelRatio * 0.52)
        console.log(res.windowHeight * res.pixelRatio * 0.42)
        that.setData({
          sheight: 860,
          swiper_height: 700,
        })
      }
    })

    //当前的系统版本
    current_system = app.globalData.current_system
    console.log(current_system)

    userInfo = app.globalData.userInfo || wx.getStorageSync('user_info')
    //user_is_vip = userInfo.is_vip == 1 ? true : false
    console.log(userInfo)
    let ndate = util.formatDate(new Date);
    if (userInfo.is_vip == 1){
      user_is_vip = true
    }
    if(userInfo.is_vip == 2 && ndate < userInfo.vip_end_date) {
      user_is_vip = true
    }
    console.log(user_is_vip)
    var cid = options.cid
    //var cid = 7;
    console.log('cid--->' + cid)
    console.log('openid--->' + userInfo.openId + '---token--->' + userInfo.token);
    wx.setNavigationBarTitle({
      title: options.cname || '萌宝学单词',
    })

    wx.showLoading({
      title: '正在加载中',
    })

    var that = this
    let url = baseUrl + 'querywords'
    wx.request({
      url: url,
      data: {
        cid: cid,
        openid: userInfo.openId,
        token: userInfo.token
      },
      method: 'POST',
      success: function(result) {
        wx.hideLoading()
        console.log(result.data.data)
        if (result.data.data != null && result.data.data.length > 0){
          words = result.data.data

          for (let i = 0; i < words.length; i++) {
            words[i].current_word_img = qiniuUrl + 'words/' + words[i].word_img
            words[i].is_keep = words[i].keep_id != null || cid == 0 ? true : false
          }

          that.setData({
            words: words,
            total_count: words.length
          })

          that.setCurrentWord()
        }else{
          wx.showToast({
            title: cid == 0 ? '你还没有收藏哦' : '暂无数据',
            icon: 'none'
          })
          
          setTimeout(function(){
              wx.navigateBack();
          },2000)
        }
      },
      fail:function(e){
        wx.hideLoading()
      }
    })

    this.initRecord();
  },

  onShow: function(e) {
    console.log('onShow--->')
    current_index = 0;
    vowel_audio_src = null;
    this.innerAudioContext = null;
    this.data.musicStatus = "on"
  },

  swiperChange(e) {
    clearTimeout(timer)
    isPlay = false

    let temp_index = e.detail.current
    console.log("temp_index--->" + temp_index)
    if (current_system == 'android' || current_system == 'devtools') {
      if (!user_is_vip && temp_index > free_read_count - 1) {
        this.setData({
          showModal: true,
          current_num: temp_index + 1
        })
      } else {
        this.setData({
          word_anim: '',
          is_test_result: false,
          current_num: temp_index + 1
        })
        if (words) {
          current_index = temp_index
          this.setData({
            current_index
          })
          this.setCurrentWord()
        }
      }
    } else if (current_system == 'ios') {
      var that = this
      if (temp_index > free_read_count - 1 && userInfo && userInfo.user_score < 10) {
        this.setData({
          current_num: temp_index + 1
        })
        wx.showModal({
          title: '提醒',
          showCancel: false,
          content: '请先点击单词卡片的【录音】评测功能，获得积分并达到10积分后，才能继续后半部分学习',
          success(res) {
            if (res.confirm) {
              console.log(current_index)
              that.setData({
                current_index
              });
            }
          }
        })
      } else {
        this.setData({
          word_anim: '',
          is_test_result: false,
          current_num: temp_index + 1
        })
        if (words) {
          current_index = temp_index
          this.setData({
            current_index
          })
          this.setCurrentWord()
        }
      }
    } else {
      // wx.showToast({
      //   title: '开发工具',
      // })
    }
  },

  setCurrentWord: function() {
    console.log('current_index--->' + current_index)
    var that = this
    currentObj = words[current_index]
    vowel_audio_src = qiniuUrl + 'words/mp3/' + currentObj.mp3_url
    console.log('current mp3--->' + vowel_audio_src)
    word_name = currentObj.word.toLowerCase()
    timer = setTimeout(function() {
      that.setData({
        current_word_img: qiniuUrl + 'words/' + words[current_index].word_img,
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
  // onReady: function() {
  //   this.initRecord()
  // },

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
        play_img: '/images/word_bt_read.png',
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
      play_img: '/images/word_bt_read.png'
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
    console.log('playWord--->' + isPlay)
    if (isPlay) {
      this.stopMusic()
    } else {
      this.setData({
        is_test_result: false,
        play_img: '/images/word_bt_pause.png'
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
      console.log(res)
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
          result_txt = '太棒了，继续加油哦!'

          //回答正确后，用户积分+1
          //app.globalData.user_score++;
          if (!userInfo.user_score){
            userInfo.user_score = 1
          }else{
            userInfo.user_score++;
          }

          that.updateUserScore();
        } else {
          result_img = '../../images/result_no.png'
          result_txt = '拼读错误，再试一次吧!'
        }

      } else {
        result_img = '../../images/result_no.png'
        result_txt = '拼读错误，再试一次吧!'
      }

      that.setData({
        is_first: false,
        tape_img: '../../images/word_bt_record.png',
        result_img: result_img,
        result_txt: result_txt,
        is_test_result: true
      })
    }

    manager.onError = function(res) {
      console.error("error msg", res.msg)
    }
  },

  updateUserScore: function() {
    console.log(userInfo.token)
    wx.request({
      url: baseUrl + 'updateuserscore',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        score: userInfo.user_score
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {

        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      },
      fail: function(err) {
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
        tape_img: '../../images/word_bt_recording.png'
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
      duration: 2500,
      lang: "en_US"
    })
    isRecord = true;
    this.setData({
      is_test_result: false,
      tape_img: '../../images/word_bt_recording.png'
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
      console.log('manager stop--->')
      manager.stop();
      isRecord = false
      that.setData({
        tape_img: '../../images/word_bt_record.png'
      })
    }, 2500)
  },

  playTape: function(e) {
    if (isPlay) {
      this.setData({
        play_tape_img: '../../images/word_bt_play.png'
      })
      this.stopMusic()
    } else {
      if (tapeAudioPath) {
        this.setData({
          is_test_result: false,
          play_tape_img: '../../images/word_bt_pause.png'
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
    let keep_state = this.data.words[current_index].is_keep
    if (keep_state) {
      this.cancelKeep();
    } else {
      this.addKeep();
    }
  },

  addKeep: function() {
    var that = this
    wx.request({
      url: baseUrl + 'addkeep',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        wordId: that.data.words[current_index].id
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {
          wx.showToast({
            title: '已收藏',
            icon: 'none'
          })

          that.data.words[current_index].is_keep = true
          that.setData({
            words: that.data.words
          })

        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      }
    })
  },

  cancelKeep: function() {
    var that = this
    wx.request({
      url: baseUrl + 'cancelkeep',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token,
        wordId: that.data.words[current_index].id
      },
      success: function(res) {
        console.log(res.data)
        if (res.data.code == 0) {
          wx.showToast({
            title: '已取消收藏',
            icon: 'none'
          })

          that.data.words[current_index].is_keep = false
          that.setData({
            words: that.data.words
          })

        } else {
          wx.showToast({
            title: '数据异常，请重试',
            icon: 'none'
          })
        }
      }
    })
  },

  vipBuy: function() {
    wx.showLoading({
      title: '请求中',
    })
    var that = this
    wx.request({
      url: baseUrl + 'getpayinfo',
      method: 'POST',
      data: {
        openid: userInfo.openId,
        token: userInfo.token
      },
      success: function(res) {
        wx.hideLoading()
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
            success: function(res) {
              console.log('pay success----')
              //console.log(res)
              wx.showToast({
                title: '购买成功',
                icon: 'none'
              })
              //支付成功后更改用户的VIP状态
              user_is_vip = true
              if (userInfo) {
                userInfo.is_vip = 1
                wechat.saveUserInfo(userInfo)
                app.globalData.userInfo = userInfo
              }
              isPlay = false;
              current_index++;
              that.setCurrentWord()
              that.setData({
                showModal: false
              });
            },
            fail: function(res) {
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
      fail: function(err) {
        
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
  onShareAppMessage: function () {
    return {
      title: '卡片式学单词，记忆快还有趣哦!',
      path: '/pages/home/home',
      imageUrl: '../../images/share_img.png'
    }
  }
})