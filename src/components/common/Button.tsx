import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'outline':
        return styles.btnOutline;
      case 'danger':
        return styles.btnDanger;
      case 'ghost':
        return styles.btnGhost;
      case 'primary':
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'danger':
        return styles.textDanger;
      case 'ghost':
        return styles.textGhost;
      case 'primary':
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs + 2,
  },
  iconRight: {
    marginLeft: spacing.xs + 2,
  },
  baseText: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sizeSm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  sizeMd: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  sizeLg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  textPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textSecondary: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  textOutline: {
    color: colors.primary,
    fontSize: 14,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  textDanger: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  textGhost: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
