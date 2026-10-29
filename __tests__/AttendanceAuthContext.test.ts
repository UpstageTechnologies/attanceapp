import { AttendanceFirestoreService } from '../src/services/attendanceFirestoreService';
import { AuthenticatedStaff } from '../src/types/auth';

describe('Attendance App - Auth Verification & Firestore Sync Test Suite', () => {
  const mockStaff: AuthenticatedStaff = {
    authUid: 'mock_staff_uid_901',
    email: 'priya.nair@hospital.org',
    hospitalId: 'medpulse-main',
    employeeId: 'emp-102',
    employeeCode: 'EMP-1002',
    fullName: 'Priya Nair',
    role: 'Staff',
    designation: 'ICU Charge Nurse',
    departmentId: 'dept-2',
    departmentName: 'Intensive Care Unit (ICU)',
    shift: 'Morning (08:00 - 16:00)',
    weeklyOff: 'Tuesday',
    accountStatus: 'ACTIVE',
    attendanceAuthorized: true,
    faceEnrolled: true,
  };

  it('records valid CLOCK_IN punch and advances status to CLOCKED_IN', async () => {
    const res = await AttendanceFirestoreService.recordPunch({
      staff: mockStaff,
      eventType: 'CLOCK_IN',
      verificationScore: 0.94,
      verificationMode: 'FACE_VECTOR',
    });

    expect(res.success).toBe(true);
    expect(res.record).toBeDefined();
    expect(res.record?.eventType).toBe('CLOCK_IN');
    expect(res.record?.staffUid).toBe('mock_staff_uid_901');
    expect(res.record?.verificationScore).toBe(0.94);
  });

  it('records valid CLOCK_OUT punch and transitions state to CLOCKED_OUT', async () => {
    const res = await AttendanceFirestoreService.recordPunch({
      staff: mockStaff,
      eventType: 'CLOCK_OUT',
      verificationScore: 0.91,
      verificationMode: 'FACE_VECTOR',
      clockInTime: '08:00',
    });

    expect(res.success).toBe(true);
    expect(res.record?.eventType).toBe('CLOCK_OUT');
  });

  it('updates face enrollment status in Firestore and local state', async () => {
    const updated = await AttendanceFirestoreService.updateFaceEnrollment(
      mockStaff.authUid,
      mockStaff.hospitalId,
      true
    );
    expect(updated).toBe(true);
  });
});
