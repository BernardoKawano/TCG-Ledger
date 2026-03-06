import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";

export default function Home() {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TCG Ledger</Text>
      <Text style={styles.subtitle}>Portfolio tracker para colecionadores</Text>
      <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/scan")}>
        <Text style={styles.cardTitle}>Escanear carta</Text>
        <Text style={styles.cardDesc}>Use a câmera para identificar cartas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/collection")}>
        <Text style={styles.cardTitle}>Minha coleção</Text>
        <Text style={styles.cardDesc}>Veja e gerencie suas cartas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/portfolio")}>
        <Text style={styles.cardTitle}>Portfólio</Text>
        <Text style={styles.cardDesc}>Valor total e tendências</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
  },
  cardDesc: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  logout: {
    marginTop: 32,
    alignItems: "center",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
  },
});
