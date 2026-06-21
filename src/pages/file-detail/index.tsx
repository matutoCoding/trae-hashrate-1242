import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getFileById, getVisitLogsByFileId } from '@/data/files';
import { mockMembers } from '@/data/members';
import { getFileTypeText, getFileTypeColor, formatTime, formatRelativeTime } from '@/utils';
import type { FileItem, VisitLog } from '@/types';

const FileDetailPage: React.FC = () => {
  const router = useRouter();
  const fileId = router.params.id || 'file1';

  const [file, setFile] = useState<FileItem | null>(null);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);

  useEffect(() => {
    const fileData = getFileById(fileId);
    if (fileData) {
      setFile(fileData);
      const logs = getVisitLogsByFileId(fileId);
      setVisitLogs(logs);
    }
  }, [fileId]);

  const handleRemind = () => {
    Taro.navigateTo({
      url: `/pages/remind-create/index?fileId=${fileId}`
    });
  };

  const handleMemberClick = (memberId: string) => {
    Taro.navigateTo({
      url: `/pages/member-detail/index?id=${memberId}&fileId=${fileId}`
    });
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      view: '查看',
      preview: '预览',
      download: '下载'
    };
    return map[action] || action;
  };

  if (!file) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const typeText = getFileTypeText(file.type);
  const typeColor = getFileTypeColor(file.type);

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.fileHeader}>
          <View className={styles.fileInfo}>
            <View className={styles.fileIcon} style={{ backgroundColor: `${typeColor}20` }}>
              <Text className={styles.fileIconText} style={{ color: typeColor }}>{typeText}</Text>
            </View>
            <View className={styles.fileMain}>
              <Text className={styles.fileName}>{file.name}</Text>
              <View className={styles.fileMeta}>
                <Text className={styles.metaItem}>{file.size}</Text>
                <Text className={styles.metaItem}>·</Text>
                <Text className={styles.metaItem}>{formatRelativeTime(file.updateTime)}更新</Text>
              </View>
            </View>
          </View>

          <View className={styles.statsSection}>
            <View className={styles.statsGrid}>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#00B42A' }}>{file.viewedCount}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>已查看</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#FF7D00' }}>{file.previewedCount}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>仅预览</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#3370FF' }}>{file.downloadedCount}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>已下载</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#F53F3F' }}>{file.unvisitedCount}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>未访问</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>成员状态</Text>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>共 {mockMembers.length} 人</Text>
          </View>
          <View className={styles.memberGrid}>
            {mockMembers.map(member => (
              <View
                key={member.id}
                className={styles.memberItem}
                onClick={() => handleMemberClick(member.id)}
              >
                <View className={styles.memberAvatarWrap}>
                  <Image
                    className={styles.memberAvatar}
                    src={member.avatar}
                    mode="aspectFill"
                  />
                  <View className={classnames(styles.statusDot, styles[member.visitStatus])} />
                </View>
                <Text className={styles.memberName}>{member.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最近访问</Text>
          </View>
          <View className={styles.logList}>
            {visitLogs.map(log => (
              <View key={log.id} className={styles.logItem}>
                <Image className={styles.logAvatar} src={log.memberAvatar} mode="aspectFill" />
                <View className={styles.logInfo}>
                  <Text className={styles.logName}>{log.memberName}</Text>
                  <View className={styles.logAction}>
                    <Text className={classnames(styles.actionTag, styles[log.action])}>
                      {getActionText(log.action)}
                    </Text>
                    {log.duration && (
                      <Text style={{ fontSize: '24rpx', color: '#86909C' }}>
                        时长 {Math.floor(log.duration / 60)}分{log.duration % 60}秒
                      </Text>
                    )}
                  </View>
                </View>
                <Text className={styles.logTime}>{formatTime(log.time)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.secondary)} onClick={handleRemind}>
          催一下
        </View>
        <View className={classnames(styles.btn, styles.primary)} onClick={() => {}}>
          查看文件
        </View>
      </View>
    </View>
  );
};

export default FileDetailPage;
