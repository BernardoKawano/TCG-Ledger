import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { api } from "../../src/api/client";

interface PortfolioData {
  total_value: number;
  currency: string;
  daily_change: { amount: number; percent: number };
  weekly_change: { amount: number; percent: number };
  by_tcg: { tcg_slug: string; value: number; count: number }[];
}

export default function Portfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const { data: res } = await api.get("/collection/portfolio");
      setData(res);
    } catch {
      setData(null);
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
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando portfólio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
              {data.currency} {data.total_value.toFixed(2)}
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
                    {data.currency} {t.value.toFixed(2)} ({t.count} itens)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.empty}>Adicione cartas à coleção para ver o portfólio.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 48,
  },
  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 24,
  },
  totalCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
  },
  changes: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  changeBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  changeLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  positive: { color: "#22c55e" },
  negative: { color: "#ef4444" },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 12,
  },
  tcgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    marginBottom: 8,
  },
  tcgName: {
    color: "#f8fafc",
    fontSize: 14,
  },
  tcgValue: {
    color: "#94a3b8",
    fontSize: 14,
  },
  empty: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 48,
    fontSize: 16,
  },
});
