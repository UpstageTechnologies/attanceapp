import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AttendanceAuthProvider } from './src/context/AttendanceAuthContext';
import { AttendanceNavigator } from './src/navigation/AttendanceNavigator';
import { colors } from './src/theme/colors';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <AttendanceAuthProvider>
          <AttendanceNavigator />
        </AttendanceAuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
