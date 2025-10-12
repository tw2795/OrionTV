import { Alert } from "react-native";
import { PlayRecordManager, FavoriteManager } from "@/services/storage";
import Logger from '@/utils/Logger';

const logger = Logger.withTag('DeleteHelpers');

/**
 * 删除类型
 */
export type DeleteType = 'playRecord' | 'favorite';

/**
 * 删除配置接口
 */
export interface DeleteConfig {
  source: string;
  id: string;
  title: string;
  type: DeleteType;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 根据类型删除对应的记录
 */
export async function deleteRecord(config: DeleteConfig): Promise<void> {
  const { source, id, type } = config;

  try {
    if (type === 'playRecord') {
      await PlayRecordManager.remove(source, id);
      logger.info(`Successfully deleted play record: ${source}+${id}`);
    } else if (type === 'favorite') {
      await FavoriteManager.remove(source, id);
      logger.info(`Successfully deleted favorite: ${source}+${id}`);
    }

    // 调用成功回调
    config.onSuccess?.();
  } catch (error) {
    logger.error(`Failed to delete ${type}:`, error);
    const err = error instanceof Error ? error : new Error(`删除失败`);
    config.onError?.(err);
    throw err;
  }
}

/**
 * 显示删除确认对话框并执行删除操作
 */
export function showDeleteConfirmation(config: DeleteConfig): void {
  const { title, type } = config;

  const dialogTitle = type === 'playRecord' ? '删除观看记录' : '删除收藏';
  const message = type === 'playRecord'
    ? `确定要删除"${title}"的观看记录吗？`
    : `确定要从收藏中删除"${title}"吗？`;

  Alert.alert(dialogTitle, message, [
    {
      text: "取消",
      style: "cancel",
    },
    {
      text: "删除",
      style: "destructive",
      onPress: async () => {
        try {
          await deleteRecord(config);
        } catch (error) {
          // 显示错误提示
          const errorMessage = error instanceof Error ? error.message : '删除失败，请重试';
          Alert.alert("错误", errorMessage);
        }
      },
    },
  ]);
}
