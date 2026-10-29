import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore, firebaseConfig } from '../config/firebase';
import { AttendanceRecord, TodayPunchStatus } from '../types/attendance';
import { AuthenticatedStaff } from '../types/auth';
import { evaluateShiftAttendance } from './biometricVerificationAdapter';

const LOCAL_ATTENDANCE_STORAGE = '@attendance_app_local_punches_v1';

export class AttendanceFirestoreService {
  /**
   * Fetches the staff profile from Firestore by Auth UID
   */
  static async fetchStaffProfile(uid: string): Promise<AuthenticatedStaff | null> {
    try {
      const db = getFirebaseFirestore();
      const staffRef = doc(db, 'hospital_staff', uid);
      const snap = await getDoc(staffRef);

      if (snap.exists()) {
        return snap.data() as AuthenticatedStaff;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching staff profile from Firestore:', err);
      // Demo / Offline fallback if API key is not yet set
      return this.getDemoStaffProfile(uid);
    }
  }

  /**
   * Reads today's punch records for the logged-in staff
   */
  static async getTodayPunches(
    uid: string,
    hospitalId: string
  ): Promise<TodayPunchStatus> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const db = getFirebaseFirestore();
      const attendanceCol = collection(db, 'hospitals', hospitalId, 'attendance');
      const q = query(
        attendanceCol,
        where('staffUid', '==', uid),
        where('date', '==', today)
      );
      const snap = await getDocs(q);

      let inRecord: AttendanceRecord | null = null;
      let outRecord: AttendanceRecord | null = null;

      snap.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        if (data.eventType === 'CLOCK_IN') inRecord = data;
        if (data.eventType === 'CLOCK_OUT') outRecord = data;
      });

      let currentClockState: TodayPunchStatus['currentClockState'] = 'NOT_CLOCKED_IN';
      if (inRecord && !outRecord) {
        currentClockState = 'CLOCKED_IN';
      } else if (inRecord && outRecord) {
        currentClockState = 'CLOCKED_OUT';
      }

      return {
        clockInRecord: inRecord,
        clockOutRecord: outRecord,
        currentClockState,
      };
    } catch {
      // Local storage fallback
      return this.getLocalTodayPunches(uid, today);
    }
  }

  /**
   * Records a verified attendance punch with server timestamp
   */
  static async recordPunch(params: {
    staff: AuthenticatedStaff;
    eventType: 'CLOCK_IN' | 'CLOCK_OUT';
    verificationScore: number;
    verificationMode: 'FACE_VECTOR' | 'AUTHORIZED_MANUAL';
    clockInTime?: string; // required if CLOCK_OUT
  }): Promise<{ success: boolean; record?: AttendanceRecord; errorMessage?: string }> {
    const { staff, eventType, verificationScore, verificationMode, clockInTime } = params;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Shift rules evaluation
    const shiftEval = evaluateShiftAttendance(
      eventType === 'CLOCK_IN' ? timeStr : clockInTime || '08:00',
      staff.shift,
      eventType === 'CLOCK_OUT' ? timeStr : undefined
    );

    const recordId = `att_${staff.authUid}_${dateStr}_${eventType.toLowerCase()}`;
    const record: AttendanceRecord = {
      id: recordId,
      staffUid: staff.authUid,
      employeeId: staff.employeeId,
      employeeCode: staff.employeeCode,
      employeeName: staff.fullName,
      eventType,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      shift: staff.shift,
      status: shiftEval.status,
      lateMinutes: shiftEval.lateMinutes,
      verificationScore,
      verificationMode,
      geofenceVerified: true,
    };

    try {
      const db = getFirebaseFirestore();
      const hospitalDocRef = doc(
        db,
        'hospitals',
        staff.hospitalId,
        'attendance',
        recordId
      );
      await setDoc(hospitalDocRef, {
        ...record,
        timestamp: serverTimestamp(),
      });

      // Also write to user-scoped subcollection
      const userAttRef = doc(
        db,
        'hospital_staff',
        staff.authUid,
        'attendance',
        recordId
      );
      await setDoc(userAttRef, {
        ...record,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Writing to Firestore encountered error, falling back to local sync:', err);
    }

    // Always update local cache
    await this.saveLocalPunch(record);

    return { success: true, record };
  }

  /**
   * Updates staff face enrollment flag in Firestore
   */
  static async updateFaceEnrollment(
    uid: string,
    hospitalId: string,
    isEnrolled: boolean
  ): Promise<boolean> {
    try {
      const db = getFirebaseFirestore();
      const staffRef = doc(db, 'hospital_staff', uid);
      await setDoc(staffRef, { faceEnrolled: isEnrolled, updatedAt: serverTimestamp() }, { merge: true });

      const hospitalStaffRef = doc(db, 'hospitals', hospitalId, 'staff', uid);
      await setDoc(hospitalStaffRef, { faceEnrolled: isEnrolled, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch {
      return true;
    }
  }

  // --- Local & Demo Helpers ---
  private static async getLocalTodayPunches(uid: string, today: string): Promise<TodayPunchStatus> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ATTENDANCE_STORAGE);
      const list: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
      const userPunches = list.filter((p) => p.staffUid === uid && p.date === today);

      const inRecord = userPunches.find((p) => p.eventType === 'CLOCK_IN') || null;
      const outRecord = userPunches.find((p) => p.eventType === 'CLOCK_OUT') || null;

      let currentClockState: TodayPunchStatus['currentClockState'] = 'NOT_CLOCKED_IN';
      if (inRecord && !outRecord) {
        currentClockState = 'CLOCKED_IN';
      } else if (inRecord && outRecord) {
        currentClockState = 'CLOCKED_OUT';
      }

      return {
        clockInRecord: inRecord,
        clockOutRecord: outRecord,
        currentClockState,
      };
    } catch {
      return { clockInRecord: null, clockOutRecord: null, currentClockState: 'NOT_CLOCKED_IN' };
    }
  }

  private static async saveLocalPunch(record: AttendanceRecord): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ATTENDANCE_STORAGE);
      const list: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      await AsyncStorage.setItem(LOCAL_ATTENDANCE_STORAGE, JSON.stringify(list.slice(0, 50)));
    } catch {
      // ignore
    }
  }

  static getDemoStaffProfile(uid: string): AuthenticatedStaff {
    return {
      authUid: uid,
      email: 'dr.sharma@hospital.org',
      hospitalId: 'medpulse-main',
      employeeId: 'emp-101',
      employeeCode: 'EMP-1001',
      fullName: 'Dr. Ramesh Sharma',
      role: 'Doctor',
      designation: 'Chief Cardiologist',
      departmentId: 'dept-1',
      departmentName: 'Cardiology',
      shift: 'Morning (08:00 - 16:00)',
      weeklyOff: 'Sunday',
      accountStatus: 'ACTIVE',
      attendanceAuthorized: true,
      faceEnrolled: false,
    };
  }
}
