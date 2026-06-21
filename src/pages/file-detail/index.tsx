import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { getFileTypeText, getFileTypeColor, formatTime, formatRelativeTime, TIME_RANGE_OPTIONS, getStatusText } from '@/utils';
import type { FileItem, VisitLog, Member, VisitStatus, TimeRange } from '@/types';

interface MemberWithStatus extends Member {
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  lastVisitTimeInRange?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
  daysSinceLastVisit: number;
}

const FileDetailPage: React.FC = () => {
  const router = useRouter();
  const fileId = router.params.id || 'file1';

  const getFileById = useAppStore(state => state.getFileById);
  const getMembersByFileIdAndTimeRange = useAppStore(state => state.getMembersByFileIdAndTimeRange);
  const getVisitLogsByFileIdAndTimeRange = useAppStore(state => state.getVisitLogsByFileIdAndTimeRange);
  const setCurrentFile = useAppStore(state => state.setCurrentFile);

  const [file, setFile] = useState<FileItem | null>(null);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'leader' | 'member'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const loadData = () => {
    const fileData = getFileById(fileId);
    if (fileData) {
      setFile(fileData);
      setCurrentFile(fileId);
      const memberData = getMembersByFileIdAndTimeRange(fileId, timeRange) as MemberWithStatus[];
      setMembers(memberData);
      const logs = getVisitLogsByFileIdAndTimeRange(fileId, timeRange);
      setVisitLogs(logs);
    }
  };

  useEffect(() => {
    loadData();
  }, [fileId, timeRange]);

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
    return result;
  }, [members, searchText, roleFilter, groupFilter]);

  const statsInRange = useMemo(() => ({
    viewed: filteredMembers.filter(m => m.visitStatus === 'viewed').length,
    previewed: filteredMembers.filter(m => m.visitStatus === 'previewed').length,
    downloaded: filteredMembers.filter(m => m.visitStatus === 'downloaded').length,
    unvisited: filteredMembers.filter(m => m.visitStatus === 'unvisited').length
  }), [filteredMembers]);

  const handleRemind = () => {
    if (statsInRange.unvisited > 0) {
      const params = [`fileId=${fileId}`, `timeRange=${timeRange}`];
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

  const handleMemberClick = (memberId: string) => {
    Taro.navigateTo({
      url: `/pages/member-detail/index?id=${memberId}&fileId=${fileId}`
    });
  };

  const handleExport = () => {
    const actionMap: Record<string, string> = { view: '查看', preview: '预览', download: '下载' };
    const statusMap: Record<string, string> = { viewed: '已查看', previewed: '仅预览', downloaded: '已下载', unvisited: '未访问' };
    const timeLabel = TIME_RANGE_OPTIONS.find(o => o.key === timeRange)?.label || '全部记录';

    let text = `📋 访问名单 - ${file?.name}\n`;
    text += `筛选口径：${timeLabel}`;
    if (roleFilter !== 'all') text += ` | 角色：${roleFilter === 'leader' ? '组长' : '组员'}`;
    if (groupFilter !== 'all') text += ` | 小组：${groupFilter}`;
    text += `\n━━━━━━━━━━━━━━\n`;
    text += `📊 统计：已查看${statsInRange.viewed} | 仅预览${statsInRange.previewed} | 已下载${statsInRange.downloaded} | 未访问${statsInRange.unvisited}\n`;
    text += `━━━━━━━━━━━━━━\n`;

    filteredMembers.forEach((m, i) => {
      const displayTime = timeRange !== 'all'
        ? (m.lastVisitTimeInRange || '—')
        : (m.lastVisitTime || '—');
      text += `${i + 1}. ${m.name}（${m.group}）| ${statusMap[m.visitStatus]} | 最近：${displayTime}\n`;
    });

    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = { view: '查看', preview: '预览', download: '下载' };
    return map[action] || action;
  };

  const groupedMembers = useMemo(() => {
    const groups: Record<VisitStatus, MemberWithStatus[]> = {
      viewed: [],
      previewed: [],
      downloaded: [],
      unvisited: []
    };
    filteredMembers.forEach(m => {
      groups[m.visitStatus].push(m);
    });
    return groups;
  }, [filteredMembers]);

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

          <View className={styles.statsSection}>
            <View className={styles.statsGrid}>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#00B42A' }}>{statsInRange.viewed}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>已查看</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#FF7D00' }}>{statsInRange.previewed}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>仅预览</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#3370FF' }}>{statsInRange.downloaded}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>已下载</Text>
              </View>
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#F53F3F' }}>{statsInRange.unvisited}</Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#86909C', marginTop: '4rpx' }}>未访问</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>成员状态</Text>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>共 {filteredMembers.length} 人{timeRange !== 'all' && ` · ${TIME_RANGE_OPTIONS.find(o => o.key === timeRange)?.label}`}</Text>
          </View>

          {groupedMembers.viewed.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#00B42A', fontWeight: '500', marginBottom: '12rpx' }}>
                已查看 ({groupedMembers.viewed.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.viewed.map(member => (
                  <View key={member.id} className={styles.memberItem} onClick={() => handleMemberClick(member.id)}>
                    <View className={styles.memberAvatarWrap}>
                      <Image className={styles.memberAvatar} src={member.avatar} mode="aspectFill" />
                      <View className={classnames(styles.statusDot, styles[member.visitStatus])} />
                    </View>
                    <Text className={styles.memberName}>{member.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {groupedMembers.previewed.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#FF7D00', fontWeight: '500', marginBottom: '12rpx' }}>
                仅预览 ({groupedMembers.previewed.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.previewed.map(member => (
                  <View key={member.id} className={styles.memberItem} onClick={() => handleMemberClick(member.id)}>
                    <View className={styles.memberAvatarWrap}>
                      <Image className={styles.memberAvatar} src={member.avatar} mode="aspectFill" />
                      <View className={classnames(styles.statusDot, styles[member.visitStatus])} />
                    </View>
                    <Text className={styles.memberName}>{member.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {groupedMembers.downloaded.length > 0 && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#3370FF', fontWeight: '500', marginBottom: '12rpx' }}>
                已下载 ({groupedMembers.downloaded.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.downloaded.map(member => (
                  <View key={member.id} className={styles.memberItem} onClick={() => handleMemberClick(member.id)}>
                    <View className={styles.memberAvatarWrap}>
                      <Image className={styles.memberAvatar} src={member.avatar} mode="aspectFill" />
                      <View className={classnames(styles.statusDot, styles[member.visitStatus])} />
                    </View>
                    <Text className={styles.memberName}>{member.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {groupedMembers.unvisited.length > 0 && (
            <View>
              <Text style={{ fontSize: '26rpx', color: '#F53F3F', fontWeight: '500', marginBottom: '12rpx' }}>
                未访问 ({groupedMembers.unvisited.length})
              </Text>
              <View className={styles.memberGrid}>
                {groupedMembers.unvisited.map(member => (
                  <View key={member.id} className={styles.memberItem} onClick={() => handleMemberClick(member.id)}>
                    <View className={styles.memberAvatarWrap}>
                      <Image className={styles.memberAvatar} src={member.avatar} mode="aspectFill" />
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
            {timeRange !== 'all' && <Text style={{ fontSize: '26rpx', color: '#86909C' }}>{TIME_RANGE_OPTIONS.find(o => o.key === timeRange)?.label}</Text>}
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
          催一下 {statsInRange.unvisited > 0 && `(${statsInRange.unvisited})`}
        </View>
        <View className={classnames(styles.btn, styles.exportBtn)} onClick={handleExport}>
          复制名单
        </View>
        <View className={classnames(styles.btn, styles.primary)} onClick={() => {}}>
          查看文件
        </View>
      </View>
    </View>
  );
};

export default FileDetailPage;
