import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Button } from '../components/ui/Button';
import { getBaseUrl, getApiKey } from '../config/apiConfig';
import { getHealth } from '../services/health';
import { analyzeContract } from '../services/contract';
import { chat } from '../services/chat';

export const DebugScreen: React.FC = () => {
  const { colors } = useTheme();
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const appendLog = (entry: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${entry}`, ...prev].slice(0, 50));
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await getHealth();
      appendLog(`Health: ${JSON.stringify(result)}`);
    } catch (error: any) {
      appendLog(`Health error: ${error?.message ?? error}`);
    } finally {
      setLoading(false);
    }
  };

  const runAnalyzeCheck = async () => {
    setLoading(true);
    try {
      const result = await analyzeContract('Проверка подключения');
      appendLog(`Analyze: ${JSON.stringify(result).slice(0, 500)}`);
    } catch (error: any) {
      appendLog(`Analyze error: ${error?.message ?? error}`);
    } finally {
      setLoading(false);
    }
  };

  const runChatCheck = async () => {
    setLoading(true);
    try {
      const result = await chat([
        { role: 'system', content: 'Помогай кратко' },
        { role: 'user', content: 'Тест подключения' },
      ]);
      appendLog(`Chat: ${JSON.stringify(result).slice(0, 500)}`);
    } catch (error: any) {
      appendLog(`Chat error: ${error?.message ?? error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>API Debug</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Base URL</Text>
          <Text style={[styles.value, { color: colors.text }]}>{getBaseUrl()}</Text>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>API Key</Text>
          <Text style={[styles.value, { color: colors.text }]}>{getApiKey() ? '••••••••' : '(not set)'}</Text>
        </View>

        <View style={styles.section}>
          <Button title="Ping /health" onPress={runHealthCheck} loading={loading} style={styles.button} />
          <Button title="Test /v1/analyze/contract" onPress={runAnalyzeCheck} loading={loading} style={styles.button} />
          <Button title="Test /v1/chat" onPress={runChatCheck} loading={loading} style={styles.button} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>Logs</Text>
          {log.length === 0 ? (
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Нет логов. Запустите проверки.</Text>
          ) : (
            log.map((entry, index) => (
              <Text key={`${entry}-${index}`} style={[styles.logItem, { color: colors.textSecondary }]}>
                {entry}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 14,
  },
  button: {
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  logItem: {
    fontSize: 13,
    lineHeight: 18,
  },
});


