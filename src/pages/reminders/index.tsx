import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import ReminderCard from '@/components/ReminderCard';
import type { ReminderRecord } from '@/types';

const RemindersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'partial'>('all');

  // 从 store 中获取提醒记录（自动从 localStorage 恢复）
  const reminders = useAppStore(state => state.reminders);

  // 每次页面显示时刷新（确保发送提醒后返回能看到最新数据）
  useDidShow(() => {
    console.log('[RemindersPage] 页面显示，当前提醒数:', reminders.length);
  });

  // 计算统计数据
  const stats = useMemo(() => ({
    total: reminders.length,
    completed: reminders.filter(r => r.status === 'completed').length,
    pending: reminders.filter(r => r.status === 'pending' || r.status === 'partial').length
  }), [reminders]);

  // 过滤提醒记录
  const filteredReminders: ReminderRecord[] = useMemo(() => {
    if (filterStatus === 'all') {
      return reminders;
    }
    return reminders.filter(r => r.status === filterStatus);
  }, [reminders, filterStatus]);

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
              <ReminderCard key={reminder.id} reminder={reminder} />
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
