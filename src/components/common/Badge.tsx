import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primarySurface, text: colors.primaryDark };
      case 'success':
        return { bg: colors.successSurface, text: colors.success };
      case 'warning':
        return { bg: colors.warningSurface, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerSurface, text: colors.danger };
      case 'info':
        return { bg: colors.infoSurface, text: colors.info };
      case 'neutral':
      default:
        return { bg: colors.surfaceSubtle, text: colors.textSecondary };
    }
  };

  const { bg, text } = getVariantStyles();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bg },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' ? styles.textSm : styles.textMd,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
