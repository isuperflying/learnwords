var baseUrl = 'https://www.antleague.com/'
var plugin = requirePlugin("WechatSI")
let manager = plugin.getRecordRecognitionManager()

const app = getApp()
var innerAudioContext
var vowel_audio_src
var isPlay = false

var current_index = 6
var words
var timer; // 计时器
var currentObj
var isRecord = false //是否开始录用
var word_name
var tapeResult
var tapeAudioPath //录音文件
var last_index = -1

Page({

  /**
   * 页面的初始数据
   */
  data: {
    musicStatus: 'on',
    play_img: '/images/word_play.png',
    tape_img: '../../images/record_icon.png',
    play_tape_img: '../../images/play_record_icon.png',
    is_test_result: false,
    result_img: '../../images/result_yes.png',
    result_txt:'太棒了，继续加油!'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var cid = options.cid
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
        that.setCurrentWord()
      }
    })

  },

  setCurrentWord: function() {
    var that = this
    currentObj = words[current_index]
    vowel_audio_src = baseUrl + 'words/mp3/' + currentObj.mp3_url
    word_name = currentObj.word.toLowerCase()
    timer = setTimeout(function() {
      that.setData({
        current_word_img: baseUrl + 'words/' + words[current_index].word_img,
        en_word: currentObj.word,
        cn_word: currentObj.word_mean,
        word_anim: 'bounceIn'
      })
      that.playWord()
    }, 300);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

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
      } else {
        current_index = 0;
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
        play_img: '/images/word_play.png',
        play_tape_img: '../../images/play_record_icon.png'
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
      play_img: '/images/word_play.png'
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
        is_test_result:false,
        play_img: '/images/word_playing.png'
      })
      this.playMusic(vowel_audio_src, false)
    }
  },

  record: function() {
    var that = this
    tapeResult = ''
    manager.onRecognize = function(res) {
      console.log("current--->", res.result)
      tapeResult = res.result
    }
    manager.onStop = function(res) {
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

    if (isRecord) {
      manager.stop();
      isRecord = false
      this.setData({
        tape_img: '../../images/record_icon.png'
      })
    } else {
      manager.start({
        duration: 2000,
        lang: "en_US"
      })
      isRecord = true;
      this.setData({
        is_test_result: false,
        tape_img: '../../images/recording.png'
      })
    }
  },

  playTape: function(e) {
    if (isPlay) {
      this.setData({
        play_tape_img: '../../images/play_record_icon.png'
      })
      this.stopMusic()
    } else {
      if (tapeAudioPath) {
        this.setData({
          is_test_result: false,
          play_tape_img: '../../images/play_recording.png'
        })
        this.playMusic(tapeAudioPath, false)
      } else {
        wx.showToast({
          title: '暂无录音文件'
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})