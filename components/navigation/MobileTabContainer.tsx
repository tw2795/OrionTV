import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Search, Settings, Tv } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors } from '@/constants/Colors';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { DeviceUtils } from '@/utils/DeviceUtils';

interface TabItem {
  key: string;
  label: string;
  route: string;
  renderIcon: (options: { color: string; size: number; isActive: boolean }) => React.ReactNode;
}

const tabs: TabItem[] = [
  {
    key: 'home',
    label: '首页',
    route: '/',
    renderIcon: ({ color, size, isActive }) => (
      <Home color={color} size={size} strokeWidth={isActive ? 2.5 : 2} />
    ),
  },
  {
    key: 'search',
    label: '搜索',
    route: '/search',
    renderIcon: ({ color, size, isActive }) => (
      <Search color={color} size={size} strokeWidth={isActive ? 2.5 : 2} />
    ),
  },
  {
    key: 'live',
    label: '直播',
    route: '/live',
    renderIcon: ({ color, size, isActive }) => (
      <Tv color={color} size={size} strokeWidth={isActive ? 2.5 : 2} />
    ),
  },
  {
    key: 'favorites',
    label: '收藏',
    route: '/favorites',
    renderIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="star-outline" color={color} size={size} />
    ),
  },
  {
    key: 'settings',
    label: '设置',
    route: '/settings',
    renderIcon: ({ color, size, isActive }) => (
      <Settings color={color} size={size} strokeWidth={isActive ? 2.5 : 2} />
    ),
  },
];

interface MobileTabContainerProps {
  children: React.ReactNode;
}

const MobileTabContainer: React.FC<MobileTabContainerProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { spacing, deviceType } = useResponsiveLayout();
  
  // 在手机端过滤掉直播 tab
  const filteredTabs = tabs.filter(tab => 
    deviceType !== 'mobile' || tab.key !== 'live'
  );
  
  const handleTabPress = (route: string) => {
    if (route === '/') {
      router.push('/');
    } else {
      router.push(route as any);
    }
  };

  const isTabActive = (route: string) => {
    if (route === '/' && pathname === '/') return true;
    if (route !== '/' && pathname === route) return true;
    return false;
  };

  const dynamicStyles = createStyles(spacing);

  return (
    <View style={dynamicStyles.container}>
      {/* 内容区域 */}
      <View style={dynamicStyles.content}>
        {children}
      </View>
      
      {/* 底部导航栏 */}
      <View style={dynamicStyles.tabBar}>
        {filteredTabs.map((tab) => {
        const isActive = isTabActive(tab.route);
        const iconColor = isActive ? Colors.dark.primary : '#888';

        return (
          <TouchableOpacity
            key={tab.key}
            style={[dynamicStyles.tab, isActive && dynamicStyles.activeTab]}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}
          >
            {tab.renderIcon({ color: iconColor, size: 20, isActive })}
            <Text style={[
              dynamicStyles.tabLabel,
              isActive && dynamicStyles.activeTabLabel
            ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (spacing: number) => {
  const minTouchTarget = DeviceUtils.getMinTouchTargetSize();
  
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: '#1c1c1e',
      borderTopWidth: 1,
      borderTopColor: '#333',
      paddingTop: spacing / 2,
      paddingBottom: Platform.OS === 'ios' ? spacing * 2 : spacing,
      paddingHorizontal: spacing,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 10,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: minTouchTarget,
      paddingVertical: spacing / 2,
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: 'rgba(64, 156, 255, 0.1)',
    },
    tabLabel: {
      fontSize: 11,
      color: '#888',
      marginTop: 2,
      fontWeight: '500',
    },
    activeTabLabel: {
      color: Colors.dark.primary,
      fontWeight: '600',
    },
  });
};

export default MobileTabContainer;
