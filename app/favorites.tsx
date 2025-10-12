import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Platform, BackHandler } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import useFavoritesStore from "@/stores/favoritesStore";
import { Favorite } from "@/services/storage";
import VideoCard from "@/components/VideoCard";
import { api } from "@/services/api";
import CustomScrollView from "@/components/CustomScrollView";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { getCommonResponsiveStyles } from "@/utils/ResponsiveStyles";
import ResponsiveNavigation from "@/components/navigation/ResponsiveNavigation";
import ResponsiveHeader from "@/components/navigation/ResponsiveHeader";
import { StyledButton } from "@/components/StyledButton";
import { Trash2 } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useFocusEffect } from "expo-router";

export default function FavoritesScreen() {
  const { favorites, loading, error, fetchFavorites } = useFavoritesStore();
  const [isDeleteMode, setIsDeleteMode] = useState(false); // 删除模式状态
  const colorScheme = "dark";

  // 响应式布局配置
  const responsiveConfig = useResponsiveLayout();
  const commonStyles = getCommonResponsiveStyles(responsiveConfig);
  const { deviceType, spacing } = responsiveConfig;

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // 返回键处理：优先退出删除模式
  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        // 如果处于删除模式，返回键优先退出删除模式
        if (isDeleteMode) {
          setIsDeleteMode(false);
          return true; // 拦截返回事件
        }
        return false; // 允许正常返回
      };

      // 仅限 Android 平台启用此功能
      if (Platform.OS === "android") {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
        return () => {
          backHandler.remove();
        };
      }
    }, [isDeleteMode])
  );

  const renderItem = ({ item }: { item: Favorite & { key: string }; index: number }) => {
    const [source, id] = item.key.split("+");
    return (
      <VideoCard
        id={id}
        source={source}
        title={item.title}
        sourceName={item.source_name}
        poster={item.cover}
        year={item.year}
        api={api}
        deleteType="favorite"
        isDeleteMode={isDeleteMode}
        onRecordDeleted={fetchFavorites}
      />
    );
  };

  // 动态样式
  const dynamicStyles = createResponsiveStyles(deviceType, spacing);

  const renderFavoritesContent = () => (
    <>
      {deviceType === 'tv' && (
        <View style={dynamicStyles.headerContainer}>
          <ThemedText style={dynamicStyles.headerTitle}>我的收藏</ThemedText>
          <StyledButton
            style={dynamicStyles.deleteButton}
            onPress={() => setIsDeleteMode(!isDeleteMode)}
            variant="ghost"
          >
            <Trash2
              color={isDeleteMode ? "#FF3B30" : (colorScheme === "dark" ? "white" : "black")}
              size={24}
            />
          </StyledButton>
        </View>
      )}
      <CustomScrollView
        data={favorites}
        renderItem={renderItem}
        loading={loading}
        error={error}
        emptyMessage="暂无收藏"
      />
    </>
  );

  const content = (
    <ThemedView style={[commonStyles.container, dynamicStyles.container]}>
      {renderFavoritesContent()}
    </ThemedView>
  );

  // 根据设备类型决定是否包装在响应式导航中
  if (deviceType === 'tv') {
    return content;
  }

  return (
    <ResponsiveNavigation>
      <ResponsiveHeader title="我的收藏" showBackButton />
      {content}
    </ResponsiveNavigation>
  );
}

const createResponsiveStyles = (deviceType: string, spacing: number) => {
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isTV = deviceType === 'tv';

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isTV ? spacing * 2 : 0,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing * 1.5,
      marginBottom: spacing / 2,
      position: "relative",
    },
    headerTitle: {
      fontSize: isMobile ? 24 : isTablet ? 28 : 32,
      fontWeight: "bold",
      paddingTop: spacing,
      color: 'white',
    },
    deleteButton: {
      borderRadius: 30,
      marginLeft: spacing,
      paddingTop: spacing,
    },
  });
};
