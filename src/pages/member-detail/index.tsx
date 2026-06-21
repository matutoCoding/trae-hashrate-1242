import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getMemberById } from '@/data/members';
import { getStatusText, getStatusColor, formatTime } from '@/utils';
import type { Member, VisitLog } from '@/types';
import { mockVisitLogs } from '@/data/files';

const MemberDetailPage: React.FC = () => {
  const router = useRouter();
  const memberId = router.params.id || '1';

  const [member, setMember] = useState<Member | null>(null);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);

  useEffect(() => {
    const memberData = getMemberById(memberId);
    if (memberData) {
      setMember(memberData);
      const memberLogs = mockVisitLogs.filter(log => log.memberId === memberId);
      setVisitLogs(memberLogs);
    }
  }, [memberId]);

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      view: '查看文件',
      preview: '预览文件',
      download: '下载文件'
    };
    return map[action] || action;
  };

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

        <View className={styles.statsSection}>
          <Text className={styles.statsTitle}>访问统计</Text>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNumber, styles.view)}>{member.visitCount}</Text>
              <Text className={styles.statLabel}>查看次数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNumber, styles.preview)}>{member.previewCount}</Text>
              <Text className={styles.statLabel}>预览次数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNumber, styles.download)}>{member.downloadCount}</Text>
              <Text className={styles.statLabel}>下载次数</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>最近访问</Text>
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
              <Text className={styles.emptyText}>暂无访问记录</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MemberDetailPage;
