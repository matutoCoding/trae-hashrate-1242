import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface MemberAvatarProps {
  avatar: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  statusColor?: string;
  onClick?: () => void;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({
  avatar,
  name,
  size = 'md',
  showStatus = false,
  statusColor,
  onClick
}) => {
  return (
    <View className={classnames(styles.avatarWrap, styles[size])} onClick={onClick}>
      <Image
        className={styles.avatar}
        src={avatar}
        mode="aspectFill"
      />
      {showStatus && statusColor && (
        <View
          className={styles.statusDot}
          style={{ backgroundColor: statusColor }}
        />
      )}
      {name && <Text className={styles.name}>{name}</Text>}
    </View>
  );
};

export default MemberAvatar;
