export type UserRole = 'Doctor' | 'Staff' | 'Admin' | 'Owner';

export interface AuthenticatedStaff {
  authUid: string;
  email: string;
  hospitalId: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  role: UserRole;
  designation: string;
  departmentId: string;
  departmentName: string;
  shift: string;
  weeklyOff: string;
  accountStatus: 'ACTIVE' | 'DEACTIVATED';
  attendanceAuthorized: boolean;
  faceEnrolled: boolean;
  enrolledEmbeddingHashed?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceAuthState {
  user: AuthenticatedStaff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
