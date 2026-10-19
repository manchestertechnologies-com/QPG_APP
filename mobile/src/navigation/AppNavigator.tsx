import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
import { Home, BookOpen, Sparkles, FolderDown, Crown } from 'lucide-react-native';
import { SavedPapersScreen } from '../screens/SavedPapersScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { layout } from '../theme/tokens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      {focused && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: color,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}

function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.surfaceBorder,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 1,
          maxWidth: Platform.OS === 'web' ? layout.maxContentWidth : undefined,
          width: '100%',
          alignSelf: 'center',
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="QuestionBankTab"
        component={QuestionBankScreen}
        options={{
          tabBarLabel: 'Bank',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GenerateTab"
        component={PaperWizardScreen}
        options={{
          tabBarLabel: 'Generate',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: focused ? theme.primary : 'rgba(99, 102, 241, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 2,
              }}
            >
              <Sparkles size={20} color={focused ? '#FFFFFF' : theme.primary} strokeWidth={2.2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SavedPapersTab"
        component={SavedPapersScreen}
        options={{
          tabBarLabel: 'Vault',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={FolderDown} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SubscriptionTab"
        component={SubscriptionScreen}
        options={{
          tabBarLabel: '₹299 Pro',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Crown} color={color} focused={focused} />,
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
