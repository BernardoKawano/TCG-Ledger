import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { api } from "../../src/api/client";

interface CollectionItem {
  id: string;
  card_name: string | null;
  set_name: string | null;
  tcg_slug: string | null;
  quantity: number;
  current_price: number | null;
}

export default function Collection() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCollection = async () => {
    try {
      const { data } = await api.get("/collection");
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando coleção...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minha coleção</Text>
      <Text style={styles.subtitle}>{items.length} itens</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchCollection();
          }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.card_name || "Carta"}</Text>
            <Text style={styles.cardSet}>{item.set_name} • {item.tcg_slug}</Text>
            <View style={styles.row}>
              <Text style={styles.quantity}>Qtd: {item.quantity}</Text>
              {item.current_price != null && (
                <Text style={styles.price}>
                  ${(item.current_price * item.quantity).toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Coleção vazia. Escaneie cartas para adicionar.</Text>
        }
      />
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  cardSet: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  quantity: {
    fontSize: 14,
    color: "#64748b",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
  },
  empty: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 48,
    fontSize: 16,
  },
});
