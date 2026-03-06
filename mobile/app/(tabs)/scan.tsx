import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../src/api/client";

interface ScanCandidate {
  card_variant_id: string;
  confidence: number;
  card: { name: string; set: string; image_url?: string };
}

export default function Scan() {
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [loading, setLoading] = useState(false);

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
        Alert.alert("Resultado", "Nenhuma carta identificada. Tente uma foto mais nítida ou busque manualmente.");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao escanear. Verifique a conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escanear carta</Text>
      <Text style={styles.subtitle}>Tire uma foto ou escolha da galeria</Text>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={pickImage}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Escolher imagem</Text>
        )}
      </TouchableOpacity>
      {candidates.length > 0 && (
        <ScrollView style={styles.results}>
          <Text style={styles.resultsTitle}>Candidatos identificados:</Text>
          {candidates.map((c, i) => (
            <View key={c.card_variant_id} style={styles.candidate}>
              <Text style={styles.candidateName}>{c.card.name}</Text>
              <Text style={styles.candidateSet}>{c.card.set}</Text>
              <Text style={styles.confidence}>{(c.confidence * 100).toFixed(0)}% confiança</Text>
            </View>
          ))}
        </ScrollView>
      )}
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
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  results: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 12,
  },
  candidate: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  candidateSet: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  confidence: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 4,
  },
});
