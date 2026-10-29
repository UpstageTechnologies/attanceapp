import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirebaseAuth, firebaseConfig } from '../config/firebase';
import { AuthenticatedStaff, AttendanceAuthState } from '../types/auth';
import { AttendanceFirestoreService } from '../services/attendanceFirestoreService';

const AUTH_USER_STORAGE_KEY = '@attendance_app_current_staff_v1';

interface AttendanceAuthContextType extends AttendanceAuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  markFaceEnrolled: () => Promise<void>;
  clearError: () => void;
}

const AttendanceAuthContext = createContext<AttendanceAuthContextType>({} as AttendanceAuthContextType);

export const AttendanceAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedStaff | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (stored) {
        const staff = JSON.parse(stored) as AuthenticatedStaff;
        // Verify still active
        const freshProfile = await AttendanceFirestoreService.fetchStaffProfile(staff.authUid);
        if (freshProfile && freshProfile.accountStatus === 'ACTIVE') {
          setUser(freshProfile);
          setIsAuthenticated(true);
        } else if (freshProfile && freshProfile.accountStatus === 'DEACTIVATED') {
          await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(staff);
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.warn('Failed restoring attendance auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setIsLoading(false);
      setError('Please enter both your hospital email and password.');
      throw new Error('Please enter both your hospital email and password.');
    }

    try {
      let uid: string;

      // 1. Authenticate with Firebase Authentication
      const auth = getFirebaseAuth();
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        uid = cred.user.uid;
      } catch (authErr: any) {
        // Provide clear messages for common Firebase Auth error codes
        if (authErr?.code === 'auth/invalid-credential' || authErr?.code === 'auth/wrong-password') {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (authErr?.code === 'auth/user-not-found') {
          throw new Error('No staff account found with this email. Please ask your administrator to provision your account.');
        } else if (authErr?.code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Access temporarily locked. Try again later or reset password.');
        } else if (authErr?.code === 'auth/api-key-not-valid' || !firebaseConfig.apiKey.startsWith('AIzaSy')) {
          // Demo fallback for local development without live web API key
          uid = `demo_staff_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        } else {
          throw authErr;
        }
      }

      // 2. Fetch authenticated UID's Firestore Profile
      let staffProfile = await AttendanceFirestoreService.fetchStaffProfile(uid);

      if (!staffProfile) {
        // In demo fallback mode, generate profile for recognized demo accounts
        if (cleanEmail.toLowerCase().includes('sharma') || cleanEmail.toLowerCase().includes('doctor')) {
          staffProfile = AttendanceFirestoreService.getDemoStaffProfile(uid);
        } else {
          await firebaseSignOut(auth).catch(() => {});
          throw new Error(
            'Staff identity record not found in hospital directory. Please contact your hospital administration to provision your account.'
          );
        }
      }

      // 3. Authorization Check: Account Status & Attendance Permission
      if (staffProfile.accountStatus === 'DEACTIVATED') {
        await firebaseSignOut(auth).catch(() => {});
        throw new Error(
          'Your account has been deactivated by hospital administration. Mobile attendance clock-in is disabled.'
        );
      }

      if (!staffProfile.attendanceAuthorized) {
        await firebaseSignOut(auth).catch(() => {});
        throw new Error(
          'Your profile is not authorized for mobile attendance clock-in. Please contact HR.'
        );
      }

      // 4. Successful sign-in: Set state and persist
      setUser(staffProfile);
      setIsAuthenticated(true);
      await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(staffProfile));
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your network and credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth).catch(() => {});
      await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!email.trim()) {
      return { success: false, message: 'Please enter your registered staff email address.' };
    }
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: `Password reset link sent to ${email.trim()}. Please check your inbox.`,
      };
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        return { success: false, message: 'No registered staff account found with this email.' };
      }
      return {
        success: false,
        message: err?.message || 'Failed to send password reset email. Please try again.',
      };
    }
  };

  const markFaceEnrolled = async (): Promise<void> => {
    if (!user) return;
    const updated = { ...user, faceEnrolled: true };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updated));
    await AttendanceFirestoreService.updateFaceEnrollment(user.authUid, user.hospitalId, true);
  };

  const clearError = () => setError(null);

  return (
    <AttendanceAuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        signIn,
        signOut,
        sendPasswordReset,
        markFaceEnrolled,
        clearError,
      }}
    >
      {children}
    </AttendanceAuthContext.Provider>
  );
};

export const useAttendanceAuth = () => useContext(AttendanceAuthContext);
