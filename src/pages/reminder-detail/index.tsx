import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { formatTime, formatRelativeTime } from '@/utils';
import type { ReminderRecord, VisitLog } from '@/types';

type FollowUpStatus = 'followed' | 'previewed' | 'pending';

interface TargetMemberWithVisit {
  id: string;
  name: string;
  avatar: string;
  followUpStatus: FollowUpStatus;
  firstVisitAfter?: VisitLog;
  allVisitsAfter: VisitLog[];
}

const ReminderDetailPage: React.FC = () => {
  const router = useRouter();
  const reminderId = router.params.id || '';

  const getReminderById = useAppStore(state => state.getReminderById);
  const getVisitLogsByFileId = useAppStore(state => state.getVisitLogsByFileId);
  const getFileById = useAppStore(state => state.getFileById);

  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'followed' | 'pending'>('all');

  const loadData = () => {
    const reminderData = getReminderById(reminderId);
    if (reminderData) {
      setReminder(reminderData);
    } else {
      Taro.showToast({ title: '提醒不存在', icon: 'none' });
    }
  };

  useEffect(() => {
    loadData();
  }, [reminderId]);

  useDidShow(() => {
    loadData();
  });

  const targetMembersWithVisit = useMemo((): TargetMemberWithVisit[] => {
    if (!reminder) return [];

    const fileLogs = getVisitLogsByFileId(reminder.fileId);
    const reminderTime = new Date(reminder.createTime).getTime();

    return reminder.targetMembers.map(member => {
      const visitsAfter = fileLogs.filter(
        log => log.memberId === member.id && new Date(log.time).getTime() > reminderTime
      );

      const sortedVisits = [...visitsAfter].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      const firstVisitAfter = sortedVisits.length > 0 ? sortedVisits[0] : undefined;

      let followUpStatus: FollowUpStatus = 'pending';
      if (visitsAfter.some(v => v.action === 'view' || v.action === 'download')) {
        followUpStatus = 'followed';
      } else if (visitsAfter.some(v => v.action === 'preview')) {
        followUpStatus = 'previewed';
      }

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        followUpStatus,
        firstVisitAfter,
        allVisitsAfter: sortedVisits
      };
    });
  }, [reminder]);

  const stats = useMemo(() => {
    return {
      total: targetMembersWithVisit.length,
      followed: targetMembersWithVisit.filter(m => m.followUpStatus === 'followed').length,
      previewed: targetMembersWithVisit.filter(m => m.followUpStatus === 'previewed').length,
      pending: targetMembersWithVisit.filter(m => m.followUpStatus === 'pending').length
    };
  }, [targetMembersWithVisit]);

  const filteredMembers = useMemo(() => {
    if (filter === 'all') return targetMembersWithVisit;
    if (filter === 'followed') return targetMembersWithVisit.filter(m => m.followUpStatus === 'followed' || m.followUpStatus === 'previewed');
    return targetMembersWithVisit.filter(m => m.followUpStatus === 'pending');
  }, [targetMembersWithVisit, filter]);

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      view: '查看',
      preview: '预览',
      download: '下载'
    };
    return map[action] || action;
  };

  const getActionColor = (action: string) => {
    const map: Record<string, string> = {
      view: '#00B42A',
      preview: '#FF7D00',
      download: '#3370FF'
    };
    return map[action] || '#86909C';
  };

  const getFollowUpBadgeInfo = (status: FollowUpStatus) => {
    if (status === 'followed') return { text: '已跟进', color: '#00B42A', bg: '#E8FFEE' };
    if (status === 'previewed') return { text: '仅预览', color: '#FF7D00', bg: '#FFF3E8' };
    return { text: '待跟进', color: '#F53F3F', bg: '#FFECE8' };
  };

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

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.header}>
          <View className={styles.fileSection}>
            <Text className={styles.fileLabel}>提醒文件</Text>
            <Text className={styles.fileName}>{reminder.fileName}</Text>
            <Text className={styles.sendTime}>
              发送时间：{formatTime(reminder.createTime)}
            </Text>
          </View>

          <View className={styles.statsRow}>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.total)}>{stats.total}</Text>
              <Text className={styles.statLabel}>总人数</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.viewed)}>{stats.followed}</Text>
              <Text className={styles.statLabel}>已跟进</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.pending)}>{stats.pending + stats.previewed}</Text>
              <Text className={styles.statLabel}>待跟进</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>成员跟进</Text>
            <Text className={styles.sectionCount}>{filteredMembers.length} 人</Text>
          </View>

          <ScrollView scrollX className={styles.filterTabs}>
            <View
              className={classnames(styles.filterTab, filter === 'all' && styles.active)}
              onClick={() => setFilter('all')}
            >
              全部
            </View>
            <View
              className={classnames(styles.filterTab, filter === 'followed' && styles.active)}
              onClick={() => setFilter('followed')}
            >
              已跟进 ({stats.followed})
            </View>
            <View
              className={classnames(styles.filterTab, filter === 'pending' && styles.active)}
              onClick={() => setFilter('pending')}
            >
              待跟进 ({stats.pending + stats.previewed})
            </View>
          </ScrollView>

          <View className={styles.memberList}>
            {filteredMembers.length > 0 ? (
              filteredMembers.map(member => {
                const badgeInfo = getFollowUpBadgeInfo(member.followUpStatus);
                const firstAction = member.firstVisitAfter;

                return (
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
                          className={styles.statusBadge}
                          style={{ color: badgeInfo.color, backgroundColor: badgeInfo.bg }}
                        >
                          {badgeInfo.text}
                        </View>
                      </View>
                      {firstAction && (
                        <View className={styles.visitInfo}>
                          <Text>
                            首次操作：
                            <Text style={{ color: getActionColor(firstAction.action), fontWeight: 500 }}>
                              {getActionText(firstAction.action)}
                            </Text>
                            {' · '}
                            {formatTime(firstAction.time)}
                          </Text>
                        </View>
                      )}
                      {member.allVisitsAfter.length > 1 && (
                        <View className={styles.visitInfo}>
                          <Text style={{ color: '#86909C' }}>
                            共 {member.allVisitsAfter.length} 次操作
                            （{member.allVisitsAfter.filter(v => v.action === 'view').length}次查看
                            {member.allVisitsAfter.filter(v => v.action === 'download').length > 0 &&
                              `、${member.allVisitsAfter.filter(v => v.action === 'download').length}次下载`}
                            {member.allVisitsAfter.filter(v => v.action === 'preview').length > 0 &&
                              `、${member.allVisitsAfter.filter(v => v.action === 'preview').length}次预览`}
                            ）
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className={styles.visitTime}>
                      {firstAction
                        ? formatRelativeTime(firstAction.time)
                        : '—'}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📭</Text>
                <Text className={styles.emptyText}>暂无该状态的成员</Text>
              </View>
            )}
          </View>
        </View>

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
