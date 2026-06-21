export default defineAppConfig({
  pages: [
    'pages/files/index',
    'pages/status/index',
    'pages/reminders/index',
    'pages/file-detail/index',
    'pages/member-detail/index',
    'pages/remind-create/index',
    'pages/reminder-detail/index',
    'pages/member-reminders/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '团队文件日志',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F7F9FC'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#27C28B',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/files/index',
        text: '文件'
      },
      {
        pagePath: 'pages/status/index',
        text: '查看状态'
      },
      {
        pagePath: 'pages/reminders/index',
        text: '提醒记录'
      }
    ]
  }
})
