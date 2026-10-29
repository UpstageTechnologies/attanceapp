/* eslint-env jest */
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      getItem: jest.fn(async (key: string) => {
        return store[key] || null;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
      getAllKeys: jest.fn(async () => Object.keys(store)),
      multiGet: jest.fn(async (keys: string[]) => keys.map((k) => [k, store[k] || null])),
      multiSet: jest.fn(async (entries: [string, string][]) => {
        entries.forEach(([k, v]) => {
          store[k] = v;
        });
      }),
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackItem: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    SearchBar: View,
    compatibilityFlags: {
      usesNewAndroidHeaderHeightImplementation: false,
    },
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        const MockIcon = (props: any) => React.createElement(View, { testID: `icon-${String(prop)}`, ...props });
        MockIcon.displayName = String(prop);
        return MockIcon;
      },
    }
  );
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, props),
    Svg: (props: any) => React.createElement(View, props),
    Circle: (props: any) => React.createElement(View, props),
    Rect: (props: any) => React.createElement(View, props),
    Path: (props: any) => React.createElement(View, props),
  };
});

// Mock Firebase SDK for unit testing
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'mockApp' })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: 'mockApp' })),
  deleteApp: jest.fn(async () => {}),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  initializeAuth: jest.fn(() => ({ currentUser: null })),
  createUserWithEmailAndPassword: jest.fn(async (_auth, email) => ({
    user: { uid: `mock_uid_${email.replace(/[^a-zA-Z0-9]/g, '_')}` },
  })),
  signInWithEmailAndPassword: jest.fn(async (_auth, email) => ({
    user: { uid: `mock_uid_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email },
  })),
  sendPasswordResetEmail: jest.fn(async () => {}),
  signOut: jest.fn(async () => {}),
  getReactNativePersistence: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...paths) => paths.join('/')),
  setDoc: jest.fn(async () => {}),
  updateDoc: jest.fn(async () => {}),
  getDoc: jest.fn(async (path) => ({
    exists: () => true,
    data: () => ({
      authUid: path,
      fullName: 'Dr. Ramesh Sharma',
      employeeCode: 'EMP-1001',
      role: 'Doctor',
      departmentName: 'Cardiology',
      shift: 'Morning (08:00 - 16:00)',
      accountStatus: 'ACTIVE',
      attendanceAuthorized: true,
      faceEnrolled: true,
      hospitalId: 'medpulse-main',
    }),
  })),
  serverTimestamp: jest.fn(() => new Date().toISOString()),
}));
