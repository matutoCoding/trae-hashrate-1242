import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: number;
  total: number;
  color: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, total, color, icon }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <View className={styles.card} style={{ borderTopColor: color }}>
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        {icon && <View className={styles.icon}>{icon}</View>}
      </View>
      <View className={styles.valueRow}>
        <Text className={styles.value} style={{ color }}>{value}</Text>
        <Text className={styles.total}> / {total}</Text>
      </View>
      <View className={styles.progressBar}>
        <View
          className={styles.progressFill}
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </View>
      <Text className={styles.percentage} style={{ color }}>{percentage}%</Text>
    </View>
  );
};

export default StatCard;
