import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { mockReminders } from '@/data/reminders';
import ReminderCard from '@/components/ReminderCard';
import type { ReminderRecord } from '@/types';

const RemindersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'partial'>('all');

  const stats = {
    total: mockReminders.length,
    completed: mockReminders.filter(r => r.status === 'completed').length,
    pending: mockReminders.filter(r => r.status === 'pending' || r.status === 'partial').length
  };

  const filteredReminders: ReminderRecord[] = filterStatus === 'all'
    ? mockReminders
    : mockReminders.filter(r => r.status === filterStatus);

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
