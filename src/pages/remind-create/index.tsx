import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { mockMembers } from '@/data/members';
import { getFileById } from '@/data/files';
import { generateReminderText, getStatusText } from '@/utils';
import type { Member, FileItem } from '@/types';

const RemindCreatePage: React.FC = () => {
  const router = useRouter();
  const fileId = router.params.fileId || 'file1';

  const [file, setFile] = useState<FileItem | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  const unvisitedMembers = mockMembers.filter(m => m.visitStatus === 'unvisited');

  useEffect(() => {
    const fileData = getFileById(fileId);
    if (fileData) {
      setFile(fileData);
      const defaultSelected = unvisitedMembers.map(m => m.id);
      setSelectedMemberIds(defaultSelected);
      const memberNames = unvisitedMembers.map(m => m.name);
      setCustomMessage(generateReminderText(fileData.name, memberNames));
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
    if (selectedMemberIds.length === unvisitedMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(unvisitedMembers.map(m => m.id));
    }
  };

  const handleRefreshTemplate = () => {
    if (!file) return;
    const selectedMembers = mockMembers.filter(m => selectedMemberIds.includes(m.id));
    const memberNames = selectedMembers.map(m => m.name);
    setCustomMessage(generateReminderText(file.name, memberNames));
  };

  const handleSend = () => {
    if (selectedMemberIds.length === 0) {
      Taro.showToast({ title: '请选择提醒对象', icon: 'none' });
      return;
    }
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

  const selectedMembers = mockMembers.filter(m => selectedMemberIds.includes(m.id));

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.fileSection}>
          <Text className={styles.fileLabel}>提醒文件</Text>
          <Text className={styles.fileName}>{file?.name || '加载中...'}</Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>提醒对象</Text>
            <Text className={styles.selectAll} onClick={handleSelectAll}>
              {selectedMemberIds.length === unvisitedMembers.length ? '取消全选' : '全选'}
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
