import type { Member } from '@/types';

export const mockMembers: Member[] = [
  {
    id: '1',
    name: '张明',
    avatar: 'https://picsum.photos/id/64/200/200',
    role: 'leader',
    visitStatus: 'viewed',
    lastVisitTime: '2026-06-21 14:30:00',
    visitCount: 5,
    previewCount: 2,
    downloadCount: 1
  },
  {
    id: '2',
    name: '李华',
    avatar: 'https://picsum.photos/id/91/200/200',
    role: 'member',
    visitStatus: 'viewed',
    lastVisitTime: '2026-06-21 16:20:00',
    visitCount: 3,
    previewCount: 1,
    downloadCount: 0
  },
  {
    id: '3',
    name: '王芳',
    avatar: 'https://picsum.photos/id/177/200/200',
    role: 'member',
    visitStatus: 'previewed',
    lastVisitTime: '2026-06-20 10:15:00',
    visitCount: 2,
    previewCount: 2,
    downloadCount: 0
  },
  {
    id: '4',
    name: '赵强',
    avatar: 'https://picsum.photos/id/338/200/200',
    role: 'member',
    visitStatus: 'downloaded',
    lastVisitTime: '2026-06-21 09:00:00',
    visitCount: 1,
    previewCount: 0,
    downloadCount: 1
  },
  {
    id: '5',
    name: '陈雪',
    avatar: 'https://picsum.photos/id/1027/200/200',
    role: 'member',
    visitStatus: 'unvisited',
    lastVisitTime: undefined,
    visitCount: 0,
    previewCount: 0,
    downloadCount: 0
  },
  {
    id: '6',
    name: '刘伟',
    avatar: 'https://picsum.photos/id/237/200/200',
    role: 'member',
    visitStatus: 'unvisited',
    lastVisitTime: undefined,
    visitCount: 0,
    previewCount: 0,
    downloadCount: 0
  },
  {
    id: '7',
    name: '孙婷',
    avatar: 'https://picsum.photos/id/659/200/200',
    role: 'member',
    visitStatus: 'viewed',
    lastVisitTime: '2026-06-22 08:30:00',
    visitCount: 4,
    previewCount: 3,
    downloadCount: 2
  },
  {
    id: '8',
    name: '周杰',
    avatar: 'https://picsum.photos/id/718/200/200',
    role: 'member',
    visitStatus: 'previewed',
    lastVisitTime: '2026-06-21 20:45:00',
    visitCount: 2,
    previewCount: 2,
    downloadCount: 0
  }
];

export const getMemberById = (id: string): Member | undefined => {
  return mockMembers.find(m => m.id === id);
};

export const getMembersByStatus = (status: string): Member[] => {
  return mockMembers.filter(m => m.visitStatus === status);
};
