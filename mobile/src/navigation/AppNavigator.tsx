import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { QuestionBankScreen } from '../screens/QuestionBankScreen';
import { PaperWizardScreen } from '../screens/PaperWizardScreen';
import { PaperReviewScreen } from '../screens/PaperReviewScreen';
import { PdfPreviewScreen } from '../screens/PdfPreviewScreen';
import { SavedPapersScreen } from '../screens/SavedPapersScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="QuestionBankTab"
        component={QuestionBankScreen}
        options={{
          tabBarLabel: 'Bank',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="GenerateTab"
        component={PaperWizardScreen}
        options={{
          tabBarLabel: 'Generate',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚡</Text>,
        }}
      />
      <Tab.Screen
        name="SavedPapersTab"
        component={SavedPapersScreen}
        options={{
          tabBarLabel: 'Vault',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📁</Text>,
        }}
      />
      <Tab.Screen
        name="SubscriptionTab"
        component={SubscriptionScreen}
        options={{
          tabBarLabel: '₹299 Pro',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>💎</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="PaperWizard" component={PaperWizardScreen} />
        <Stack.Screen name="PaperReview" component={PaperReviewScreen} />
        <Stack.Screen name="PdfPreview" component={PdfPreviewScreen} />
        <Stack.Screen name="SavedPapers" component={SavedPapersScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="QuestionBank" component={QuestionBankScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
