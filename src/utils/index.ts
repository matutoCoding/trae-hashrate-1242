import dayjs from 'dayjs';

// 格式化时间
export const formatTime = (time: string): string => {
  return dayjs(time).format('MM-DD HH:mm');
};

// 格式化日期
export const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY年MM月DD日');
};

// 相对时间
export const formatRelativeTime = (time: string): string => {
  const now = dayjs();
  const target = dayjs(time);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(time);
};

// 获取状态文本
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    viewed: '已查看',
    previewed: '仅预览',
    downloaded: '已下载',
    unvisited: '未访问'
  };
  return statusMap[status] || status;
};

// 获取状态颜色
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    viewed: '#00B42A',
    previewed: '#FF7D00',
    downloaded: '#3370FF',
    unvisited: '#F53F3F'
  };
  return colorMap[status] || '#86909C';
};

// 获取文件类型图标颜色
export const getFileTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    doc: '#3370FF',
    pdf: '#F53F3F',
    ppt: '#FF7D00',
    excel: '#00B42A',
    image: '#86909C',
    folder: '#27C28B',
    other: '#86909C'
  };
  return colorMap[type] || '#86909C';
};

// 获取文件类型文本
export const getFileTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    doc: '文档',
    pdf: 'PDF',
    ppt: '演示',
    excel: '表格',
    image: '图片',
    folder: '文件夹',
    other: '其他'
  };
  return textMap[type] || type;
};

// 生成提醒文案
export const generateReminderText = (
  fileName: string,
  memberNames: string[]
): string => {
  const nameList = memberNames.join('、');
  const templates = [
    `📢 温馨提醒：${nameList} 同学，「${fileName}」大家都在看啦，记得抽空查看哦～`,
    `👋 Hi ${nameList}，「${fileName}」已经更新啦，麻烦抽时间看一下，有问题随时讨论～`,
    `📋 重要通知：请 ${nameList} 尽快查看「${fileName}」，有任何疑问及时沟通哦！`,
    `⏰ 催看小助手：${nameList} 还没查看「${fileName}」，忙完记得打开看看呀～`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

// 计算百分比
export const calcPercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};
