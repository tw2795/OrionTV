import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Search, Settings, Tv } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@/components/ThemedText';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { DeviceUtils } from '@/utils/DeviceUtils';

interface NavigationItem {
  name: string;
  label: string;
  route: string;
  renderIcon: (color: string, size: number) => React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'home',
    label: '首页',
    route: '/',
    renderIcon: (color, size) => <Home color={color} size={size} />,
  },
  {
    name: 'live',
    label: '直播',
    route: '/live',
    renderIcon: (color, size) => <Tv color={color} size={size} />,
  },
  {
    name: 'search',
    label: '搜索',
    route: '/search',
    renderIcon: (color, size) => <Search color={color} size={size} />,
  },
  {
    name: 'favorites',
    label: '收藏',
    route: '/favorites',
    renderIcon: (color, size) => (
      <MaterialCommunityIcons name="star-outline" color={color} size={size} />
    ),
  },
  {
    name: 'settings',
    label: '设置',
    route: '/settings',
    renderIcon: (color, size) => <Settings color={color} size={size} />,
  },
];

interface MobileBottomNavigationProps {
  colorScheme?: 'light' | 'dark';
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  colorScheme = 'dark',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const responsiveConfig = useResponsiveLayout();

  // Only show on mobile devices
  if (responsiveConfig.deviceType !== 'mobile') {
    return null;
  }

  // 在手机端过滤掉直播 tab
  const filteredNavigationItems = navigationItems.filter(item => 
    responsiveConfig.deviceType !== 'mobile' || item.name !== 'live'
  );

  const handleNavigation = (route: string) => {
    if (route === '/') {
      router.push('/');
    } else {
      router.push(route as any);
    }
  };

  const isActiveRoute = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  const activeColor = colorScheme === 'dark' ? '#007AFF' : '#007AFF';
  const inactiveColor = colorScheme === 'dark' ? '#8E8E93' : '#8E8E93';
  const backgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7';

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor,
      borderTopColor: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    },
  });

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {filteredNavigationItems.map((item) => {
        const isActive = isActiveRoute(item.route);

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.tabItem}
            onPress={() => handleNavigation(item.route)}
            activeOpacity={0.7}
          >
            {item.renderIcon(isActive ? activeColor : inactiveColor, 24)}
            <ThemedText
              style={[
                styles.tabLabel,
                { color: isActive ? activeColor : inactiveColor },
              ]}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 84, // 49 + 35 for safe area
    paddingBottom: 35, // Safe area padding
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: DeviceUtils.getMinTouchTargetSize(),
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MobileBottomNavigation;
