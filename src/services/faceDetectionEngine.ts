export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeadEulerAngles {
  yaw: number;   // Left-right rotation (degrees: ideal near 0)
  pitch: number; // Up-down tilt (degrees: ideal near 0)
  roll: number;  // Head tilt sideways (degrees: ideal near 0)
}

export interface FaceQualityMetrics {
  faceDetected: boolean;
  multipleFacesDetected: boolean;
  bounds: FaceBounds | null;
  faceToFrameRatio: number; // 0.0 to 1.0 (ideal: 0.25 - 0.55)
  centerOffsetPercent: number; // 0% to 100% from center
  headAngles: HeadEulerAngles;
  leftEyeOpenProbability: number; // 0.0 to 1.0
  rightEyeOpenProbability: number; // 0.0 to 1.0
  illuminationScore: number; // 0 to 100 (ideal: 45 - 85)
  sharpnessScore: number; // 0 to 100 (ideal: >= 65)
  isStable: boolean;
  isBlinkDetected: boolean;
}

export type LiveGuidanceState =
  | 'READY'
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'MOVE_CLOSER'
  | 'MOVE_BACK'
  | 'CENTER_FACE'
  | 'LOOK_STRAIGHT'
  | 'IMPROVE_LIGHTING'
  | 'REDUCE_GLARE'
  | 'HOLD_STILL'
  | 'BLINK_EYES'
  | 'FACE_CAPTURED';

export interface ValidationFeedback {
  guidance: LiveGuidanceState;
  instructionText: string;
  isCompliant: boolean;
  canCapture: boolean;
  livenessPassed: boolean;
}

/**
 * Validates face frame metrics against clinical/enterprise biometric capture standards
 */
export function evaluateFaceFrameQuality(
  metrics: FaceQualityMetrics,
  blinkHistory: { hasClosedEyes: boolean; hasReopenedEyes: boolean },
  stableFrameCount: number
): ValidationFeedback {
  // 1. No face
  if (!metrics.faceDetected || !metrics.bounds) {
    return {
      guidance: 'NO_FACE',
      instructionText: 'Position your face within the green oval',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 2. Multiple faces detected
  if (metrics.multipleFacesDetected) {
    return {
      guidance: 'MULTIPLE_FACES',
      instructionText: 'Multiple faces detected. Ensure only one person is in frame',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 3. Face size / Distance from camera
  if (metrics.faceToFrameRatio < 0.22) {
    return {
      guidance: 'MOVE_CLOSER',
      instructionText: 'Move closer to the camera',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }
  if (metrics.faceToFrameRatio > 0.68) {
    return {
      guidance: 'MOVE_BACK',
      instructionText: 'Move slightly back',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 4. Centering within the oval
  if (metrics.centerOffsetPercent > 18) {
    return {
      guidance: 'CENTER_FACE',
      instructionText: 'Center your face inside the target frame',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 5. Head angle / Frontal alignment (Yaw & Pitch should be within ±14°)
  if (
    Math.abs(metrics.headAngles.yaw) > 14 ||
    Math.abs(metrics.headAngles.pitch) > 14 ||
    Math.abs(metrics.headAngles.roll) > 14
  ) {
    return {
      guidance: 'LOOK_STRAIGHT',
      instructionText: 'Look straight at the camera lens',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 6. Illumination / Lighting
  if (metrics.illuminationScore < 40) {
    return {
      guidance: 'IMPROVE_LIGHTING',
      instructionText: 'Lighting is too dark. Move to a well-lit area',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }
  if (metrics.illuminationScore > 92) {
    return {
      guidance: 'REDUCE_GLARE',
      instructionText: 'Excessive backlight or glare. Adjust your position',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 7. Sharpness / Blur
  if (metrics.sharpnessScore < 60) {
    return {
      guidance: 'HOLD_STILL',
      instructionText: 'Hold still to reduce motion blur',
      isCompliant: false,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 8. Active Anti-Spoof Liveness: Blink verification
  const isLivenessComplete = blinkHistory.hasClosedEyes && blinkHistory.hasReopenedEyes;
  if (!isLivenessComplete) {
    return {
      guidance: 'BLINK_EYES',
      instructionText: 'Blink your eyes to verify liveness',
      isCompliant: true,
      canCapture: false,
      livenessPassed: false,
    };
  }

  // 9. Frame Stability across consecutive frames
  if (stableFrameCount < 3) {
    return {
      guidance: 'HOLD_STILL',
      instructionText: 'Face verified. Hold still for capture...',
      isCompliant: true,
      canCapture: false,
      livenessPassed: true,
    };
  }

  // 10. All checks passed!
  return {
    guidance: 'FACE_CAPTURED',
    instructionText: 'Face quality and liveness confirmed',
    isCompliant: true,
    canCapture: true,
    livenessPassed: true,
  };
}
