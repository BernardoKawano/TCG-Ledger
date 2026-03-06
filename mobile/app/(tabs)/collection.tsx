import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  Share,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const DEFAULT_CURRENCY = "USD";

interface CollectionItem {
  id: string;
  card_name: string | null;
  set_name: string | null;
  tcg_slug: string | null;
  quantity: number;
  current_price: number | null;
  condition?: string | null;
  foil?: string | null;
  notes?: string | null;
}

const CONDITION_OPTIONS = ["NM", "LP", "MP", "HP", "DMG"];
const FOIL_OPTIONS = ["sim", "não"];

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.empty}>{message}</Text>
      <Pressable style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]} onPress={onRetry}>
        <Text style={styles.emptyButtonText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

function EmptyCollection() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.empty}>Coleção vazia. Escaneie ou busque cartas para adicionar.</Text>
      <Pressable
        style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
        onPress={() => router.push("/(tabs)/scan")}
      >
        <Text style={styles.emptyButtonText}>Escanear carta</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.emptyButtonSecondary, pressed && styles.emptyButtonPressed]}
        onPress={() => router.push("/(tabs)/search")}
      >
        <Text style={styles.emptyButtonSecondaryText}>Buscar manualmente</Text>
      </Pressable>
    </View>
  );
}

export default function Collection() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editItem, setEditItem] = useState<CollectionItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("1");
  const [editCondition, setEditCondition] = useState<string | null>(null);
  const [editFoil, setEditFoil] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const openEditModal = (item: CollectionItem) => {
    setEditItem(item);
    setEditQuantity(String(item.quantity));
    setEditCondition(item.condition || null);
    setEditFoil(item.foil || null);
    setEditNotes(item.notes || "");
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await api.patch(`/collection/items/${editItem.id}`, {
        quantity: Math.max(1, parseInt(editQuantity, 10) || 1),
        condition: editCondition || undefined,
        foil: editFoil || undefined,
        notes: editNotes || undefined,
      });
      setEditItem(null);
      fetchCollection();
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: CollectionItem) => {
    Alert.alert(
      "Remover item",
      `Remover "${item.card_name}" da coleção?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setDeleting(item.id);
            try {
              await api.delete(`/collection/items/${item.id}`);
              fetchCollection();
            } catch {
              Alert.alert("Erro", "Não foi possível remover.");
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      if (format === "json") {
        const { data } = await api.post("/exports", null, {
          params: { format: "json" },
        });
        const text = JSON.stringify(data, null, 2);
        await Share.share({
          message: text,
          title: "Coleção TCG Ledger (JSON)",
        });
      } else {
        const { data } = await api.post("/exports", null, {
          params: { format: "csv" },
          responseType: "text",
        });
        const filename = `tcg-collection-${new Date().toISOString().slice(0, 10)}.csv`;
        const path = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(path, data as string, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(path, {
            mimeType: "text/csv",
            dialogTitle: "Exportar coleção (CSV)",
          });
        } else {
          await Share.share({ message: data as string, title: filename });
        }
      }
      setExportModal(false);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível exportar. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const fetchCollection = async () => {
    setFetchError(null);
    try {
      const { data } = await api.get("/collection");
      setItems(data.items || []);
    } catch {
      setItems([]);
      setFetchError("Falha ao carregar. Verifique a conexão e tente novamente.");
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando coleção...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Minha coleção</Text>
          <Text style={styles.subtitle}>{items.length} itens</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.exportButton, pressed && styles.buttonPressed]}
          onPress={() => setExportModal(true)}
        >
          <Ionicons name="download-outline" size={22} color={colors.primaryForeground} />
          <Text style={styles.exportButtonText}>Exportar</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchCollection();
          }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.cardName}>{item.card_name || "Carta"}</Text>
              <Text style={styles.cardSet}>{item.set_name} • {item.tcg_slug}</Text>
              <View style={styles.row}>
                <Text style={styles.quantity}>Qtd: {item.quantity}</Text>
                {item.current_price != null && (
                  <Text style={styles.price}>
                    {DEFAULT_CURRENCY} {(item.current_price * item.quantity).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                onPress={() => openEditModal(item)}
                disabled={deleting === item.id}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                onPress={() => handleDelete(item)}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                )}
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          fetchError ? (
            <ErrorState message={fetchError} onRetry={fetchCollection} />
          ) : (
            <EmptyCollection />
          )
        }
      />

      <Modal
        visible={exportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setExportModal(false)}
      >
        <Pressable style={styles.exportModalOverlay} onPress={() => setExportModal(false)}>
          <View style={styles.exportModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.exportModalTitle}>Exportar coleção</Text>
            <Text style={styles.exportModalSubtitle}>
              {exporting ? "Exportando..." : "Escolha o formato"}
            </Text>
            {exporting && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />}
            <Pressable
              style={({ pressed }) => [
                styles.exportOption,
                pressed && !exporting && styles.buttonPressed,
                exporting && styles.buttonDisabled,
              ]}
              onPress={() => handleExport("json")}
              disabled={exporting}
            >
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.exportOptionText}>JSON</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.exportOption,
                pressed && !exporting && styles.buttonPressed,
                exporting && styles.buttonDisabled,
              ]}
              onPress={() => handleExport("csv")}
              disabled={exporting}
            >
              <Ionicons name="grid-outline" size={24} color={colors.primary} />
              <Text style={styles.exportOptionText}>CSV</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.exportCancel, pressed && styles.buttonPressed]}
              onPress={() => setExportModal(false)}
            >
              <Text style={styles.exportCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={!!editItem}
        animationType="slide"
        transparent
        onRequestClose={() => setEditItem(null)}
      >
        <Pressable style={styles.exportModalOverlay} onPress={() => setEditItem(null)}>
          <View style={styles.exportModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.exportModalTitle}>Editar item</Text>
            <Text style={styles.exportModalSubtitle}>{editItem?.card_name}</Text>

            <Text style={styles.editLabel}>Quantidade</Text>
            <TextInput
              style={styles.editInput}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.editLabel}>Condição</Text>
            <View style={styles.chipRow}>
              {CONDITION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.chip, editCondition === opt && styles.chipSelected]}
                  onPress={() => setEditCondition(editCondition === opt ? null : opt)}
                >
                  <Text style={[styles.chipText, editCondition === opt && styles.chipTextSelected]}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.editLabel}>Foil</Text>
            <View style={styles.chipRow}>
              {FOIL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.chip, editFoil === opt && styles.chipSelected]}
                  onPress={() => setEditFoil(editFoil === opt ? null : opt)}
                >
                  <Text style={[styles.chipText, editFoil === opt && styles.chipTextSelected]}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.editLabel}>Notas</Text>
            <TextInput
              style={[styles.editInput, styles.notesInput]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={styles.editActions}>
              <Pressable
                style={({ pressed }) => [styles.editButton, styles.editCancel, pressed && styles.buttonPressed]}
                onPress={() => setEditItem(null)}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  styles.editSave,
                  saving && styles.buttonDisabled,
                  pressed && !saving && styles.buttonPressed,
                ]}
                onPress={handleUpdate}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Text style={styles.editSaveText}>Salvar</Text>}
              </Pressable>
            </View>
          </View>
        </Pressable>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  exportButtonText: {
    color: colors.primaryForeground,
    ...typography.sm,
    ...typography.semibold,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  exportModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  exportModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 24,
  },
  exportModalTitle: {
    ...typography.lg,
    ...typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  exportModalSubtitle: {
    ...typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  exportOptionText: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  exportCancel: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  exportCancelText: {
    color: colors.link,
    ...typography.sm,
  },
  editLabel: {
    ...typography.sm,
    ...typography.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  editInput: {
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
  editActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  editButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  editCancel: {
    backgroundColor: colors.surfaceElevated,
  },
  editSave: {
    backgroundColor: colors.primary,
  },
  editCancelText: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  editSaveText: {
    ...typography.base,
    ...typography.semibold,
    color: colors.primaryForeground,
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
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardMain: {
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  iconButton: {
    padding: spacing.sm,
  },
  cardName: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  cardSet: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  quantity: {
    ...typography.sm,
    color: colors.textSubtle,
  },
  price: {
    ...typography.sm,
    ...typography.semibold,
    color: colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
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
  emptyButtonSecondary: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  emptyButtonSecondaryText: {
    color: colors.link,
    ...typography.base,
    ...typography.semibold,
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
