import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { getStatusText, formatRelativeTime, TIME_RANGE_OPTIONS } from '@/utils';
import type { Member, VisitStatus, FileItem, TimeRange } from '@/types';

interface MemberWithStatus extends Member {
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  lastVisitTimeInRange?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
  daysSinceLastVisit: number;
}

const StatusPage: React.FC = () => {
  const files = useAppStore(state => state.files);
  const currentFileId = useAppStore(state => state.currentFileId);
  const setCurrentFile = useAppStore(state => state.setCurrentFile);
  const getFileById = useAppStore(state => state.getFileById);
  const getMembersByFileIdAndTimeRange = useAppStore(state => state.getMembersByFileIdAndTimeRange);

  const [filterStatus, setFilterStatus] = useState<VisitStatus | 'all'>('all');
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'leader' | 'member'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const currentFile = useMemo(() => {
    if (currentFileId) {
      return getFileById(currentFileId) || files[0];
    }
    return files[0];
  }, [currentFileId, files]);

  const loadData = () => {
    if (!currentFile) return;
    const memberData = getMembersByFileIdAndTimeRange(currentFile.id, timeRange) as MemberWithStatus[];
    setMembers(memberData);
  };

  useEffect(() => {
    loadData();
  }, [currentFile, timeRange]);

  useDidShow(() => {
    loadData();
  });

  const allGroups = useMemo(() => {
    const groups = new Set(members.map(m => m.group).filter(Boolean));
    return ['all', ...Array.from(groups).sort()];
  }, [members]);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(keyword));
    }
    if (roleFilter !== 'all') {
      result = result.filter(m => m.role === roleFilter);
    }
    if (groupFilter !== 'all') {
      result = result.filter(m => m.group === groupFilter);
    }
    if (filterStatus !== 'all') {
      result = result.filter(m => m.visitStatus === filterStatus);
    }
    return result;
  }, [members, searchText, roleFilter, groupFilter, filterStatus]);

  const statusStats = useMemo(() => {
    const baseMembers = members.filter(m => {
      if (searchText.trim()) {
        const keyword = searchText.trim().toLowerCase();
        if (!m.name.toLowerCase().includes(keyword)) return false;
      }
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (groupFilter !== 'all' && m.group !== groupFilter) return false;
      return true;
    });
    return {
      total: baseMembers.length,
      viewed: baseMembers.filter(m => m.visitStatus === 'viewed').length,
      previewed: baseMembers.filter(m => m.visitStatus === 'previewed').length,
      downloaded: baseMembers.filter(m => m.visitStatus === 'downloaded').length,
      unvisited: baseMembers.filter(m => m.visitStatus === 'unvisited').length
    };
  }, [members, searchText, roleFilter, groupFilter]);

  const unvisitedMembers = useMemo(() => {
    return filteredMembers.filter(m => m.visitStatus === 'unvisited');
  }, [filteredMembers]);

  const handleMemberClick = (memberId: string) => {
    if (!currentFile) return;
    Taro.navigateTo({
      url: `/pages/member-detail/index?id=${memberId}&fileId=${currentFile.id}`
    });
  };

  const handleFileSelect = (file: FileItem) => {
    setCurrentFile(file.id);
    setShowFilePicker(false);
    setFilterStatus('all');
    setSearchText('');
    setRoleFilter('all');
    setGroupFilter('all');
  };

  const handleRemind = () => {
    if (!currentFile) return;
    if (unvisitedMembers.length > 0) {
      const params = [`fileId=${currentFile.id}`, `timeRange=${timeRange}`];
      if (roleFilter !== 'all') params.push(`roleFilter=${roleFilter}`);
      if (groupFilter !== 'all') params.push(`groupFilter=${encodeURIComponent(groupFilter)}`);
      if (searchText.trim()) params.push(`searchText=${encodeURIComponent(searchText.trim())}`);
      Taro.navigateTo({
        url: `/pages/remind-create/index?${params.join('&')}`
      });
    } else {
      Taro.showToast({ title: '全员已查看，无需提醒', icon: 'none' });
    }
  };

  const renderMemberCard = (member: MemberWithStatus) => {
    const displayTime = timeRange !== 'all'
      ? (member.lastVisitTimeInRange ? formatRelativeTime(member.lastVisitTimeInRange) : '—')
      : (member.lastVisitTime ? formatRelativeTime(member.lastVisitTime) : '—');

    return (
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
          {displayTime}
        </Text>
      </View>
    );
  };

  const statusFilters: { key: VisitStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'viewed', label: '已查看' },
    { key: 'previewed', label: '仅预览' },
    { key: 'downloaded', label: '已下载' },
    { key: 'unvisited', label: '未访问' }
  ];

  if (!currentFile) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>查看状态</Text>
        <Text className={styles.subtitle}>实时掌握成员文件查看情况</Text>

        <View className={styles.fileSelector} onClick={() => setShowFilePicker(true)}>
          <View className={styles.fileSelectorTop}>
            <View className={styles.fileInfo}>
              <Text className={styles.fileLabel}>当前文件</Text>
              <Text className={styles.fileName}>{currentFile.name}</Text>
            </View>
            <Text className={styles.changeBtn}>切换 ›</Text>
          </View>
        </View>

        <View className={styles.timeFilter}>
          <ScrollView scrollX className={styles.timeFilterScroll}>
            {TIME_RANGE_OPTIONS.map(option => (
              <View
                key={option.key}
                className={classnames(styles.timeFilterItem, timeRange === option.key && styles.timeFilterActive)}
                onClick={() => setTimeRange(option.key)}
              >
                {option.label}
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.searchBar}>
          <Input
            className={styles.searchInput}
            placeholder="搜索成员姓名"
            value={searchText}
            onInput={e => setSearchText(e.detail.value)}
          />
          <View className={styles.filterRow}>
            <ScrollView scrollX className={styles.filterScroll}>
              <View
                className={classnames(styles.filterChip, roleFilter === 'all' && styles.filterChipActive)}
                onClick={() => setRoleFilter('all')}
              >
                全部角色
              </View>
              <View
                className={classnames(styles.filterChip, roleFilter === 'leader' && styles.filterChipActive)}
                onClick={() => setRoleFilter('leader')}
              >
                组长
              </View>
              <View
                className={classnames(styles.filterChip, roleFilter === 'member' && styles.filterChipActive)}
                onClick={() => setRoleFilter('member')}
              >
                组员
              </View>
              <View style={{ width: '16rpx', flexShrink: 0 }} />
              {allGroups.map(g => (
                <View
                  key={g}
                  className={classnames(styles.filterChip, groupFilter === g && styles.filterChipActive)}
                  onClick={() => setGroupFilter(g)}
                >
                  {g === 'all' ? '全部小组' : g}
                </View>
              ))}
            </ScrollView>
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
            <Text className={styles.sectionCount}>
              {filteredMembers.length} 人{timeRange !== 'all' && ` · ${TIME_RANGE_OPTIONS.find(o => o.key === timeRange)?.label}`}
            </Text>
          </View>

          <View className={styles.memberGrid}>
            {filteredMembers.length > 0 ? (
              filteredMembers.map(renderMemberCard)
            ) : (
              <View style={{
                gridColumn: 'span 4',
                padding: '60rpx 0',
                textAlign: 'center'
              }}>
                <Text style={{ fontSize: '60rpx', opacity: 0.5 }}>📭</Text>
                <Text style={{ fontSize: '28rpx', color: '#86909C', marginTop: '16rpx' }}>
                  暂无该状态的成员
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {showFilePicker && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end'
          }}
          onClick={() => setShowFilePicker(false)}
        >
          <View
            style={{
              width: '100%',
              maxHeight: '70vh',
              backgroundColor: '#fff',
              borderTopLeftRadius: '24rpx',
              borderTopRightRadius: '24rpx',
              padding: '32rpx'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <View style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24rpx'
            }}>
              <Text style={{ fontSize: '32rpx', fontWeight: '600', color: '#1D2129' }}>
                选择文件
              </Text>
              <Text
                style={{ fontSize: '28rpx', color: '#86909C' }}
                onClick={() => setShowFilePicker(false)}
              >
                关闭
              </Text>
            </View>
            <ScrollView scrollY style={{ maxHeight: '60vh' }}>
              {files.map(file => (
                <View
                  key={file.id}
                  style={{
                    padding: '24rpx',
                    borderRadius: '16rpx',
                    marginBottom: '12rpx',
                    backgroundColor: currentFile.id === file.id
                      ? 'rgba(39, 194, 139, 0.1)'
                      : '#F7F9FC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => handleFileSelect(file)}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: '28rpx',
                        fontWeight: currentFile.id === file.id ? '600' : '500',
                        color: currentFile.id === file.id ? '#27C28B' : '#1D2129',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {file.name}
                    </Text>
                    <Text style={{ fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>
                      {file.unvisitedCount > 0
                        ? `还有 ${file.unvisitedCount} 人未看`
                        : '全员已查看'
                      }
                    </Text>
                  </View>
                  {currentFile.id === file.id && (
                    <Text style={{ fontSize: '32rpx', color: '#27C28B', marginLeft: '16rpx' }}>✓</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default StatusPage;
