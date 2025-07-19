import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// আমাদের স্ক্রিনগুলো ইম্পোর্ট করুন
import HeroScreen from './src/screens/HeroScreen';
import ScannerScreen from './src/screens/ScannerScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* অ্যাপের প্রথম স্ক্রিন */}
        <Stack.Screen
          name="Home"
          component={HeroScreen}
          options={{headerShown: false}}
        />
        {/* স্ক্যানার স্ক্রিন */}
        <Stack.Screen 
          name="Scanner" 
          component={ScannerScreen}
          options={{ title: 'Scan QR Code' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;