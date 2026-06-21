import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import FileCard from '@/components/FileCard';
import type { FolderItem, FileItem } from '@/types';

const FilesPage: React.FC = () => {
  const folders = useAppStore(state => state.folders);
  const files = useAppStore(state => state.files);
  const setCurrentFile = useAppStore(state => state.setCurrentFile);

  const [activeTab, setActiveTab] = useState<'folders' | 'files'>('folders');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useDidShow(() => {
    console.log('[FilesPage] 页面显示');
  });

  const filteredFolders: FolderItem[] = useMemo(() => {
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [folders, searchText]);

  const displayFiles: FileItem[] = useMemo(() => {
    let fileList = selectedFolderId
      ? files.filter(f => f.folderId === selectedFolderId)
      : files;

    if (searchText) {
      fileList = fileList.filter(f =>
        f.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return fileList;
  }, [files, selectedFolderId, searchText]);

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    setActiveTab('files');
  };

  const handleBackToFolders = () => {
    setSelectedFolderId(null);
    setActiveTab('folders');
  };

  const handleFileClick = (file: FileItem) => {
    // 点击文件时更新全局 currentFileId
    setCurrentFile(file.id);
    console.log('[FilesPage] 选择文件:', file.name);
    Taro.navigateTo({
      url: `/pages/file-detail/index?id=${file.id}`
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>团队文件</Text>
        <Text className={styles.subtitle}>选择文件查看成员访问情况</Text>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索文件或文件夹"
            placeholderClass={styles.placeholder}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'folders' && styles.active)}
          onClick={() => setActiveTab('folders')}
        >
          文件夹
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'files' && styles.active)}
          onClick={() => setActiveTab('files')}
        >
          {selectedFolderId ? '当前文件夹' : '全部文件'}
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.section}>
          {activeTab === 'folders' ? (
            <>
              <Text className={styles.sectionTitle}>共享文件夹</Text>
              <View className={styles.folderList}>
                {filteredFolders.length > 0 ? (
                  filteredFolders.map(folder => (
                    <View
                      key={folder.id}
                      className={styles.folderCard}
                      onClick={() => handleFolderClick(folder.id)}
                    >
                      <View className={styles.folderIcon}>
                        <Text className={styles.folderIconText}>📁</Text>
                      </View>
                      <View className={styles.folderInfo}>
                        <Text className={styles.folderName}>{folder.name}</Text>
                        <View className={styles.folderMeta}>
                          <Text className={styles.folderCount}>{folder.fileCount} 个文件</Text>
                          <Text className={styles.folderDrive}>{folder.cloudDrive}</Text>
                        </View>
                      </View>
                      <Text className={styles.folderArrow}>›</Text>
                    </View>
                  ))
                ) : (
                  <View className={styles.emptyState}>
                    <Text className={styles.emptyIcon}>📭</Text>
                    <Text className={styles.emptyText}>暂无匹配的文件夹</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              {selectedFolderId && (
                <View
                  style={{ marginBottom: '24rpx', color: '#3370FF', fontSize: '28rpx', fontWeight: '500' }}
                  onClick={handleBackToFolders}
                >
                  ← 返回文件夹列表
                </View>
              )}
              <Text className={styles.sectionTitle}>
                {selectedFolderId ? '文件夹内文件' : '全部文件'}
              </Text>
              <View className={styles.fileList}>
                {displayFiles.length > 0 ? (
                  displayFiles.map(file => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onClick={() => handleFileClick(file)}
                    />
                  ))
                ) : (
                  <View className={styles.emptyState}>
                    <Text className={styles.emptyIcon}>📄</Text>
                    <Text className={styles.emptyText}>暂无文件</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default FilesPage;
