export type AttendanceStatus = 'Present' | 'Late' | 'Half-Day' | 'Absent';
export type VerificationMode = 'FACE_VECTOR' | 'AUTHORIZED_MANUAL';

export interface AttendanceRecord {
  id: string;
  staffUid: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  eventType: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string; // ISO 8601 string or serverTimestamp representation
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  shift: string;
  status: AttendanceStatus;
  lateMinutes: number;
  verificationScore: number;
  verificationMode: VerificationMode;
  geofenceVerified: boolean;
  notes?: string;
}

export interface TodayPunchStatus {
  clockInRecord: AttendanceRecord | null;
  clockOutRecord: AttendanceRecord | null;
  currentClockState: 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT';
  workMinutes?: number;
}
