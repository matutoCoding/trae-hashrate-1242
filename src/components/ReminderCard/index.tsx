import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { formatRelativeTime, getStatusText } from '@/utils';
import type { ReminderRecord } from '@/types';
import MemberAvatar from '@/components/MemberAvatar';

interface ReminderCardProps {
  reminder: ReminderRecord;
  onClick?: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onClick }) => {
  const visitedCount = reminder.targetMembers.filter(m => m.hasVisitedAfter).length;
  const totalCount = reminder.targetMembers.length;

  const getStatusInfo = () => {
    if (reminder.status === 'completed') {
      return { text: '已完成', color: '#00B42A', bg: '#E8FFEE' };
    } else if (reminder.status === 'partial') {
      return { text: '部分已看', color: '#FF7D00', bg: '#FFF3E8' };
    }
    return { text: '待查看', color: '#F53F3F', bg: '#FFECE8' };
  };

  const statusInfo = getStatusInfo();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/file-detail/index?id=${reminder.fileId}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
      <Text className={styles.fileName}>{reminder.fileName}</Text>
      <View
        className={styles.statusTag}
        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
      >
        {statusInfo.text}
      </View>
    </View>
    <View className={styles.timeRow}>
      <Text className={styles.timeText}>{formatRelativeTime(reminder.createTime)}发送提醒</Text>
      <Text className={styles.progressText}>{visitedCount}/{totalCount} 已查看</Text>
    </View>
    <View className={styles.avatars}>
      {reminder.targetMembers.slice(0, 5).map((member, index) => (
        <View
          key={member.id}
          className={styles.avatarItem}
          style={{ marginLeft: index > 0 ? '-16rpx' : 0 }}
        >
          <MemberAvatar avatar={member.avatar} size="sm" />
          {member.hasVisitedAfter && <View className={styles.checkedIcon}>
            <Text className={styles.checkedText}>✓</Text>
          </View>}
        </View>
      ))}
      {reminder.targetMembers.length > 5 && (
        <View className={styles.moreCount}>
        <Text className={styles.moreText}>+{reminder.targetMembers.length - 5}</Text>
      </View>
      )}
    </View>
    <View className={styles.messageBox}>
      <Text className={styles.messageText}>{reminder.message}</Text>
    </View>
    </View>
  );
};

export default ReminderCard;
