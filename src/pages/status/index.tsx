import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { mockMembers } from '@/data/members';
import { mockFiles } from '@/data/files';
import { getStatusText, getStatusColor, formatRelativeTime } from '@/utils';
import type { Member, VisitStatus, FileItem } from '@/types';

const StatusPage: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<FileItem>(mockFiles[0]);
  const [filterStatus, setFilterStatus] = useState<VisitStatus | 'all'>('all');

  const statusStats = {
    total: mockMembers.length,
    viewed: mockMembers.filter(m => m.visitStatus === 'viewed').length,
    previewed: mockMembers.filter(m => m.visitStatus === 'previewed').length,
    downloaded: mockMembers.filter(m => m.visitStatus === 'downloaded').length,
    unvisited: mockMembers.filter(m => m.visitStatus === 'unvisited').length
  };

  const filteredMembers = filterStatus === 'all'
    ? mockMembers
    : mockMembers.filter(m => m.visitStatus === filterStatus);

  const unvisitedMembers = mockMembers.filter(m => m.visitStatus === 'unvisited');

  const handleMemberClick = (memberId: string) => {
    Taro.navigateTo({
      url: `/pages/member-detail/index?id=${memberId}&fileId=${currentFile.id}`
    });
  };

  const handleFileSelect = () => {
    Taro.navigateTo({
      url: '/pages/files/index'
    });
  };

  const handleRemind = () => {
    Taro.navigateTo({
      url: `/pages/remind-create/index?fileId=${currentFile.id}`
    });
  };

  const renderMemberCard = (member: Member) => (
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
        <View className={classnames(styles.statusRing, styles[member.visitStatus])} />
      </View>
      <Text className={styles.memberName}>{member.name}</Text>
      <Text className={styles.memberTime}>
        {member.lastVisitTime ? formatRelativeTime(member.lastVisitTime) : '—'}
      </Text>
    </View>
  );

  const statusFilters: { key: VisitStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'viewed', label: '已查看' },
    { key: 'previewed', label: '仅预览' },
    { key: 'downloaded', label: '已下载' },
    { key: 'unvisited', label: '未访问' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>查看状态</Text>
        <Text className={styles.subtitle}>实时掌握成员文件查看情况</Text>

        <View className={styles.fileSelector} onClick={handleFileSelect}>
          <View className={styles.fileSelectorTop}>
            <View className={styles.fileInfo}>
              <Text className={styles.fileLabel}>当前文件</Text>
              <Text className={styles.fileName}>{currentFile.name}</Text>
            </View>
            <Text className={styles.changeBtn}>切换 ›</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNumber, styles.viewed)}>{statusStats.viewed}</Text>
          <Text className={styles.statLabel}>已查看</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNumber, styles.previewed)}>{statusStats.previewed}</Text>
          <Text className={styles.statLabel}>仅预览</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNumber, styles.downloaded)}>{statusStats.downloaded}</Text>
          <Text className={styles.statLabel}>已下载</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={classnames(styles.statNumber, styles.unvisited)}>{statusStats.unvisited}</Text>
          <Text className={styles.statLabel}>未访问</Text>
        </View>
      </View>

      <ScrollView scrollY>
        <View className={styles.section}>
          {unvisitedMembers.length > 0 && (
            <View className={styles.remindBanner}>
              <View className={styles.remindInfo}>
                <Text className={styles.remindTitle}>
                  还有 {unvisitedMembers.length} 位同学没看
                </Text>
                <Text className={styles.remindDesc}>一键发送提醒，催大家查看文件</Text>
              </View>
              <View className={styles.remindBtn} onClick={handleRemind}>
                去提醒
              </View>
            </View>
          )}

          <ScrollView scrollX className={styles.filterTabs}>
            {statusFilters.map(filter => (
              <View
                key={filter.key}
                className={classnames(styles.filterTab, filterStatus === filter.key && styles.active)}
                onClick={() => setFilterStatus(filter.key)}
              >
                {filter.label}
              </View>
            ))}
          </ScrollView>

          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {filterStatus === 'all' ? '全部成员' : getStatusText(filterStatus)}
            </Text>
            <Text className={styles.sectionCount}>{filteredMembers.length} 人</Text>
          </View>

          <View className={styles.memberGrid}>
            {filteredMembers.map(renderMemberCard)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StatusPage;
