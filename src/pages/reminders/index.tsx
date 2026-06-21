import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import ReminderCard from '@/components/ReminderCard';
import { formatRelativeTime } from '@/utils';
import type { ReminderRecord } from '@/types';

const RemindersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'partial'>('all');
  const [summaryBy, setSummaryBy] = useState<'file' | 'member'>('file');

  const reminders = useAppStore(state => state.reminders);
  const getVisitLogsByFileId = useAppStore(state => state.getVisitLogsByFileId);
  const allMembers = useAppStore(state => state.allMembers);
  const getFileById = useAppStore(state => state.getFileById);

  useDidShow(() => {});

  const stats = useMemo(() => ({
    total: reminders.length,
    completed: reminders.filter(r => r.status === 'completed').length,
    pending: reminders.filter(r => r.status === 'pending' || r.status === 'partial').length
  }), [reminders]);

  const filteredReminders: ReminderRecord[] = useMemo(() => {
    if (filterStatus === 'all') return reminders;
    return reminders.filter(r => r.status === filterStatus);
  }, [reminders, filterStatus]);

  // 按文件汇总
  const fileSummary = useMemo(() => {
    const map: Record<string, { fileName: string; count: number; followedCount: number; totalTargets: number; avgFollowHours: number }> = {};
    reminders.forEach(r => {
      if (!map[r.fileId]) {
        map[r.fileId] = { fileName: r.fileName, count: 0, followedCount: 0, totalTargets: 0, avgFollowHours: 0 };
      }
      map[r.fileId].count++;
      map[r.fileId].totalTargets += r.targetMembers.length;

      const reminderTime = new Date(r.createTime).getTime();
      const fileLogs = getVisitLogsByFileId(r.fileId);

      r.targetMembers.forEach(m => {
        const followUpLogs = fileLogs.filter(
          log => log.memberId === m.id && new Date(log.time).getTime() > reminderTime && (log.action === 'view' || log.action === 'download')
        );
        if (followUpLogs.length > 0) {
          map[r.fileId].followedCount++;
          const firstFollow = followUpLogs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())[0];
          const hoursDiff = (new Date(firstFollow.time).getTime() - reminderTime) / (1000 * 60 * 60);
          map[r.fileId].avgFollowHours += hoursDiff;
        }
      });
    });

    return Object.entries(map).map(([fileId, data]) => ({
      fileId,
      ...data,
      avgFollowHours: data.followedCount > 0 ? Math.round((data.avgFollowHours / data.followedCount) * 10) / 10 : 0,
      followUpRate: data.totalTargets > 0 ? Math.round((data.followedCount / data.totalTargets) * 100) : 0
    }));
  }, [reminders]);

  // 按成员汇总
  const memberSummary = useMemo(() => {
    const map: Record<string, { memberId: string; memberName: string; memberAvatar: string; remindCount: number; followCount: number }> = {};

    reminders.forEach(r => {
      const reminderTime = new Date(r.createTime).getTime();
      const fileLogs = getVisitLogsByFileId(r.fileId);

      r.targetMembers.forEach(m => {
        if (!map[m.id]) {
          map[m.id] = { memberId: m.id, memberName: m.name, memberAvatar: m.avatar, remindCount: 0, followCount: 0 };
        }
        map[m.id].remindCount++;
        const hasFollow = fileLogs.some(
          log => log.memberId === m.id && new Date(log.time).getTime() > reminderTime && (log.action === 'view' || log.action === 'download')
        );
        if (hasFollow) map[m.id].followCount++;
      });
    });

    return Object.values(map).sort((a, b) => b.remindCount - a.remindCount);
  }, [reminders]);

  const handleMemberClick = (memberId: string) => {
    Taro.navigateTo({
      url: `/pages/member-reminders/index?memberId=${memberId}`
    });
  };

  const filters = [
    { key: 'all' as const, label: '全部' },
    { key: 'pending' as const, label: '待查看' },
    { key: 'partial' as const, label: '部分完成' },
    { key: 'completed' as const, label: '已完成' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>提醒记录</Text>
        <Text className={styles.subtitle}>追踪每次催看的效果</Text>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNumber, styles.total)}>{stats.total}</Text>
          <Text className={styles.statLabel}>总提醒</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNumber, styles.completed)}>{stats.completed}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNumber, styles.pending)}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待查看</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>效果汇总</Text>
        </View>
        <View className={styles.summaryTabs}>
          <View
            className={classnames(styles.summaryTab, summaryBy === 'file' && styles.summaryTabActive)}
            onClick={() => setSummaryBy('file')}
          >
            按文件
          </View>
          <View
            className={classnames(styles.summaryTab, summaryBy === 'member' && styles.summaryTabActive)}
            onClick={() => setSummaryBy('member')}
          >
            按成员
          </View>
        </View>

        {summaryBy === 'file' ? (
          <View className={styles.summaryList}>
            {fileSummary.length > 0 ? fileSummary.map(item => (
              <View key={item.fileId} className={styles.summaryCard}>
                <Text className={styles.summaryFileName}>{item.fileName}</Text>
                <View className={styles.summaryStats}>
                  <View className={styles.summaryStatItem}>
                    <Text className={styles.summaryStatValue}>{item.count}</Text>
                    <Text className={styles.summaryStatLabel}>催看次数</Text>
                  </View>
                  <View className={styles.summaryStatItem}>
                    <Text className={styles.summaryStatValue} style={{ color: item.followUpRate >= 80 ? '#00B42A' : item.followUpRate >= 50 ? '#FF7D00' : '#F53F3F' }}>
                      {item.followUpRate}%
                    </Text>
                    <Text className={styles.summaryStatLabel}>跟进率</Text>
                  </View>
                  <View className={styles.summaryStatItem}>
                    <Text className={styles.summaryStatValue}>
                      {item.avgFollowHours > 0 ? `${item.avgFollowHours}h` : '—'}
                    </Text>
                    <Text className={styles.summaryStatLabel}>平均跟进</Text>
                  </View>
                </View>
              </View>
            )) : (
              <View className={styles.emptySummary}>
                <Text style={{ fontSize: '28rpx', color: '#86909C' }}>暂无数据</Text>
              </View>
            )}
          </View>
        ) : (
          <View className={styles.summaryList}>
            {memberSummary.length > 0 ? memberSummary.map(item => (
              <View key={item.memberId} className={styles.memberSummaryCard} onClick={() => handleMemberClick(item.memberId)}>
                <Image className={styles.memberSummaryAvatar} src={item.memberAvatar} mode="aspectFill" />
                <View className={styles.memberSummaryInfo}>
                  <Text className={styles.memberSummaryName}>{item.memberName}</Text>
                  <Text className={styles.memberSummaryStats}>
                    被提醒 {item.remindCount} 次 · 已跟进 {item.followCount} 次
                  </Text>
                </View>
                <Text style={{ fontSize: '28rpx', color: '#86909C' }}>›</Text>
              </View>
            )) : (
              <View className={styles.emptySummary}>
                <Text style={{ fontSize: '28rpx', color: '#86909C' }}>暂无数据</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView scrollX className={styles.filterTabs}>
        {filters.map(filter => (
          <View
            key={filter.key}
            className={classnames(styles.filterTab, filterStatus === filter.key && styles.active)}
            onClick={() => setFilterStatus(filter.key)}
          >
            {filter.label}
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY>
        <View className={styles.list}>
          {filteredReminders.length > 0 ? (
            filteredReminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onClick={() => {
                  Taro.navigateTo({
                    url: `/pages/reminder-detail/index?id=${reminder.id}`
                  });
                }}
              />
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyTitle}>暂无提醒记录</Text>
              <Text className={styles.emptyDesc}>去文件页面选择文件，给未访问的同学发送提醒吧～</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default RemindersPage;
