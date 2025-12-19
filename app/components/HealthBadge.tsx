import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getHealth } from '../services/health';
import { getBaseUrl } from '../config/apiConfig';
import { useTheme } from '../theme';

export const HealthBadge: React.FC = () => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const result = await getHealth();
        if (!mounted) return;
        if (result?.status === 'ok') {
          setStatus('ok');
          setMessage('');
        } else {
          setStatus('error');
          setMessage(result?.status ?? 'Unknown status');
        }
      } catch (error: any) {
        if (!mounted) return;
        setStatus('error');
        setMessage(error?.message ?? 'Network error');
      }
    };

    void checkHealth();

    return () => {
      mounted = false;
    };
  }, []);

  const getBackgroundColor = () => {
    if (status === 'ok') {
      return colors.success + '20';
    }
    if (status === 'error') {
      return colors.error + '20';
    }
    return colors.info + '20';
  };

  const getPrimaryColor = () => {
    if (status === 'ok') {
      return colors.success;
    }
    if (status === 'error') {
      return colors.error;
    }
    return colors.textSecondary;
  };

  const statusText =
    status === 'checking'
      ? 'Проверяем сервер...'
      : status === 'ok'
      ? 'Сервер работает'
      : 'Сервер недоступен (локальный IP)';

  const urlToShow = status === 'ok' ? getBaseUrl() : 'http://10.0.2.2:8000';

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor(), borderColor: getPrimaryColor() }]}>
      <Text style={[styles.status, { color: getPrimaryColor() }]}>{statusText}</Text>
      <Text style={[styles.url, { color: colors.textSecondary }]}>{urlToShow}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  url: {
    fontSize: 12,
  },
  message: {
    fontSize: 12,
  },
});


