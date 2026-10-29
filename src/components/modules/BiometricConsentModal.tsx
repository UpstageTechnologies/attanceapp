import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { ShieldCheck, Check, AlertCircle, Lock } from 'lucide-react-native';

export interface BiometricConsentModalProps {
  visible: boolean;
  onClose: () => void;
  staffName: string;
  onConsentAgreed: () => void;
}

export const BiometricConsentModal: React.FC<BiometricConsentModalProps> = ({
  visible,
  onClose,
  staffName,
  onConsentAgreed,
}) => {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (agreed) {
      onConsentAgreed();
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Biometric Attendance Consent"
      subtitle="Digital Personal Data Protection (DPDP) Act Compliance"
      footer={
        <View style={styles.footerRow}>
          <Button
            title="Decline"
            variant="secondary"
            onPress={onClose}
            style={styles.declineBtn}
          />
          <Button
            title="Accept & Enroll Face"
            variant="primary"
            disabled={!agreed}
            onPress={handleAgree}
            style={styles.acceptBtn}
          />
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <ShieldCheck size={28} color={colors.primaryDark} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Voluntary Biometric Registration</Text>
            <Text style={styles.bannerDesc}>
              Subject: {staffName}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>1. Purpose of Data Processing</Text>
        <Text style={styles.bodyText}>
          MedPulse Healthcare uses facial geometry templates strictly for verifying hospital staff identity during duty clock-in and clock-out cycles, ensuring patient safety and regulatory compliance.
        </Text>

        <Text style={styles.sectionHeader}>2. Cryptographic Storage & Privacy</Text>
        <Text style={styles.bodyText}>
          • No raw photos are stored or transmitted. The camera extracts a mathematical 128-dimensional embedding vector.{'\n'}
          • Templates are encrypted using AES-256 and stored on-device.{'\n'}
          • Attendance records are synchronized with trusted server timestamps to project hospital-bf28e.
        </Text>

        <Text style={styles.sectionHeader}>3. Retention & Deletion Rights</Text>
        <Text style={styles.bodyText}>
          You have the right to withdraw consent and delete your biometric template at any time through the hospital administration portal. An authorized manual fallback punch option is always provided.
        </Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and voluntarily consent to the capture of my facial biometric template for attendance verification.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bannerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  bannerDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  declineBtn: {
    marginRight: spacing.sm,
  },
  acceptBtn: {
    minWidth: 160,
  },
});
