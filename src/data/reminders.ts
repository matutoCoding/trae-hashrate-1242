import type { ReminderRecord } from '@/types';

export const mockReminders: ReminderRecord[] = [
  {
    id: 'r1',
    fileId: 'file1',
    fileName: '2026暑期科研项目策划案.docx',
    createTime: '2026-06-21 18:00:00',
    targetMembers: [
      {
        id: '5',
        name: '陈雪',
        avatar: 'https://picsum.photos/id/1027/200/200',
        hasVisitedAfter: false
      },
      {
        id: '6',
        name: '刘伟',
        avatar: 'https://picsum.photos/id/237/200/200',
        hasVisitedAfter: true,
        visitTime: '2026-06-21 20:30:00'
      }
    ],
    message: '📢 温馨提醒：陈雪、刘伟同学，「2026暑期科研项目策划案.docx」大家都在看啦，记得抽空查看哦～',
    status: 'partial'
  },
  {
    id: 'r2',
    fileId: 'file6',
    fileName: '比赛报名表.xlsx',
    createTime: '2026-06-22 09:00:00',
    targetMembers: [
      {
        id: '5',
        name: '陈雪',
        avatar: 'https://picsum.photos/id/1027/200/200',
        hasVisitedAfter: false
      },
      {
        id: '6',
        name: '刘伟',
        avatar: 'https://picsum.photos/id/237/200/200',
        hasVisitedAfter: false
      }
    ],
    message: '⏰ 催看小助手：陈雪、刘伟还没查看「比赛报名表.xlsx」，忙完记得打开看看呀～',
    status: 'pending'
  },
  {
    id: 'r3',
    fileId: 'file2',
    fileName: '组会汇报PPT模板.pptx',
    createTime: '2026-06-20 10:00:00',
    targetMembers: [
      {
        id: '6',
        name: '刘伟',
        avatar: 'https://picsum.photos/id/237/200/200',
        hasVisitedAfter: true,
        visitTime: '2026-06-20 15:20:00'
      }
    ],
    message: '👋 Hi 刘伟，「组会汇报PPT模板.pptx」已经更新啦，麻烦抽时间看一下，有问题随时讨论～',
    status: 'completed'
  }
];

export const getReminderById = (id: string): ReminderRecord | undefined => {
  return mockReminders.find(r => r.id === id);
};
