import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "../../src/api/client";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

interface ScanCandidate {
  card_variant_id: string;
  confidence: number;
  card: { name: string; set: string; image_url?: string };
}

const CONDITION_OPTIONS = ["NM", "LP", "MP", "HP", "DMG"];
const FOIL_OPTIONS = ["sim", "não"];

export default function Scan() {
  const insets = useSafeAreaInsets();
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState<ScanCandidate | null>(null);
  const [addQuantity, setAddQuantity] = useState("1");
  const [addCondition, setAddCondition] = useState<string | null>(null);
  const [addFoil, setAddFoil] = useState<string | null>(null);
  const [addNotes, setAddNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const openAddModal = (c: ScanCandidate) => {
    setAddModal(c);
    setAddQuantity("1");
    setAddCondition(null);
    setAddFoil(null);
    setAddNotes("");
  };

  const closeAddModal = () => setAddModal(null);

  const addToCollection = async () => {
    if (!addModal) return;
    const qty = Math.max(1, parseInt(addQuantity, 10) || 1);
    setAdding(true);
    try {
      await api.post("/collection/items", {
        card_variant_id: addModal.card_variant_id,
        quantity: qty,
        condition: addCondition || undefined,
        foil: addFoil || undefined,
        notes: addNotes || undefined,
      });
      closeAddModal();
      Alert.alert("Sucesso", `${addModal.card.name} adicionada à coleção.`, [
        { text: "Ver coleção", onPress: () => router.push("/(tabs)/collection") },
        { text: "Continuar", onPress: () => {} },
      ]);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível adicionar à coleção. Tente novamente.");
    } finally {
      setAdding(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita acesso às fotos para escanear.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndScan(result.assets[0].uri);
    }
  };

  const uploadAndScan = async (uri: string) => {
    setLoading(true);
    setCandidates([]);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri,
        type: "image/jpeg",
        name: "scan.jpg",
      } as unknown as Blob);
      const { data } = await api.post("/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCandidates(data.candidates || []);
      if (!data.candidates?.length) {
        Alert.alert(
          "Resultado",
          "Nenhuma carta identificada. Tente uma foto mais nítida ou busque manualmente.",
          [
            { text: "OK" },
            { text: "Buscar manualmente", onPress: () => router.push("/(tabs)/search") },
          ]
        );
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao escanear. Verifique a conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
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
      <Text style={styles.title}>Escanear carta</Text>
      <Text style={styles.subtitle}>Tire uma foto ou escolha da galeria</Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          loading && styles.buttonDisabled,
          pressed && !loading && styles.buttonPressed,
        ]}
        onPress={pickImage}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>Escolher imagem</Text>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.searchLink, pressed && styles.linkPressed]}
        onPress={() => router.push("/(tabs)/search")}
      >
        <Text style={styles.searchLinkText}>Ou busque manualmente por nome</Text>
      </Pressable>
      {candidates.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Candidatos identificados:</Text>
          {candidates.map((c) => (
            <View key={c.card_variant_id} style={styles.candidate}>
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{c.card.name}</Text>
                <Text style={styles.candidateSet}>{c.card.set}</Text>
                <Text style={styles.confidence}>{(c.confidence * 100).toFixed(0)}% confiança</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={() => openAddModal(c)}
              >
                <Text style={styles.addButtonText}>Adicionar à coleção</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={!!addModal}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeAddModal} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Adicionar {addModal?.card.name}
            </Text>
            <Text style={styles.modalSubtitle}>{addModal?.card.set}</Text>

            <Text style={styles.modalLabel}>Quantidade</Text>
            <TextInput
              style={styles.input}
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
                  style={[
                    styles.chip,
                    addCondition === opt && styles.chipSelected,
                  ]}
                  onPress={() => setAddCondition(addCondition === opt ? null : opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      addCondition === opt && styles.chipTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Foil</Text>
            <View style={styles.chipRow}>
              {FOIL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.chip,
                    addFoil === opt && styles.chipSelected,
                  ]}
                  onPress={() => setAddFoil(addFoil === opt ? null : opt)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      addFoil === opt && styles.chipTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Notas</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={addNotes}
              onChangeText={setAddNotes}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.modalCancel, pressed && styles.buttonPressed]}
                onPress={closeAddModal}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalConfirm,
                  (adding || loading) && styles.buttonDisabled,
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
    ...typography.xl,
    ...typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: colors.primaryForeground,
    ...typography.base,
    ...typography.semibold,
  },
  searchLink: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  searchLinkText: {
    color: colors.link,
    ...typography.sm,
  },
  linkPressed: {
    opacity: 0.8,
  },
  results: {
    marginTop: spacing.xl,
  },
  resultsTitle: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  candidate: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  candidateInfo: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonText: {
    color: colors.primaryForeground,
    ...typography.sm,
    ...typography.semibold,
  },
  candidateName: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  candidateSet: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  confidence: {
    ...typography.xs,
    color: colors.primary,
    marginTop: spacing.xs,
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
  input: {
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
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
