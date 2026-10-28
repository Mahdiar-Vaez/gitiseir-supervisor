import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Vazirmatn_300Light,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CustomBottomTabBar, TabRoute } from '@/components/navigation/CustomBottomTabBar';
import LoginScreen from './login';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  // If not authenticated, render LoginScreen directly without router redirect loop
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        tabBar={(props) => {
          const currentRoute = props.state.routes[props.state.index].name;

          const activeTab: TabRoute =
            currentRoute === 'calendar'
              ? 'calendar'
              : currentRoute === 'profile'
              ? 'profile'
              : 'home';

          return (
            <CustomBottomTabBar
              activeTab={activeTab}
              onTabChange={(target) => {
                if (target === 'home') {
                  router.navigate('/' as any);
                } else if (target === 'calendar') {
                  router.navigate('/calendar' as any);
                } else if (target === 'profile') {
                  router.navigate('/profile' as any);
                }
              }}
            />
          );
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'خانه' }} />
        <Tabs.Screen name="calendar" options={{ title: 'تقویم کاری' }} />
        <Tabs.Screen name="profile" options={{ title: 'کارت راننده' }} />
        <Tabs.Screen
          name="ratings"
          options={{
            title: 'امتیاز و نظرسنجی',
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Vazirmatn_300Light,
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0B0F19',
        }}
      >
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </AppThemeProvider>
  );
}
