import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useNetworkSync } from "./hooks/useNetworkSync";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import MyTasksScreen from "./screens/MyTasksScreen";
import CollaborativeTasksScreen from "./screens/CollaborativeTasksScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProjectDetail from "./screens/ProjectDetail";
import { colors, radius } from "./theme/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
};

const TAB_ICONS = {
  Dashboard: { active: "home", inactive: "home-outline" },
  MyTasks: { active: "checkbox", inactive: "checkbox-outline" },
  Projects: { active: "people", inactive: "people-outline" },
  Profile: { active: "person-circle", inactive: "person-circle-outline" },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 4,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSet = TAB_ICONS[route.name] || {
            active: "ellipse",
            inactive: "ellipse-outline",
          };
          return (
            <Ionicons
              name={focused ? iconSet.active : iconSet.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name="MyTasks"
        component={MyTasksScreen}
        options={{ title: "My Tasks" }}
      />
      <Tab.Screen
        name="Projects"
        component={CollaborativeTasksScreen}
        options={{ title: "Projects" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>
            D
          </Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetail} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  // start network sync hook
  useNetworkSync();

  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
