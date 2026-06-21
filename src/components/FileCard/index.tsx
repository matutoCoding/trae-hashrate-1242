import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { getFileTypeColor, getFileTypeText, formatRelativeTime } from '@/utils';
import type { FileItem } from '@/types';

interface FileCardProps {
  file: FileItem;
  showStats?: boolean;
  onClick?: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, showStats = true, onClick }) => {
  const typeColor = getFileTypeColor(file.type);
  const typeText = getFileTypeText(file.type);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/file-detail/index?id=${file.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.iconWrap} style={{ backgroundColor: `${typeColor}15` }}>
        <Text className={styles.iconText} style={{ color: typeColor }}>{typeText}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.name}>{file.name}</Text>
        <View className={styles.meta}>
          <Text className={styles.size}>{file.size}</Text>
          <Text className={styles.dot}>·</Text>
          <Text className={styles.time}>{formatRelativeTime(file.updateTime)}更新</Text>
        </View>
        {showStats && (
          <View className={styles.stats}>
            <View className={styles.statItem}>
              <View className={styles.statDot} style={{ backgroundColor: '#00B42A' }} />
              <Text className={styles.statText}>已查看 {file.viewedCount}</Text>
            </View>
            <View className={styles.statItem}>
              <View className={styles.statDot} style={{ backgroundColor: '#FF7D00' }} />
              <Text className={styles.statText}>预览 {file.previewedCount}</Text>
            </View>
            <View className={styles.statItem}>
              <View className={styles.statDot} style={{ backgroundColor: '#F53F3F' }} />
              <Text className={styles.statText}>未看 {file.unvisitedCount}</Text>
            </View>
          </View>
        )}
      </View>
      <View className={styles.arrow}>
        <Text className={styles.arrowIcon}>›</Text>
      </View>
    </View>
  );
};

export default FileCard;
