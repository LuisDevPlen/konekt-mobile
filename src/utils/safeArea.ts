import { EdgeInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/ifood';

export function getTabBarStyle(insets: EdgeInsets) {
  const bottom = Math.max(insets.bottom, 6);
  return {
    height: 56 + bottom,
    paddingBottom: bottom,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  };
}

export const TAB_BAR_BASE_HEIGHT = 56;

export function getTabBarHeight(insets: EdgeInsets): number {
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 6);
}

export function getFabBottom(insets: EdgeInsets, margin = 16): number {
  return margin + getTabBarHeight(insets);
}
