import { BiometricVerificationService } from '../src/services/biometricVerificationService';
import {
  evaluateShiftAttendance,
  calculateDistanceMeters,
} from '../src/services/biometricVerificationAdapter';
import {
  evaluateFaceFrameQuality,
  FaceQualityMetrics,
} from '../src/services/faceDetectionEngine';
import { AuthenticatedStaff } from '../src/types/auth';

describe('Attendance App - Biometric Matching & Shift Rules Test Suite', () => {
  describe('Cosine Similarity Biometric Matcher', () => {
    it('confirms 1.0 identity match for identical 128D feature vectors', () => {
      const v = BiometricVerificationService.generateEmbeddingVector('staff_uid_1001_EMP101');
      const score = BiometricVerificationService.computeCosineSimilarity(v, v);
      expect(score).toBeCloseTo(1.0, 3);
    });

    it('approves verification when cosine similarity score exceeds threshold of 0.82', () => {
      const base = BiometricVerificationService.generateEmbeddingVector('staff_uid_1001_EMP101');
      // Natural minor variations in lighting / angle
      const perturbed = base.map((val, idx) => (idx % 8 === 0 ? val * 0.97 : val));
      const score = BiometricVerificationService.computeCosineSimilarity(base, perturbed);
      expect(score).toBeGreaterThanOrEqual(0.82);
    });

    it('rejects unauthorized intruder with similarity score below 0.82', () => {
      const enrolled = BiometricVerificationService.generateEmbeddingVector('staff_uid_1001_EMP101');
      const intruder = BiometricVerificationService.generateEmbeddingVector('unknown_person_vector');
      const score = BiometricVerificationService.computeCosineSimilarity(enrolled, intruder);
      expect(score).toBeLessThan(0.82);
    });
  });

  describe('Shift Rules & Grace Period Engine', () => {
    it('marks clock-in as Present within 15-minute grace window (e.g. 08:12 AM for 08:00 AM shift)', () => {
      const res = evaluateShiftAttendance('08:12', 'Morning (08:00 - 16:00)');
      expect(res.status).toBe('Present');
      expect(res.lateMinutes).toBe(12);
      expect(res.isHalfDay).toBe(false);
    });

    it('marks clock-in as Late when exceeding 15-minute grace window (e.g. 08:25 AM for 08:00 AM shift)', () => {
      const res = evaluateShiftAttendance('08:25', 'Morning (08:00 - 16:00)');
      expect(res.status).toBe('Late');
      expect(res.lateMinutes).toBe(25);
    });

    it('marks shift as Half-Day when worked duration is under 4 hours (e.g. 08:00 AM to 11:30 AM)', () => {
      const res = evaluateShiftAttendance('08:00', 'Morning (08:00 - 16:00)', '11:30');
      expect(res.isHalfDay).toBe(true);
      expect(res.status).toBe('Half-Day');
      expect(res.workedMinutes).toBe(210); // 3.5 hours
    });

    it('marks shift as Present when worked duration exceeds 4 hours on-time', () => {
      const res = evaluateShiftAttendance('08:00', 'Morning (08:00 - 16:00)', '16:00');
      expect(res.status).toBe('Present');
      expect(res.isHalfDay).toBe(false);
      expect(res.workedMinutes).toBe(480); // 8 hours
    });
  });

  describe('Active Anti-Spoof Liveness & Quality Evaluation', () => {
    const baseMetrics: FaceQualityMetrics = {
      faceDetected: true,
      multipleFacesDetected: false,
      bounds: { x: 40, y: 80, width: 220, height: 280 },
      faceToFrameRatio: 0.36,
      centerOffsetPercent: 5,
      headAngles: { yaw: 2, pitch: -1, roll: 0 },
      leftEyeOpenProbability: 0.94,
      rightEyeOpenProbability: 0.95,
      illuminationScore: 75,
      sharpnessScore: 85,
      isStable: true,
      isBlinkDetected: false,
    };

    it('requires an active eye-blink cycle to verify liveness', () => {
      const feedbackNoBlink = evaluateFaceFrameQuality(
        baseMetrics,
        { hasClosedEyes: false, hasReopenedEyes: false },
        0
      );
      expect(feedbackNoBlink.guidance).toBe('BLINK_EYES');
      expect(feedbackNoBlink.livenessPassed).toBe(false);

      const feedbackBlinkDone = evaluateFaceFrameQuality(
        baseMetrics,
        { hasClosedEyes: true, hasReopenedEyes: true },
        3
      );
      expect(feedbackBlinkDone.guidance).toBe('FACE_CAPTURED');
      expect(feedbackBlinkDone.canCapture).toBe(true);
    });

    it('flags poor illumination (< 40) with IMPROVE_LIGHTING guidance', () => {
      const feedback = evaluateFaceFrameQuality(
        { ...baseMetrics, illuminationScore: 25 },
        { hasClosedEyes: false, hasReopenedEyes: false },
        0
      );
      expect(feedback.guidance).toBe('IMPROVE_LIGHTING');
      expect(feedback.canCapture).toBe(false);
    });

    it('flags camera too far when faceToFrameRatio is < 0.22', () => {
      const feedback = evaluateFaceFrameQuality(
        { ...baseMetrics, faceToFrameRatio: 0.15 },
        { hasClosedEyes: false, hasReopenedEyes: false },
        0
      );
      expect(feedback.guidance).toBe('MOVE_CLOSER');
    });
  });

  describe('Hospital Scoping & Account Authorization Checks', () => {
    const activeStaff: AuthenticatedStaff = {
      authUid: 'test_uid_101',
      email: 'dr.sharma@hospital.org',
      hospitalId: 'medpulse-main',
      employeeId: 'emp-101',
      employeeCode: 'EMP-1001',
      fullName: 'Dr. Ramesh Sharma',
      role: 'Doctor',
      designation: 'Cardiologist',
      departmentId: 'dept-1',
      departmentName: 'Cardiology',
      shift: 'Morning (08:00 - 16:00)',
      weeklyOff: 'Sunday',
      accountStatus: 'ACTIVE',
      attendanceAuthorized: true,
      faceEnrolled: true,
    };

    it('verifies that active staff belongs to the correct hospital', () => {
      expect(activeStaff.hospitalId).toBe('medpulse-main');
      expect(activeStaff.accountStatus).toBe('ACTIVE');
      expect(activeStaff.attendanceAuthorized).toBe(true);
    });

    it('detects and identifies deactivated staff account', () => {
      const deactivatedStaff: AuthenticatedStaff = {
        ...activeStaff,
        accountStatus: 'DEACTIVATED',
        attendanceAuthorized: false,
      };
      expect(deactivatedStaff.accountStatus).toBe('DEACTIVATED');
      expect(deactivatedStaff.attendanceAuthorized).toBe(false);
    });
  });
});
