Page({
  data: {
    imgUrls: [
      '../../images/card1.png',
      '../../images/card2.png',
      '../../images/card3.png',
    ],
    swiperIndex: 0
  },
  swiperChange(e) {
    this.setData({
      swiperIndex: e.detail.current
    })
  }
})
