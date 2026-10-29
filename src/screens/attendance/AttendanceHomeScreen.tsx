import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttendanceAuth } from '../../context/AttendanceAuthContext';
import { AttendanceFirestoreService } from '../../services/attendanceFirestoreService';
import { TodayPunchStatus, AttendanceRecord } from '../../types/attendance';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LiveFaceScannerModal } from '../../components/modules/LiveFaceScannerModal';
import { BiometricConsentModal } from '../../components/modules/BiometricConsentModal';
import { colors } from '../../theme/colors';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import {
  LogOut,
  Camera,
  CheckCircle,
  Clock,
  Briefcase,
  Hospital,
  AlertTriangle,
  Fingerprint,
  Calendar,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';

export const AttendanceHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut, markFaceEnrolled } = useAttendanceAuth();

  const [punchStatus, setPunchStatus] = useState<TodayPunchStatus>({
    clockInRecord: null,
    clockOutRecord: null,
    currentClockState: 'NOT_CLOCKED_IN',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerMode, setScannerMode] = useState<'VERIFICATION' | 'ENROLLMENT'>('VERIFICATION');
  const [consentModalVisible, setConsentModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadTodayStatus();
    }
  }, [user]);

  const loadTodayStatus = async () => {
    if (!user) return;
    const status = await AttendanceFirestoreService.getTodayPunches(user.authUid, user.hospitalId);
    setPunchStatus(status);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayStatus();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Attendance App?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handlePrimaryScanAction = () => {
    if (!user) return;

    if (!user.faceEnrolled) {
      setConsentModalVisible(true);
      return;
    }

    if (punchStatus.currentClockState === 'CLOCKED_OUT') {
      Alert.alert(
        'Duty Completed',
        'You have already clocked in and out for today. Duplicate punches are restricted in accordance with shift policy.'
      );
      return;
    }

    setScannerMode('VERIFICATION');
    setScannerVisible(true);
  };

  const handleVerificationSuccess = async (score: number) => {
    if (!user) return;
    const eventType = punchStatus.currentClockState === 'NOT_CLOCKED_IN' ? 'CLOCK_IN' : 'CLOCK_OUT';

    const res = await AttendanceFirestoreService.recordPunch({
      staff: user,
      eventType,
      verificationScore: score,
      verificationMode: 'FACE_VECTOR',
      clockInTime: punchStatus.clockInRecord?.time,
    });

    if (res.success && res.record) {
      Alert.alert(
        `${eventType === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'} Recorded`,
        `Time: ${res.record.time}\nStatus: ${res.record.status} (${res.record.lateMinutes > 0 ? `${res.record.lateMinutes}m late` : 'On-time'})\nVector Match: ${(score * 100).toFixed(1)}%\nServer Timestamp Logged.`
      );
      await loadTodayStatus();
    }
  };

  const handleManualFallback = () => {
    Alert.prompt
      ? Alert.prompt(
          'Authorized Manual Punch',
          'Enter managerial approval reason for manual clock-in:',
          async (reason?: string) => {
            if (!user) return;
            const eventType =
              punchStatus.currentClockState === 'NOT_CLOCKED_IN' ? 'CLOCK_IN' : 'CLOCK_OUT';
            const res = await AttendanceFirestoreService.recordPunch({
              staff: user,
              eventType,
              verificationScore: 1.0,
              verificationMode: 'AUTHORIZED_MANUAL',
              clockInTime: punchStatus.clockInRecord?.time,
            });
            if (res.success) {
              Alert.alert('Success', `Manual ${eventType} recorded. Managerial audit flag logged.`);
              await loadTodayStatus();
            }
          }
        )
      : Alert.alert(
          'Manual Fallback',
          'Please present yourself to your Department Head or Hospital Administrator to authorize manual attendance entry.'
        );
  };

  if (!user) return null;

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.hospitalBranding}>
          <Hospital size={20} color={colors.primary} />
          <View style={{ marginLeft: spacing.xs + 2 }}>
            <Text style={styles.hospitalName}>MedPulse City Hospital</Text>
            <Text style={styles.hospitalDistrict}>Central Medical District</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.signOutBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LogOut size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Staff Profile Card */}
        <Card style={styles.staffCard}>
          <View style={styles.staffTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>

            <View style={styles.staffInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.staffName}>{user.fullName}</Text>
                <Badge
                  label={user.role}
                  variant={user.role === 'Doctor' ? 'primary' : 'info'}
                  size="sm"
                />
              </View>
              <Text style={styles.designationText}>{user.designation}</Text>
              <Text style={styles.deptText}>
                {user.employeeCode} • {user.departmentName}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.shiftDetailsRow}>
            <View style={styles.shiftCol}>
              <View style={styles.iconLabel}>
                <Clock size={13} color={colors.textSecondary} />
                <Text style={styles.colLabel}>Shift Hours</Text>
              </View>
              <Text style={styles.colValue}>{user.shift}</Text>
            </View>

            <View style={styles.shiftCol}>
              <View style={styles.iconLabel}>
                <Calendar size={13} color={colors.textSecondary} />
                <Text style={styles.colLabel}>Weekly Off</Text>
              </View>
              <Text style={styles.colValue}>{user.weeklyOff}</Text>
            </View>
          </View>
        </Card>

        {/* Biometric Enrollment Banner (if needed) */}
        {!user.faceEnrolled ? (
          <Card style={styles.enrollmentBanner}>
            <View style={styles.bannerHeader}>
              <Fingerprint size={24} color={colors.warning} />
              <View style={styles.bannerHeaderText}>
                <Text style={styles.bannerTitle}>Biometric Face Setup Required</Text>
                <Text style={styles.bannerSubtitle}>
                  Register your face template with DPDP consent to enable camera duty clock-in.
                </Text>
              </View>
            </View>
            <Button
              title="Enroll Face Template"
              variant="primary"
              size="sm"
              style={styles.enrollBtn}
              onPress={() => setConsentModalVisible(true)}
            />
          </Card>
        ) : (
          <View style={styles.enrolledBadgeRow}>
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={styles.enrolledBadgeText}>
              128D Face Biometrics Registered • DPDP Consent Active
            </Text>
          </View>
        )}

        {/* Today's Punch Status Card */}
        <Card style={styles.punchCard}>
          <View style={styles.punchCardHeader}>
            <View>
              <Text style={styles.todayDateText}>{todayDateStr}</Text>
              <Text style={styles.todaySubText}>Daily Duty Shift Status</Text>
            </View>
            <Badge
              label={
                punchStatus.currentClockState === 'NOT_CLOCKED_IN'
                  ? 'Not Clocked In'
                  : punchStatus.currentClockState === 'CLOCKED_IN'
                  ? 'Duty Active'
                  : 'Duty Completed'
              }
              variant={
                punchStatus.currentClockState === 'NOT_CLOCKED_IN'
                  ? 'neutral'
                  : punchStatus.currentClockState === 'CLOCKED_IN'
                  ? 'success'
                  : 'info'
              }
            />
          </View>

          {/* Timestamps Row */}
          <View style={styles.timestampsRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Clock In</Text>
              <Text style={styles.timeValue}>
                {punchStatus.clockInRecord ? punchStatus.clockInRecord.time : '--:--'}
              </Text>
              {punchStatus.clockInRecord && (
                <Text
                  style={[
                    styles.timeStatus,
                    punchStatus.clockInRecord.status === 'Late' && { color: colors.warning },
                  ]}
                >
                  {punchStatus.clockInRecord.status}
                </Text>
              )}
            </View>

            <View style={styles.timeSeparator} />

            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Clock Out</Text>
              <Text style={styles.timeValue}>
                {punchStatus.clockOutRecord ? punchStatus.clockOutRecord.time : '--:--'}
              </Text>
              {punchStatus.clockOutRecord && (
                <Text style={styles.timeStatus}>{punchStatus.clockOutRecord.status}</Text>
              )}
            </View>
          </View>

          {/* Large Primary Action Button */}
          <Button
            title={
              !user.faceEnrolled
                ? 'Enroll Face to Enable Clock In'
                : punchStatus.currentClockState === 'NOT_CLOCKED_IN'
                ? 'Scan Face to Clock In'
                : punchStatus.currentClockState === 'CLOCKED_IN'
                ? 'Scan Face to Clock Out'
                : 'Shift Completed Today'
            }
            onPress={handlePrimaryScanAction}
            size="lg"
            variant={
              punchStatus.currentClockState === 'CLOCKED_OUT' ? 'secondary' : 'primary'
            }
            disabled={punchStatus.currentClockState === 'CLOCKED_OUT'}
            leftIcon={<Camera size={20} color="#FFFFFF" />}
            style={styles.scanActionBtn}
          />

          {/* Shift Rules Micro-copy */}
          <Text style={styles.shiftRuleNote}>
            Shift Grace Period: 15 minutes. Verification matches on-device encrypted vector with server timestamp.
          </Text>
        </Card>

        {/* Manual Fallback Option */}
        <TouchableOpacity style={styles.manualFallbackBtn} onPress={handleManualFallback}>
          <Text style={styles.manualFallbackText}>
            Experiencing camera or lighting issues? Use authorized manual punch
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Biometric Consent Modal */}
      <BiometricConsentModal
        visible={consentModalVisible}
        onClose={() => setConsentModalVisible(false)}
        staffName={user.fullName}
        onConsentAgreed={() => {
          setConsentModalVisible(false);
          setScannerMode('ENROLLMENT');
          setScannerVisible(true);
        }}
      />

      {/* Live Face Scanner Modal */}
      <LiveFaceScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        staff={user}
        mode={scannerMode}
        clockType={punchStatus.currentClockState === 'NOT_CLOCKED_IN' ? 'CLOCK_IN' : 'CLOCK_OUT'}
        onVerificationSuccess={handleVerificationSuccess}
        onEnrollmentSuccess={async () => {
          await markFaceEnrolled();
          Alert.alert('Enrolled', 'Facial biometric template registered successfully. You can now clock in.');
        }}
        onManualFallback={handleManualFallback}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hospitalBranding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hospitalDistrict: {
    fontSize: 11,
    color: colors.textMuted,
  },
  signOutBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  staffCard: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  staffTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  staffInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  designationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  deptText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  shiftDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftCol: {
    flex: 1,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  colLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  colValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  enrollmentBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerHeaderText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  enrollBtn: {
    marginTop: spacing.md,
  },
  enrolledBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  enrolledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    marginLeft: spacing.xs,
  },
  punchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  punchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  todayDateText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todaySubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  timestampsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  timeBox: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  timeStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  timeSeparator: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderStrong,
  },
  scanActionBtn: {
    marginBottom: spacing.sm,
  },
  shiftRuleNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  manualFallbackBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  manualFallbackText: {
    fontSize: 11,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
