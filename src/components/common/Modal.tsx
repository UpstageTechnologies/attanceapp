import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { X } from 'lucide-react-native';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  contentStyle,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, contentStyle]}>
              {(title || !!onClose) && (
                <View style={styles.header}>
                  <View style={styles.titleWrap}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {footer && <View style={styles.footer}>{footer}</View>}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
});
