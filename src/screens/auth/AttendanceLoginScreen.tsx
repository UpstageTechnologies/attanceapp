import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttendanceAuth } from '../../context/AttendanceAuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import {
  ShieldCheck,
  Mail,
  Lock,
  Hospital,
  AlertCircle,
  KeyRound,
  CheckCircle,
} from 'lucide-react-native';

export const AttendanceLoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { signIn, sendPasswordReset, isLoading, error, clearError } = useAttendanceAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    setLocalError('');
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both your hospital email and password.');
      return;
    }

    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      // Error handled in context state
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Required', 'Please enter your registered staff email address.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await sendPasswordReset(resetEmail.trim());
      if (res.success) {
        Alert.alert('Reset Link Sent', res.message, [
          { text: 'OK', onPress: () => setResetModalVisible(false) },
        ]);
      } else {
        Alert.alert('Password Reset Notice', res.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Med@Demo2026!');
    setLocalError('');
    clearError();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Hospital size={36} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>MedPulse Attendance</Text>
          <Text style={styles.brandSubtitle}>Duty Clock-In & Face Biometrics</Text>
          <View style={styles.badgeRow}>
            <ShieldCheck size={14} color={colors.primaryDark} />
            <Text style={styles.badgeText}>Firebase Auth Secured (hospital-bf28e)</Text>
          </View>
        </View>

        {/* Login Card */}
        <Card style={styles.loginCard}>
          <Text style={styles.cardHeaderTitle}>Staff Sign In</Text>
          <Text style={styles.cardHeaderSubtitle}>
            Enter your hospital-provisioned credentials to access attendance clock-in.
          </Text>

          {(error || localError) && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error || localError}</Text>
            </View>
          )}

          <Input
            label="Hospital Staff Email"
            placeholder="e.g. dr.sharma@hospital.org"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              setLocalError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
            required
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              setLocalError('');
            }}
            isPassword
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            required
          />

          <View style={styles.forgotRow}>
            <TouchableOpacity
              onPress={() => {
                setResetEmail(email);
                setResetModalVisible(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In to Attendance"
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
            style={styles.signInBtn}
          />

          {/* Quick Demo Fill Buttons for Verification Testing */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Quick-Fill Test Accounts:</Text>
            <View style={styles.demoChipsRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleQuickFill('dr.sharma@hospital.org')}
              >
                <Text style={styles.demoChipText}>Dr. Sharma (Doctor)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleQuickFill('priya.nair@hospital.org')}
              >
                <Text style={styles.demoChipText}>Nurse Priya (Staff)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Security & Isolation Disclaimer */}
        <View style={styles.securityFooter}>
          <Text style={styles.securityText}>
            • No public registration: staff credentials must be provisioned by the Hospital Administrator in MedPulse Pro.{'\n'}
            • Strictly scoped to hospital-bf28e with DPDP biometric consent.
          </Text>
        </View>

        {/* Password Reset Modal */}
        <Modal
          visible={resetModalVisible}
          onClose={() => setResetModalVisible(false)}
          title="Reset Password"
          subtitle="Receive a password reset link at your registered hospital email."
          footer={
            <View style={styles.modalFooterRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setResetModalVisible(false)}
                style={styles.modalCancelBtn}
              />
              <Button
                title="Send Reset Link"
                variant="primary"
                loading={resetLoading}
                onPress={handlePasswordReset}
              />
            </View>
          }
        >
          <Input
            label="Registered Staff Email"
            placeholder="e.g. dr.sharma@hospital.org"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
            required
          />
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
    marginLeft: 4,
  },
  loginCard: {
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSurface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    marginLeft: spacing.xs + 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  signInBtn: {
    marginTop: spacing.xs,
  },
  demoSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  demoChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    marginTop: spacing.xs,
  },
  demoChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  securityFooter: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  securityText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    marginRight: spacing.sm,
  },
});
