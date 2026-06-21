import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { formatTime, formatRelativeTime, getStatusText } from '@/utils';
import type { ReminderRecord, VisitLog } from '@/types';

interface TargetMemberWithVisit {
  id: string;
  name: string;
  avatar: string;
  hasVisitedAfter: boolean;
  visitTime?: string;
  firstVisitAfter?: VisitLog;
}

const ReminderDetailPage: React.FC = () => {
  const router = useRouter();
  const reminderId = router.params.id || '';

  const getReminderById = useAppStore(state => state.getReminderById);
  const getVisitLogsByFileId = useAppStore(state => state.getVisitLogsByFileId);
  const getFileById = useAppStore(state => state.getFileById);

  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'viewed' | 'pending'>('all');

  // 加载数据
  const loadData = () => {
    const reminderData = getReminderById(reminderId);
    if (reminderData) {
      setReminder(reminderData);
      console.log('[ReminderDetail] 加载数据:', { reminderId, reminder: reminderData });
    } else {
      console.error('[ReminderDetail] 提醒不存在:', reminderId);
      Taro.showToast({ title: '提醒不存在', icon: 'none' });
    }
  };

  useEffect(() => {
    loadData();
  }, [reminderId]);

  useDidShow(() => {
    loadData();
  });

  // 统计数据
  const stats = useMemo(() => {
    if (!reminder) return { total: 0, viewed: 0, pending: 0 };
    return {
      total: reminder.targetMembers.length,
      viewed: reminder.targetMembers.filter(m => m.hasVisitedAfter).length,
      pending: reminder.targetMembers.filter(m => !m.hasVisitedAfter).length
    };
  }, [reminder]);

  // 获取成员在提醒发送后的首次访问记录
  const targetMembersWithVisit = useMemo((): TargetMemberWithVisit[] => {
    if (!reminder) return [];

    const fileLogs = getVisitLogsByFileId(reminder.fileId);
    const reminderTime = new Date(reminder.createTime).getTime();

    return reminder.targetMembers.map(member => {
      // 查找该成员在提醒发送后的访问记录
      const visitsAfter = fileLogs.filter(
        log => log.memberId === member.id && new Date(log.time).getTime() > reminderTime
      );

      const firstVisitAfter = visitsAfter.length > 0
        ? visitsAfter.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())[0]
        : undefined;

      return {
        ...member,
        firstVisitAfter
      };
    });
  }, [reminder]);

  // 过滤成员
  const filteredMembers = useMemo(() => {
    if (filter === 'all') return targetMembersWithVisit;
    if (filter === 'viewed') return targetMembersWithVisit.filter(m => m.hasVisitedAfter);
    return targetMembersWithVisit.filter(m => !m.hasVisitedAfter);
  }, [targetMembersWithVisit, filter]);

  // 获取访问类型文本
  const getVisitActionText = (action: string) => {
    const map: Record<string, string> = {
      view: '查看',
      preview: '预览',
      download: '下载'
    };
    return map[action] || action;
  };

  // 点击成员跳转到成员详情
  const handleMemberClick = (memberId: string) => {
    if (!reminder) return;
    Taro.navigateTo({
      url: `/pages/member-detail/index?id=${memberId}&fileId=${reminder.fileId}`
    });
  };

  if (!reminder) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const file = getFileById(reminder.fileId);

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        {/* 头部信息 */}
        <View className={styles.header}>
          <View className={styles.fileSection}>
            <Text className={styles.fileLabel}>提醒文件</Text>
            <Text className={styles.fileName}>{reminder.fileName}</Text>
            <Text className={styles.sendTime}>
              发送时间：{formatTime(reminder.createTime)}
            </Text>
          </View>

          {/* 统计卡片 */}
          <View className={styles.statsRow}>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.total)}>{stats.total}</Text>
              <Text className={styles.statLabel}>总人数</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.viewed)}>{stats.viewed}</Text>
              <Text className={styles.statLabel}>已查看</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.pending)}>{stats.pending}</Text>
              <Text className={styles.statLabel}>待查看</Text>
            </View>
          </View>
        </View>

        {/* 成员跟进列表 */}
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>成员跟进</Text>
            <Text className={styles.sectionCount}>{filteredMembers.length} 人</Text>
          </View>

          {/* 筛选标签 */}
          <ScrollView scrollX className={styles.filterTabs}>
            <View
              className={classnames(styles.filterTab, filter === 'all' && styles.active)}
              onClick={() => setFilter('all')}
            >
              全部
            </View>
            <View
              className={classnames(styles.filterTab, filter === 'viewed' && styles.active)}
              onClick={() => setFilter('viewed')}
            >
              已查看 ({stats.viewed})
            </View>
            <View
              className={classnames(styles.filterTab, filter === 'pending' && styles.active)}
              onClick={() => setFilter('pending')}
            >
              待查看 ({stats.pending})
            </View>
          </ScrollView>

          {/* 成员列表 */}
          <View className={styles.memberList}>
            {filteredMembers.length > 0 ? (
              filteredMembers.map(member => (
                <View
                  key={member.id}
                  className={styles.memberItem}
                  onClick={() => handleMemberClick(member.id)}
                >
                  <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
                  <View className={styles.memberInfo}>
                    <Text className={styles.memberName}>{member.name}</Text>
                    <View className={styles.memberStatus}>
                      <View
                        className={classnames(
                          styles.statusBadge,
                          member.hasVisitedAfter ? styles.viewed : styles.pending
                        )}
                      >
                        {member.hasVisitedAfter ? '已查看' : '待查看'}
                      </View>
                    </View>
                    {member.firstVisitAfter && (
                      <View className={styles.visitInfo}>
                        <Text>
                          首次操作：
                          <Text className={styles.visitAction}>
                            {getVisitActionText(member.firstVisitAfter.action)}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className={styles.visitTime}>
                    {member.firstVisitAfter
                      ? formatRelativeTime(member.firstVisitAfter.time)
                      : '—'}
                  </Text>
                </View>
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📭</Text>
                <Text className={styles.emptyText}>暂无该状态的成员</Text>
              </View>
            )}
          </View>
        </View>

        {/* 提醒文案 */}
        <View className={styles.messageSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>提醒文案</Text>
          </View>
          <View className={styles.messageBox}>
            <Text className={styles.messageLabel}>发送的文案</Text>
            <Text className={styles.messageText}>{reminder.message}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReminderDetailPage;
