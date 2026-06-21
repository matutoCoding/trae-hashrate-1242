import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getStatusText, getStatusColor } from '@/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  const color = getStatusColor(status);
  const text = getStatusText(status);

  return (
    <View
      className={classnames(styles.badge, styles[size], className)}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`
      }}
    >
      <View className={styles.dot} style={{ backgroundColor: color }} />
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default StatusBadge;
