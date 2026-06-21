import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import { generateReminderText, getStatusText } from '@/utils';
import type { FileItem, Member, VisitStatus } from '@/types';

interface MemberWithStatus extends Member {
  visitStatus: VisitStatus;
  lastVisitTime?: string;
  visitCount: number;
  previewCount: number;
  downloadCount: number;
}

const RemindCreatePage: React.FC = () => {
  const router = useRouter();
  const fileId = router.params.fileId || 'file1';

  const getFileById = useAppStore(state => state.getFileById);
  const getMembersByFileId = useAppStore(state => state.getMembersByFileId);
  const addReminder = useAppStore(state => state.addReminder);

  const [file, setFile] = useState<FileItem | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  // 只获取当前文件的未访问成员
  const unvisitedMembers = useMemo(() => {
    const allMembers = getMembersByFileId(fileId) as MemberWithStatus[];
    return allMembers.filter(m => m.visitStatus === 'unvisited');
  }, [fileId]);

  // 所有成员（用于显示已查看的信息）
  const allMembersForFile = useMemo(() => {
    return getMembersByFileId(fileId) as MemberWithStatus[];
  }, [fileId]);

  useEffect(() => {
    const fileData = getFileById(fileId);
    if (fileData) {
      setFile(fileData);

      // 默认选中所有未访问成员
      const defaultSelected = unvisitedMembers.map(m => m.id);
      setSelectedMemberIds(defaultSelected);

      // 生成默认文案
      if (unvisitedMembers.length > 0) {
        const memberNames = unvisitedMembers.map(m => m.name);
        setCustomMessage(generateReminderText(fileData.name, memberNames));
      }

      console.log('[RemindCreate] 加载数据:', {
        fileId,
        fileName: fileData.name,
        unvisitedCount: unvisitedMembers.length,
        allMembersCount: allMembersForFile.length
      });
    }
  }, [fileId]);

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAll = () => {
    // 全选/取消全选只针对当前文件的未访问成员
    if (selectedMemberIds.length === unvisitedMembers.length && unvisitedMembers.length > 0) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(unvisitedMembers.map(m => m.id));
    }
  };

  const handleRefreshTemplate = () => {
    if (!file) return;
    // 只对当前选中的成员生成文案
    const selectedMembers = unvisitedMembers.filter(m => selectedMemberIds.includes(m.id));
    const memberNames = selectedMembers.map(m => m.name);
    if (memberNames.length > 0) {
      setCustomMessage(generateReminderText(file.name, memberNames));
    } else {
      Taro.showToast({ title: '请先选择提醒对象', icon: 'none' });
    }
  };

  const handleSend = () => {
    if (selectedMemberIds.length === 0) {
      Taro.showToast({ title: '请选择提醒对象', icon: 'none' });
      return;
    }

    if (!file) {
      Taro.showToast({ title: '文件信息错误', icon: 'none' });
      return;
    }

    const targetMembers = unvisitedMembers
      .filter(m => selectedMemberIds.includes(m.id))
      .map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        hasVisitedAfter: false
      }));

    // 保存到 store，自动持久化
    addReminder({
      fileId: file.id,
      fileName: file.name,
      targetMembers,
      message: customMessage,
      status: 'pending'
    });

    console.log('[RemindCreate] 发送提醒:', {
      fileId: file.id,
      fileName: file.name,
      targetCount: targetMembers.length,
      message: customMessage
    });

    Taro.showToast({ title: '提醒已发送', icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/reminders/index' });
    }, 1500);
  };

  const handleCopy = () => {
    Taro.setClipboardData({
      data: customMessage,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  };

  const selectedMembers = unvisitedMembers.filter(m => selectedMemberIds.includes(m.id));

  // 如果全员已查看，显示友好提示
  if (file && unvisitedMembers.length === 0) {
    return (
      <View className={styles.page}>
        <View style={{
          padding: '120rpx 32rpx',
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: '100rpx' }}>🎉</Text>
          <Text style={{
            display: 'block',
            fontSize: '32rpx',
            fontWeight: '600',
            color: '#1D2129',
            marginTop: '24rpx',
            marginBottom: '12rpx'
          }}>
            全员已查看！
          </Text>
          <Text style={{ fontSize: '28rpx', color: '#86909C' }}>
            这份资料的所有成员都已查看，无需催看～
          </Text>
          <View
            style={{
              marginTop: '48rpx',
              padding: '20rpx 48rpx',
              background: '#27C28B',
              color: '#fff',
              borderRadius: '48rpx',
              fontSize: '28rpx',
              fontWeight: '600',
              display: 'inline-block'
            }}
            onClick={() => Taro.navigateBack()}
          >
            返回
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.fileSection}>
          <Text className={styles.fileLabel}>提醒文件</Text>
          <Text className={styles.fileName}>{file?.name || '加载中...'}</Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              提醒对象
              <Text style={{ color: '#F53F3F', marginLeft: '8rpx' }}>
                ({unvisitedMembers.length}人未看)
              </Text>
            </Text>
            <Text className={styles.selectAll} onClick={handleSelectAll}>
              {selectedMemberIds.length === unvisitedMembers.length && unvisitedMembers.length > 0
                ? '取消全选'
                : '全选'
              }
            </Text>
          </View>
          <View className={styles.memberList}>
            {unvisitedMembers.map(member => (
              <View
                key={member.id}
                className={styles.memberItem}
                onClick={() => handleSelectMember(member.id)}
              >
                <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
                <View className={styles.memberInfo}>
                  <Text className={styles.memberName}>{member.name}</Text>
                  <Text className={styles.memberStatus}>
                    {getStatusText(member.visitStatus)}
                  </Text>
                </View>
                <View className={classnames(styles.checkbox, selectedMemberIds.includes(member.id) && styles.checked)}>
                  {selectedMemberIds.includes(member.id) && (
                    <Text className={styles.checkIcon}>✓</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* 已查看成员列表，折叠显示 */}
          {allMembersForFile.filter(m => m.visitStatus !== 'unvisited').length > 0 && (
            <View style={{ marginTop: '24rpx' }}>
              <Text style={{ fontSize: '26rpx', color: '#86909C', marginBottom: '12rpx' }}>
                已查看 ({allMembersForFile.filter(m => m.visitStatus !== 'unvisited').length}人)
              </Text>
              <View style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16rpx',
                opacity: 0.6
              }}>
                {allMembersForFile
                  .filter(m => m.visitStatus !== 'unvisited')
                  .slice(0, 6)
                  .map(member => (
                    <Image
                      key={member.id}
                      style={{
                        width: '56rpx',
                        height: '56rpx',
                        borderRadius: '28rpx',
                        background: '#f2f3f5'
                      }}
                      src={member.avatar}
                      mode="aspectFill"
                    />
                  ))
                }
                {allMembersForFile.filter(m => m.visitStatus !== 'unvisited').length > 6 && (
                  <Text style={{ fontSize: '24rpx', color: '#86909C', alignSelf: 'center' }}>
                    +{allMembersForFile.filter(m => m.visitStatus !== 'unvisited').length - 6}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View className={styles.messageSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>提醒文案</Text>
          </View>
          <View className={styles.messageBox}>
            <Text className={styles.messageText}>{customMessage}</Text>
          </View>
          <View className={styles.templates}>
            <View className={styles.templateBtn} onClick={handleRefreshTemplate}>
              🔄 换一条
            </View>
            <View className={styles.templateBtn} onClick={handleCopy}>
              📋 复制文案
            </View>
          </View>
        </View>

        <View className={styles.inputSection}>
          <Text className={styles.inputLabel}>自定义内容（可选）</Text>
          <Textarea
            className={styles.textarea}
            placeholder="输入自定义提醒内容..."
            value={customMessage}
            onInput={(e) => setCustomMessage(e.detail.value)}
            maxlength={200}
          />
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Text className={styles.selectedCount}>
          已选择 <Text className={styles.highlight}>{selectedMembers.length}</Text> 位成员
        </Text>
        <View
          className={classnames(styles.sendBtn, selectedMembers.length === 0 && styles.disabled)}
          onClick={handleSend}
        >
          发送提醒
        </View>
      </View>
    </View>
  );
};

export default RemindCreatePage;
