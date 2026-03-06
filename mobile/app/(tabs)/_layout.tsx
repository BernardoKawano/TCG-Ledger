import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: { backgroundColor: "#1e293b" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarLabel: "Início" }} />
      <Tabs.Screen name="scan" options={{ title: "Escanear", tabBarLabel: "Escanear" }} />
      <Tabs.Screen name="collection" options={{ title: "Coleção", tabBarLabel: "Coleção" }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfólio", tabBarLabel: "Portfólio" }} />
    </Tabs>
  );
}
