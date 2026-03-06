import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../src/api/client";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

interface PortfolioData {
  total_value: number;
  currency: string;
  daily_change: { amount: number; percent: number };
  weekly_change: { amount: number; percent: number };
  by_tcg: { tcg_slug: string; value: number; count: number }[];
}

export default function Portfolio() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setFetchError(null);
    try {
      const { data: res } = await api.get("/collection/portfolio");
      setData(res);
    } catch {
      setData(null);
      setFetchError("Falha ao carregar. Verifique a conexão e tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando portfólio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xxl },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          fetchPortfolio();
        }} />
      }
    >
      <Text style={styles.title}>Portfólio</Text>
      {data ? (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Valor total</Text>
            <Text style={styles.totalValue}>
              {data.currency}{" "}
              {data.total_value.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.changes}>
            <View style={styles.changeBox}>
              <Text style={styles.changeLabel}>24h</Text>
              <Text
                style={[
                  styles.changeValue,
                  data.daily_change.percent >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {data.daily_change.percent >= 0 ? "+" : ""}
                {data.daily_change.percent.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.changeBox}>
              <Text style={styles.changeLabel}>7 dias</Text>
              <Text
                style={[
                  styles.changeValue,
                  data.weekly_change.percent >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {data.weekly_change.percent >= 0 ? "+" : ""}
                {data.weekly_change.percent.toFixed(1)}%
              </Text>
            </View>
          </View>
          {data.by_tcg?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por TCG</Text>
              {data.by_tcg.map((t) => (
                <View key={t.tcg_slug} style={styles.tcgRow}>
                  <Text style={styles.tcgName}>{t.tcg_slug}</Text>
                  <Text style={styles.tcgValue}>
                    {data.currency}{" "}
                    {t.value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ({t.count} itens)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : fetchError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>{fetchError}</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            onPress={fetchPortfolio}
          >
            <Text style={styles.emptyButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Adicione cartas à coleção para ver o portfólio.</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <Text style={styles.emptyButtonText}>Escanear carta</Text>
          </Pressable>
        </View>
      )}
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
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    ...typography.sm,
  },
  title: {
    ...typography.xl,
    ...typography.bold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  totalLabel: {
    ...typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  totalValue: {
    ...typography["3xl"],
    ...typography.bold,
    color: colors.text,
  },
  changes: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  changeBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  changeLabel: {
    ...typography.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  changeValue: {
    ...typography.lg,
    ...typography.bold,
  },
  positive: { color: colors.success },
  negative: { color: colors.error },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tcgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  tcgName: {
    color: colors.text,
    ...typography.sm,
  },
  tcgValue: {
    color: colors.textMuted,
    ...typography.sm,
  },
  emptyContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  empty: {
    color: colors.textSubtle,
    textAlign: "center",
    ...typography.base,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  emptyButtonText: {
    color: colors.primaryForeground,
    ...typography.base,
    ...typography.semibold,
  },
  emptyButtonPressed: {
    opacity: 0.9,
  },
});
