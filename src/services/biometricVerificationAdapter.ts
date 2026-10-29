import { AttendanceStatus } from '../types/attendance';

export const DEFAULT_HOSPITAL_COORDS = {
  latitude: 12.9716, // Bangalore Central Hospital District
  longitude: 77.5946,
  radiusMeters: 300,
};

/**
 * Calculates Haversine distance in meters between two GPS coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface ShiftEvaluation {
  status: AttendanceStatus;
  lateMinutes: number;
  isHalfDay: boolean;
  workedMinutes?: number;
}

/**
 * Evaluates shift rules:
 * - 15 minutes grace period
 * - >15m = Late
 * - Worked hours < 4 hours = Half-Day
 */
export function evaluateShiftAttendance(
  clockInTime: string, // "08:15"
  shift: string,
  clockOutTime?: string // "16:00"
): ShiftEvaluation {
  let shiftStartHour = 8;
  let shiftStartMin = 0;

  if (shift.includes('Morning')) {
    shiftStartHour = 8;
  } else if (shift.includes('Evening')) {
    shiftStartHour = 14;
  } else if (shift.includes('Night')) {
    shiftStartHour = 22;
  } else if (shift.includes('General')) {
    shiftStartHour = 9;
  }

  const [inHourStr, inMinStr] = clockInTime.split(':');
  const inHour = parseInt(inHourStr, 10);
  const inMin = parseInt(inMinStr, 10);

  const scheduledMinutes = shiftStartHour * 60 + shiftStartMin;
  const actualMinutes = inHour * 60 + inMin;
  const lateMinutes = Math.max(0, actualMinutes - scheduledMinutes);

  let isHalfDay = false;
  let status: AttendanceStatus = lateMinutes > 15 ? 'Late' : 'Present';
  let workedMinutes: number | undefined;

  if (clockOutTime) {
    const [outHourStr, outMinStr] = clockOutTime.split(':');
    const outHour = parseInt(outHourStr, 10);
    const outMin = parseInt(outMinStr, 10);
    const outMinutes = outHour * 60 + outMin;

    workedMinutes = Math.max(0, outMinutes - actualMinutes);
    if (workedMinutes < 240) {
      // Worked less than 4 hours
      isHalfDay = true;
      status = 'Half-Day';
    }
  }

  return {
    status,
    lateMinutes,
    isHalfDay,
    workedMinutes,
  };
}
