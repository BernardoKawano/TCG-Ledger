import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/authStore";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>TCG Ledger</Text>
      <Text style={styles.subtitle}>Portfolio tracker para colecionadores</Text>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push("/(tabs)/scan")}
      >
        <Text style={styles.cardTitle}>Escanear carta</Text>
        <Text style={styles.cardDesc}>Escolha uma imagem da galeria para identificar</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push("/(tabs)/collection")}
      >
        <Text style={styles.cardTitle}>Minha coleção</Text>
        <Text style={styles.cardDesc}>Veja e gerencie suas cartas</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push("/(tabs)/portfolio")}
      >
        <Text style={styles.cardTitle}>Portfólio</Text>
        <Text style={styles.cardDesc}>Valor total e tendências</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push("/(tabs)/alerts")}
      >
        <Text style={styles.cardTitle}>Alertas</Text>
        <Text style={styles.cardDesc}>Avisos de variação de preço</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography["2xl"],
    ...typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.base,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTitle: {
    ...typography.lg,
    ...typography.semibold,
    color: colors.text,
  },
  cardDesc: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  logout: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  logoutPressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: colors.error,
    ...typography.sm,
  },
});
