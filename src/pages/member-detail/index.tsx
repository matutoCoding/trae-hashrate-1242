import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { getStatusText, getStatusColor, formatTime } from '@/utils';
import type { Member, VisitLog, FileItem, VisitStatus } from '@/types';

interface MemberWithStatus extends Member {
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
}

const MemberDetailPage: React.FC = () => {
  const router = useRouter();
  const memberId = router.params.id || '1';
  const fileId = router.params.fileId || null;

  const getFileById = useAppStore(state => state.getFileById);
  const getMembersByFileId = useAppStore(state => state.getMembersByFileId);
  const getVisitLogsByFileAndMember = useAppStore(state => state.getVisitLogsByFileAndMember);
  const allMembers = useAppStore(state => state.allMembers);

  const [member, setMember] = useState<MemberWithStatus | null>(null);
  const [file, setFile] = useState<FileItem | null>(null);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);

  const loadData = () => {
    // 先获取基础成员信息
    const baseMember = allMembers.find(m => m.id === memberId);

    if (fileId) {
      // 有 fileId 时，获取该文件下的成员状态和访问记录
      const fileData = getFileById(fileId);
      if (fileData) {
        setFile(fileData);
      }

      const membersForFile = getMembersByFileId(fileId) as MemberWithStatus[];
      const memberForFile = membersForFile.find(m => m.id === memberId);

      if (memberForFile) {
        setMember(memberForFile);
      } else if (baseMember) {
        // 如果在该文件中没有找到成员数据，使用基础信息并标记为未访问
        setMember({
          ...baseMember,
          visitStatus: 'unvisited',
          visitCount: 0,
          previewCount: 0,
          downloadCount: 0,
          lastVisitTime: undefined
        });
      }

      // 只获取该文件下该成员的访问记录
      const logs = getVisitLogsByFileAndMember(fileId, memberId);
      setVisitLogs(logs);

      console.log('[MemberDetail] 按文件加载:', {
        fileId,
        fileName: fileData?.name,
        memberId,
        memberName: memberForFile?.name,
        logCount: logs.length
      });
    } else {
      // 没有 fileId 时，使用全局成员信息
      if (baseMember) {
        setMember(baseMember as MemberWithStatus);
      }
      // 不显示访问记录或显示所有文件的记录
      setVisitLogs([]);

      console.log('[MemberDetail] 无 fileId，使用全局数据:', { memberId });
    }
  };

  useEffect(() => {
    loadData();
  }, [memberId, fileId]);

  useDidShow(() => {
    loadData();
  });

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      view: '查看文件',
      preview: '预览文件',
      download: '下载文件'
    };
    return map[action] || action;
  };

  // 计算各类型操作次数
  const actionCounts = useMemo(() => {
    const counts = {
      view: 0,
      preview: 0,
      download: 0
    };
    visitLogs.forEach(log => {
      if (log.action === 'view') counts.view++;
      else if (log.action === 'preview') counts.preview++;
      else if (log.action === 'download') counts.download++;
    });
    return counts;
  }, [visitLogs]);

  if (!member) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(member.visitStatus);
  const statusText = getStatusText(member.visitStatus);

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.memberHeader}>
          <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
          <Text className={styles.name}>{member.name}</Text>
          <View>
            <Text className={styles.role}>
              {member.role === 'leader' ? '组长' : '成员'}
            </Text>
          </View>
          <View className={styles.statusSection}>
            <View
              className={styles.statusBadge}
              style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
            >
              {statusText}
            </View>
          </View>
        </View>

        {/* 如果是从某个文件进来的，显示文件信息 */}
        {file && (
          <View style={{
            margin: '-30rpx 32rpx 24rpx',
            background: '#fff',
            borderRadius: '16rpx',
            padding: '24rpx',
            boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)'
          }}>
            <Text style={{ fontSize: '24rpx', color: '#86909C' }}>当前文件</Text>
            <Text
              style={{
                display: 'block',
                fontSize: '28rpx',
                fontWeight: '500',
                color: '#1D2129',
                marginTop: '8rpx',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {file.name}
            </Text>
          </View>
        )}

        <View className={styles.statsSection}>
          <Text className={styles.statsTitle}>
            访问统计
            {file && <Text style={{ color: '#86909C', fontSize: '24rpx', marginLeft: '8rpx' }}>（当前文件）</Text>}
          </Text>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNumber, styles.view)}>
                {fileId ? member.visitCount : actionCounts.view}
              </Text>
              <Text className={styles.statLabel}>查看次数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNumber, styles.preview)}>
                {fileId ? member.previewCount : actionCounts.preview}
              </Text>
              <Text className={styles.statLabel}>预览次数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNumber, styles.download)}>
                {fileId ? member.downloadCount : actionCounts.download}
              </Text>
              <Text className={styles.statLabel}>下载次数</Text>
            </View>
          </View>

          {member.lastVisitTime && (
            <View style={{
              marginTop: '24rpx',
              padding: '16rpx 24rpx',
              background: '#F7F9FC',
              borderRadius: '12rpx',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{ fontSize: '26rpx', color: '#86909C' }}>最近访问时间</Text>
              <Text style={{ fontSize: '26rpx', fontWeight: '500', color: '#1D2129' }}>
                {formatTime(member.lastVisitTime)}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            访问明细
            {file && <Text style={{ color: '#86909C', fontSize: '24rpx', marginLeft: '8rpx' }}>（仅当前文件）</Text>}
          </Text>
          {visitLogs.length > 0 ? (
            <View className={styles.timeline}>
              {visitLogs.map(log => (
                <View key={log.id} className={styles.timelineItem}>
                  <View className={classnames(styles.timelineDot, styles[log.action])} />
                  <View className={styles.timelineContent}>
                    <Text className={styles.timelineAction}>{getActionText(log.action)}</Text>
                    <Text className={styles.timelineTime}>{formatTime(log.time)}</Text>
                  </View>
                  {log.duration && (
                    <Text className={styles.timelineDuration}>
                      {Math.floor(log.duration / 60)}分{log.duration % 60}秒
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>
                {file ? '该成员尚未访问这份文件' : '暂无访问记录'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MemberDetailPage;
