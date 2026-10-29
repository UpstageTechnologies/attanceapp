import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AttendanceStackParamList } from '../types/navigation';
import { useAttendanceAuth } from '../context/AttendanceAuthContext';
import { AttendanceLoginScreen } from '../screens/auth/AttendanceLoginScreen';
import { AttendanceHomeScreen } from '../screens/attendance/AttendanceHomeScreen';
import { LoadingState } from '../components/common/LoadingState';

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

export const AttendanceNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAttendanceAuth();

  if (isLoading) {
    return <LoadingState message="Connecting to MedPulse Attendance Network..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={AttendanceLoginScreen} />
        ) : (
          <Stack.Screen name="Home" component={AttendanceHomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
