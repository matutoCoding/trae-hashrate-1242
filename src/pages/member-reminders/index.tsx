import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { formatTime, formatRelativeTime } from '@/utils';

interface ReminderRecordForMember {
  reminderId: string;
  fileName: string;
  fileId: string;
  reminderTime: string;
  hasFollowed: boolean;
  followAction?: string;
  followTime?: string;
}

const MemberRemindersPage: React.FC = () => {
  const router = useRouter();
  const memberId = router.params.memberId || '';

  const reminders = useAppStore(state => state.reminders);
  const getVisitLogsByFileId = useAppStore(state => state.getVisitLogsByFileId);
  const allMembers = useAppStore(state => state.allMembers);

  const member = useMemo(() => {
    return allMembers.find(m => m.id === memberId);
  }, [memberId, allMembers]);

  const memberReminders = useMemo((): ReminderRecordForMember[] => {
    const records: ReminderRecordForMember[] = [];

    reminders.forEach(r => {
      const targetMember = r.targetMembers.find(m => m.id === memberId);
      if (!targetMember) return;

      const reminderTime = new Date(r.createTime).getTime();
      const fileLogs = getVisitLogsByFileId(r.fileId);
      const followUpLogs = fileLogs.filter(
        log => log.memberId === memberId && new Date(log.time).getTime() > reminderTime
      );

      const viewOrDownload = followUpLogs.filter(
        log => log.action === 'view' || log.action === 'download'
      );

      let hasFollowed = false;
      let followAction: string | undefined;
      let followTime: string | undefined;

      if (viewOrDownload.length > 0) {
        hasFollowed = true;
        const first = viewOrDownload.sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        )[0];
        followAction = first.action;
        followTime = first.time;
      } else if (followUpLogs.length > 0) {
        const first = followUpLogs.sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        )[0];
        followAction = first.action;
        followTime = first.time;
      }

      records.push({
        reminderId: r.id,
        fileName: r.fileName,
        fileId: r.fileId,
        reminderTime: r.createTime,
        hasFollowed,
        followAction,
        followTime
      });
    });

    return records.sort(
      (a, b) => new Date(b.reminderTime).getTime() - new Date(a.reminderTime).getTime()
    );
  }, [memberId, reminders]);

  const stats = useMemo(() => ({
    total: memberReminders.length,
    followed: memberReminders.filter(r => r.hasFollowed).length,
    pending: memberReminders.filter(r => !r.hasFollowed).length
  }), [memberReminders]);

  const getActionText = (action?: string) => {
    if (!action) return '—';
    const map: Record<string, string> = { view: '查看', preview: '预览', download: '下载' };
    return map[action] || action;
  };

  const getActionColor = (action?: string) => {
    if (!action) return '#86909C';
    const map: Record<string, string> = { view: '#00B42A', preview: '#FF7D00', download: '#3370FF' };
    return map[action] || '#86909C';
  };

  const handleRecordClick = (record: ReminderRecordForMember) => {
    Taro.navigateTo({
      url: `/pages/reminder-detail/index?id=${record.reminderId}`
    });
  };

  if (!member) {
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
          <View className={styles.memberInfo}>
            <Image className={styles.memberAvatar} src={member.avatar} mode="aspectFill" />
            <View className={styles.memberDetail}>
              <Text className={styles.memberName}>{member.name}</Text>
              <Text className={styles.memberGroup}>{member.group} · {member.role === 'leader' ? '组长' : '组员'}</Text>
            </View>
          </View>

          <View className={styles.statsRow}>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.total)}>{stats.total}</Text>
              <Text className={styles.statLabel}>被提醒</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.followed)}>{stats.followed}</Text>
              <Text className={styles.statLabel}>已跟进</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={classnames(styles.statNumber, styles.pending)}>{stats.pending}</Text>
              <Text className={styles.statLabel}>待跟进</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>提醒历史</Text>
          <View className={styles.recordList}>
            {memberReminders.length > 0 ? memberReminders.map(record => (
              <View
                key={record.reminderId}
                className={styles.recordCard}
                onClick={() => handleRecordClick(record)}
              >
                <View className={styles.recordTop}>
                  <Text className={styles.recordFileName}>{record.fileName}</Text>
                  <Text className={styles.recordTime}>{formatRelativeTime(record.reminderTime)}</Text>
                </View>
                <View className={styles.recordFollowInfo}>
                  {record.hasFollowed ? (
                    <View className={classnames(styles.followBadge, styles.followed)}>已跟进</View>
                  ) : (
                    <View className={classnames(styles.followBadge, styles.pending)}>待跟进</View>
                  )}
                  {record.followAction && (
                    <Text className={styles.followAction}>
                      首次操作：
                      <Text className={styles.actionType} style={{ color: getActionColor(record.followAction) }}>
                        {getActionText(record.followAction)}
                      </Text>
                      {record.followTime && (
                        <Text> · {formatTime(record.followTime)}</Text>
                      )}
                    </Text>
                  )}
                </View>
              </View>
            )) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📭</Text>
                <Text className={styles.emptyText}>暂无提醒记录</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MemberRemindersPage;
