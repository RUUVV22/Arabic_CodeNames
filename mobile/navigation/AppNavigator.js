import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { JoinRoomScreen } from '../screens/JoinRoomScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { GameScreen } from '../screens/GameScreen';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
import { parseRoomCode } from '../utils/deepLinks';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

function normalizeJoinUrl(url) {
  const roomCode = parseRoomCode(url);
  if (!roomCode || /\/join\/[A-Z2-9]{5}(?:[/?#]|$)/i.test(String(url))) return url;
  return Linking.createURL(`join/${roomCode}`);
}

const linking = {
  prefixes: ['codenames://', Linking.createURL('/')],
  async getInitialURL() {
    return normalizeJoinUrl(await Linking.getInitialURL());
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => listener(normalizeJoinUrl(url)));
    return () => subscription.remove();
  },
  config: {
    screens: {
      JoinRoom: 'join/:roomCode',
    },
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking} theme={{
      dark: true,
      colors: {
        primary: colors.gold,
        background: colors.ink,
        card: colors.inkSoft,
        text: colors.paper,
        border: colors.line,
        notification: colors.red,
      },
      fonts: {
        regular: { fontFamily: 'Tajawal_400Regular', fontWeight: '400' },
        medium: { fontFamily: 'Tajawal_500Medium', fontWeight: '500' },
        bold: { fontFamily: 'Tajawal_700Bold', fontWeight: '700' },
        heavy: { fontFamily: 'Tajawal_800ExtraBold', fontWeight: '800' },
      },
    }}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
        <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
