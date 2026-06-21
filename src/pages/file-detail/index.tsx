import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { getFileTypeText, getFileTypeColor, formatTime, formatRelativeTime } from '@/utils';
import type { FileItem, VisitLog, Member, VisitStatus } from '@/types';

interface MemberWithStatus extends Member {
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
}

const FileDetailPage: React.FC = () => {
  const router = useRouter();
  const fileId = router.params.id || 'file1';

  const getFileById = useAppStore(state => state.getFileById);
  const getMembersByFileId = useAppStore(state => state.getMembersByFileId);
  const getVisitLogsByFileId = useAppStore(state => state.getVisitLogsByFileId);
  const setCurrentFile = useAppStore(state => state.setCurrentFile);

  const [file, setFile] = useState<FileItem | null>(null);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);

  const loadData = () => {
    const fileData = getFileById(fileId);
    if (fileData) {
      setFile(fileData);
      setCurrentFile(fileId);
      const memberData = getMembersByFileId(fileId) as MemberWithStatus[];
      setMembers(memberData);
      const logs = getVisitLogsByFileId(fileId);
      setVisitLogs(logs);
      console.log('[FileDetail] 加载数据:', { fileId, file: fileData.name, memberCount: memberData.length, logCount: logs.length });
    } else {
      console.error('[FileDetail] 文件不存在:', fileId);
    }
  };

  useEffect(() => {
    loadData();
  }, [fileId]);

  useDidShow(() => {
    loadData();
  });

  const handleRemind = () => {
    if (file && file.unvisitedCount > 0) {
      Taro.navigateTo({
        url: `/pages/remind-create/index?fileId=${fileId}`
      });
    } else {
      Taro.showToast({ title: '全员已查看，无需提醒', icon: 'none' });
    }
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

  // 按状态分组
  const groupedMembers = useMemo(() => {
    const groups: Record<VisitStatus, MemberWithStatus[]> = {
      viewed: [],
      previewed: [],
      downloaded: [],
      unvisited: []
    };
    members.forEach(m => {
      groups[m.visitStatus].push(m);
    });
    return groups;
  }, [members]);

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
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>共 {members.length} 人</Text>
          </View>

          {/* 已查看 */}
          {groupedMembers.viewed.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#00B42A', fontWeight: '500', marginBottom: '12rpx' }}>
                已查看 ({groupedMembers.viewed.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.viewed.map(member => (
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
          )}

          {/* 仅预览 */}
          {groupedMembers.previewed.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#FF7D00', fontWeight: '500', marginBottom: '12rpx' }}>
                仅预览 ({groupedMembers.previewed.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.previewed.map(member => (
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
          )}

          {/* 已下载 */}
          {groupedMembers.downloaded.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#3370FF', fontWeight: '500', marginBottom: '12rpx' }}>
                已下载 ({groupedMembers.downloaded.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.downloaded.map(member => (
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
          )}

          {/* 未访问 */}
          {groupedMembers.unvisited.length > 0 && (
            <View>
              <Text style={{ fontSize: '26rpx', color: '#F53F3F', fontWeight: '500', marginBottom: '12rpx' }}>
                未访问 ({groupedMembers.unvisited.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.unvisited.map(member => (
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
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最近访问</Text>
          </View>
          <View className={styles.logList}>
            {visitLogs.length > 0 ? (
              visitLogs.map(log => (
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
              ))
            ) : (
              <View style={{ padding: '48rpx 0', textAlign: 'center' }}>
                <Text style={{ fontSize: '60rpx', opacity: 0.5 }}>📭</Text>
                <Text style={{ fontSize: '28rpx', color: '#86909C', marginTop: '16rpx' }}>
                  暂无访问记录
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.secondary)} onClick={handleRemind}>
          催一下 {file.unvisitedCount > 0 && `(${file.unvisitedCount})`}
        </View>
        <View className={classnames(styles.btn, styles.primary)} onClick={() => {}}>
          查看文件
        </View>
      </View>
    </View>
  );
};

export default FileDetailPage;
