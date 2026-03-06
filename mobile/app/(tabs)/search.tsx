import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

interface CardVariant {
  id: string;
  sku: string;
}

interface SearchCard {
  id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  image_url: string | null;
  card_set: { id: string; slug: string; name: string } | null;
  tcg: { id: string; slug: string; name: string } | null;
  variants: CardVariant[];
}

const CONDITION_OPTIONS = ["NM", "LP", "MP", "HP", "DMG"];
const FOIL_OPTIONS = ["sim", "não"];

export default function Search() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || "");
  const [results, setResults] = useState<SearchCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState<SearchCard | null>(null);
  const [addQuantity, setAddQuantity] = useState("1");
  const [addCondition, setAddCondition] = useState<string | null>(null);
  const [addFoil, setAddFoil] = useState<string | null>(null);
  const [addNotes, setAddNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const searchCards = useCallback(async (reset = false) => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const off = reset ? 0 : offset;
    try {
      const { data } = await api.get("/catalog/cards/search", {
        params: { q: query.trim(), limit, offset: off },
      });
      const newCards = data.cards || [];
      setResults((prev) => (reset ? newCards : [...prev, ...newCards]));
      setTotal(data.total || 0);
      setOffset(off + newCards.length);
    } catch {
      Alert.alert("Erro", "Falha ao buscar. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, [query, offset]);

  const loadMore = () => {
    if (!loading && results.length < total && results.length > 0) searchCards(false);
  };

  const openAddModal = (card: SearchCard) => {
    setAddModal(card);
    setAddQuantity("1");
    setAddCondition(null);
    setAddFoil(null);
    setAddNotes("");
  };

  const addToCollection = async () => {
    if (!addModal || !addModal.variants?.length) {
      Alert.alert("Erro", "Carta sem variante disponível.");
      return;
    }
    const variantId = addModal.variants[0].id;
    const qty = Math.max(1, parseInt(addQuantity, 10) || 1);
    setAdding(true);
    try {
      await api.post("/collection/items", {
        card_variant_id: variantId,
        quantity: qty,
        condition: addCondition || undefined,
        foil: addFoil || undefined,
        notes: addNotes || undefined,
      });
      setAddModal(null);
      Alert.alert("Sucesso", `${addModal.name} adicionada à coleção.`, [
        { text: "Ver coleção", onPress: () => router.push("/(tabs)/collection") },
        { text: "Continuar", onPress: () => {} },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível adicionar à coleção.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>Buscar cartas</Text>
      <Text style={styles.subtitle}>Digite o nome ou número da carta</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Ex: Pikachu, Charizard..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={() => searchCards(true)}
          returnKeyType="search"
        />
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
          onPress={() => searchCards(true)}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Ionicons name="search" size={22} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim() && !loading ? (
            <Text style={styles.empty}>Nenhuma carta encontrada para &quot;{query}&quot;</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => openAddModal(item)}
          >
            <View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.card_set?.name || "—"} • {item.tcg?.slug || "—"}
              </Text>
            </View>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </Pressable>
        )}
      />

      <Modal
        visible={!!addModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setAddModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{addModal?.name}</Text>
            <Text style={styles.modalSubtitle}>{addModal?.card_set?.name}</Text>

            <Text style={styles.modalLabel}>Quantidade</Text>
            <TextInput
              style={styles.modalInput}
              value={addQuantity}
              onChangeText={setAddQuantity}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalLabel}>Condição</Text>
            <View style={styles.chipRow}>
              {CONDITION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.chip, addCondition === opt && styles.chipSelected]}
                  onPress={() => setAddCondition(addCondition === opt ? null : opt)}
                >
                  <Text style={[styles.chipText, addCondition === opt && styles.chipTextSelected]}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Foil</Text>
            <View style={styles.chipRow}>
              {FOIL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.chip, addFoil === opt && styles.chipSelected]}
                  onPress={() => setAddFoil(addFoil === opt ? null : opt)}
                >
                  <Text style={[styles.chipText, addFoil === opt && styles.chipTextSelected]}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Notas</Text>
            <TextInput
              style={[styles.modalInput, styles.notesInput]}
              value={addNotes}
              onChangeText={setAddNotes}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.modalCancel, pressed && styles.buttonPressed]}
                onPress={() => setAddModal(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalConfirm,
                  adding && styles.buttonDisabled,
                  pressed && !adding && styles.buttonPressed,
                ]}
                onPress={addToCollection}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Adicionar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.xl,
    ...typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    color: colors.text,
    ...typography.base,
  },
  searchButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  list: {
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardPressed: { opacity: 0.9 },
  cardName: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  cardMeta: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.base,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 24,
  },
  modalTitle: {
    ...typography.lg,
    ...typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalLabel: {
    ...typography.sm,
    ...typography.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    color: colors.text,
    ...typography.base,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.sm,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primaryForeground,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  modalCancel: {
    backgroundColor: colors.surfaceElevated,
  },
  modalConfirm: {
    backgroundColor: colors.primary,
  },
  modalCancelText: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  modalConfirmText: {
    ...typography.base,
    ...typography.semibold,
    color: colors.primaryForeground,
  },
});
