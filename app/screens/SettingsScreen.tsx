import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/common/Avatar';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme, Language } from '../types/common';
import { HealthBadge } from '../components/HealthBadge';
// Using simple buttons instead of Picker for better compatibility

interface SettingsScreenProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { me, logout } = useAuthStore();
  const {
    theme,
    language,
    notificationsEnabled,
    loggingEnabled,
    setTheme,
    setLanguage,
    setNotificationsEnabled,
    setLoggingEnabled,
    clearAllData,
  } = useSettingsStore();
  const [clearing, setClearing] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), 'Вы уверены, что хотите выйти?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          (navigation as any).navigate('Login');
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert('Очистить данные', 'Все ваши данные будут удалены. Это действие нельзя отменить.', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            await clearAllData();
            Alert.alert('Готово', 'Данные очищены');
          } catch (error) {
            Alert.alert(t('common.error'), 'Не удалось очистить данные');
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  };

  const handleSendFeedback = async () => {
    try {
      await Share.share({
        message: 'Отзыв о приложении AdilAI',
        title: 'Отзыв',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Avatar name={me?.name} size={64} />
          <Text style={[styles.profileName, { color: colors.text }]}>
            {me?.name || 'Пользователь'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {me?.email}
          </Text>
        </View>

        <View style={styles.section}>
          <HealthBadge />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
          <View style={styles.languageButtons}>
            <Button
              title={t('settings.language_ru')}
              onPress={() => handleLanguageChange('ru')}
              variant={language === 'ru' ? 'primary' : 'outline'}
              size="small"
              style={styles.languageButton}
            />
            <Button
              title={t('settings.language_kz')}
              onPress={() => handleLanguageChange('kz')}
              variant={language === 'kz' ? 'primary' : 'outline'}
              size="small"
              style={styles.languageButton}
            />
            <Button
              title={t('settings.language_en')}
              onPress={() => handleLanguageChange('en')}
              variant={language === 'en' ? 'primary' : 'outline'}
              size="small"
              style={styles.languageButton}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
          <View style={styles.themeButtons}>
            <Button
              title={t('settings.theme_light')}
              onPress={() => setTheme('light')}
              variant={theme === 'light' ? 'primary' : 'outline'}
              size="small"
              style={styles.themeButton}
            />
            <Button
              title={t('settings.theme_dark')}
              onPress={() => setTheme('dark')}
              variant={theme === 'dark' ? 'primary' : 'outline'}
              size="small"
              style={styles.themeButton}
            />
            <Button
              title={t('settings.theme_system')}
              onPress={() => setTheme('system')}
              variant={theme === 'system' ? 'primary' : 'outline'}
              size="small"
              style={styles.themeButton}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Toggle
            label={t('settings.notifications')}
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <Toggle
            label={t('settings.logging')}
            value={loggingEnabled}
            onValueChange={setLoggingEnabled}
          />
        </View>

        <View style={styles.section}>
          <Button
            title={t('settings.send_feedback')}
            onPress={handleSendFeedback}
            variant="outline"
            style={styles.actionButton}
            icon={<Ionicons name="chatbubble-outline" size={18} color={colors.primary} />}
          />
          <Button
            title={t('settings.clear_data')}
            onPress={handleClearData}
            variant="outline"
            loading={clearing}
            style={StyleSheet.compose(styles.actionButton, { borderColor: colors.error })}
            textStyle={{ color: colors.error }}
            icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
          />
          <Button
            title="Debug"
            onPress={() => (navigation as any).navigate('Debug')}
            variant="outline"
            style={styles.actionButton}
            icon={<Ionicons name="bug-outline" size={18} color={colors.primary} />}
          />
          <Button
            title={t('settings.logout')}
            onPress={handleLogout}
            variant="outline"
            style={StyleSheet.compose(styles.actionButton, { borderColor: colors.error })}
            textStyle={{ color: colors.error }}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.error} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
  },
  actionButton: {
    marginBottom: 12,
  },
});

