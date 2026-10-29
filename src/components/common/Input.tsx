import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { Eye, EyeOff } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  required = false,
  containerStyle,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredStar}> *</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          !!error && styles.errorInput,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={styles.textInput}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  requiredStar: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: borderRadius.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  focused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
