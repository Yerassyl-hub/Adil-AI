import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

// Screens
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { DocumentBuilderScreen } from '../screens/DocumentBuilderScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DebugScreen } from '../screens/DebugScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home.greeting'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Чат',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('history.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthorized } = useAuthStore();
  const { onboarded } = useSettingsStore();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Bootstrap auth on app start
    useAuthStore.getState().bootstrap();
  }, []);

  // Auto-navigate when state changes
  useEffect(() => {
    if (!navigationRef.isReady()) return;

    if (!onboarded) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    } else if (!isAuthorized) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else {
      navigationRef.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [onboarded, isAuthorized, navigationRef]);

  // Determine initial route
  const getInitialRouteName = () => {
    if (!onboarded) return 'Onboarding';
    if (!isAuthorized) return 'Login';
    return 'MainTabs';
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="DocumentBuilder"
          component={DocumentBuilderScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="Debug"
          component={DebugScreen}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

