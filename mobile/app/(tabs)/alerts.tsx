import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

interface AlertEvent {
  id: string;
  card_variant_id: string | null;
  old_price: number | null;
  new_price: number | null;
  change_pct: number | null;
  created_at: string;
}

interface AlertRule {
  id: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export default function Alerts() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ruleModal, setRuleModal] = useState(false);
  const [threshold, setThreshold] = useState("5");
  const [saving, setSaving] = useState(false);

  const fetchAlerts = async () => {
    try {
      const [eventsRes, rulesRes] = await Promise.all([
        api.get("/alerts"),
        api.get("/alerts/rules"),
      ]);
      setEvents(eventsRes.data || []);
      setRules(rulesRes.data || []);
    } catch {
      setEvents([]);
      setRules([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateRule = async () => {
    const pct = parseFloat(threshold);
    if (isNaN(pct) || pct < 0.1 || pct > 100) {
      Alert.alert("Erro", "Informe um percentual entre 0.1 e 100");
      return;
    }
    setSaving(true);
    try {
      await api.post("/alerts/rules", {
        type: "portfolio",
        config: { threshold_pct: pct },
      });
      setRuleModal(false);
      setThreshold("5");
      fetchAlerts();
    } catch {
      Alert.alert("Erro", "Não foi possível criar a regra.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando alertas...</Text>
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
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Alertas</Text>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
          onPress={() => setRuleModal(true)}
        >
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
          <Text style={styles.addButtonText}>Nova regra</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Alertas de preço e regras ativas</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Regras ativas</Text>
        {rules.length === 0 ? (
          <Text style={styles.empty}>Nenhuma regra configurada.</Text>
        ) : (
          rules.map((r) => (
            <View key={r.id} style={styles.ruleCard}>
              <Ionicons name="notifications" size={24} color={colors.primary} />
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleType}>
                  {r.type === "card" ? "Carta" : r.type === "portfolio" ? "Portfólio" : r.type}
                </Text>
                <Text style={styles.ruleConfig}>
                  {r.config?.threshold_pct != null
                    ? `Alerta quando variação ≥ ${r.config.threshold_pct}%`
                    : JSON.stringify(r.config)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eventos recentes</Text>
        {events.length === 0 ? (
          <Text style={styles.empty}>Nenhum alerta disparado ainda.</Text>
        ) : (
          events.map((e) => (
            <View key={e.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventLabel}>Variação de preço</Text>
                {e.change_pct != null && (
                  <Text
                    style={[
                      styles.eventPct,
                      e.change_pct >= 0 ? styles.positive : styles.negative,
                    ]}
                  >
                    {e.change_pct >= 0 ? "+" : ""}
                    {e.change_pct.toFixed(1)}%
                  </Text>
                )}
              </View>
              <View style={styles.eventRow}>
                {e.old_price != null && (
                  <Text style={styles.eventPrice}>
                    Antes: USD {Number(e.old_price).toFixed(2)}
                  </Text>
                )}
                {e.new_price != null && (
                  <Text style={styles.eventPrice}>
                    Agora: USD {Number(e.new_price).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={ruleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setRuleModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRuleModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Nova regra de alerta</Text>
            <Text style={styles.modalSubtitle}>
              Portfólio: avisar quando a variação total passar do limite.
            </Text>
            <Text style={styles.inputLabel}>Variação mínima (%)</Text>
            <TextInput
              style={styles.input}
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="decimal-pad"
              placeholder="5"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.modalCancel, pressed && styles.buttonPressed]}
                onPress={() => setRuleModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalConfirm,
                  saving && styles.buttonDisabled,
                  pressed && !saving && styles.buttonPressed,
                ]}
                onPress={handleCreateRule}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.modalConfirmText}>Criar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.xl },
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
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.xl,
    ...typography.bold,
    color: colors.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addButtonText: {
    color: colors.primaryForeground,
    ...typography.sm,
    ...typography.semibold,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  subtitle: {
    ...typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.sm,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  ruleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  ruleInfo: { flex: 1 },
  ruleType: {
    ...typography.base,
    ...typography.semibold,
    color: colors.text,
  },
  ruleConfig: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventLabel: {
    ...typography.sm,
    color: colors.textMuted,
  },
  eventPct: {
    ...typography.lg,
    ...typography.bold,
  },
  positive: { color: colors.success },
  negative: { color: colors.error },
  eventRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  eventPrice: {
    ...typography.sm,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
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
  inputLabel: {
    ...typography.sm,
    ...typography.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    color: colors.text,
    ...typography.base,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
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
