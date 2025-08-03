import React from "react";
import { Tabs } from "expo-router";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Home, Zap, HelpCircle, Clipboard,BookCheck,Settings } from "lucide-react-native";

function TabBarIcon(props: {
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}) {
  const { IconComponent, color } = props;
  return <IconComponent size={18} color={color} style={{ marginBottom: -3 }} />;
}

export default function TabLayout() {
  return (
      <Tabs
          screenOptions={{
              // Disable the static render of the header on web
              // to prevent a hydration error in React Navigation v6.
              headerShown: useClientOnlyValue(false, true),
          }}>
          <Tabs.Screen
              name="index"
              options={{
                  title: "Overview",
                  tabBarIcon: ({ color }) => (
                      <TabBarIcon IconComponent={Home} color={color} />
                  ),
              }}
          />

          <Tabs.Screen
              name="tab1"
              options={{
                  title: "Practice",
                  tabBarIcon: ({ color }) => (
                      <TabBarIcon IconComponent={BookCheck} color={color} />
                  ),
              }}
          />
          <Tabs.Screen
              name="notes"
              options={{
                  title: "Notes",
                  tabBarIcon: ({ color }) => (
                      <TabBarIcon IconComponent={Clipboard} color={color} />
                  ),
              }}
          />
          <Tabs.Screen
              name="settings"
              options={{
                  title: "Settings",
                  tabBarIcon: ({ color }) => (
                      <TabBarIcon IconComponent={Settings} color={color} />
                  ),
              }}
          />
      </Tabs>
  );
}
