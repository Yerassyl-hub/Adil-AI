import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { documents } from '../services/client';
import { useDocsStore } from '../store/useDocsStore';
import { generateDocumentPDF, sharePDF } from '../services/pdf';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { analyzeContract, type AnalyzeContractResponse } from '../services/contract';

const documentSchema = z.object({
  parties: z.string().min(1, 'Укажите стороны'),
  city: z.string().min(1, 'Укажите город'),
  subject: z.string().min(1, 'Укажите предмет'),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});

type DocumentFormInput = z.infer<typeof documentSchema>;

interface DocumentBuilderScreenProps {}

export const DocumentBuilderScreen: React.FC<DocumentBuilderScreenProps> = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { lastFormState, setLastFormState, previewHtml, setPreviewHtml } = useDocsStore();
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeContractResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DocumentFormInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: lastFormState
      ? {
          parties: lastFormState.parties?.join(', ') ?? '',
          city: lastFormState.city ?? '',
          subject: lastFormState.subject ?? '',
          dateStart: lastFormState.dates?.start ?? '',
          dateEnd: lastFormState.dates?.end ?? '',
        }
      : {
          parties: '',
          city: '',
          subject: '',
          dateStart: '',
          dateEnd: '',
        },
  });

  const formData = watch();

  const fetchAnalysis = async (form: DocumentFormInput) => {
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const partiesList = form.parties
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const questionParts = [
        'Проанализируй договор и сформулируй риски для исполнителя.',
        partiesList.length > 0 ? `Стороны: ${partiesList.join(', ')}` : null,
        form.city ? `Город: ${form.city}` : null,
        form.subject ? `Предмет: ${form.subject}` : null,
        form.dateStart ? `Дата начала: ${form.dateStart}` : null,
        form.dateEnd ? `Дата окончания: ${form.dateEnd}` : null,
      ]
        .filter(Boolean)
        .join('. ');

      const response = await analyzeContract(questionParts);
      setAnalysis(response);
    } catch (error) {
      console.error('Contract analysis error:', error);
      setAnalysisError('Не удалось получить анализ договора');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handlePreview = async (data: DocumentFormInput) => {
    setLoading(true);
    try {
      const payload = {
        parties: data.parties.split(',').map((p) => p.trim()),
        city: data.city,
        subject: data.subject,
        dates: {
          start: data.dateStart || undefined,
          end: data.dateEnd || undefined,
        },
      };
      const response = await documents.preview(payload);
      setPreviewHtml(response.html);
      setPreviewMode(true);
      setLastFormState(payload);
      setAnalysis(null);
      void fetchAnalysis(data);
    } catch (error) {
      console.error('Preview error:', error);
      Alert.alert(t('common.error'), 'Не удалось создать предпросмотр');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!previewHtml) {
      Alert.alert(t('common.error'), 'Сначала создайте предпросмотр');
      return;
    }

    setExporting(true);
    try {
      const payload = {
        parties: formData.parties.split(',').map((p) => p.trim()),
        city: formData.city,
        subject: formData.subject,
        dates: {
          start: formData.dateStart || undefined,
          end: formData.dateEnd || undefined,
        },
      };
      const pdfUri = await generateDocumentPDF(payload, previewHtml);
      await sharePDF(pdfUri, 'document.pdf');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), 'Не удалось экспортировать PDF');
    } finally {
      setExporting(false);
    }
  };

  if (previewMode && previewHtml) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View
          style={[
            styles.previewHeader,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setPreviewMode(false)}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.previewTitle, { color: colors.text }]}>Предпросмотр</Text>
          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={exporting}
            style={styles.exportIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color={exporting ? colors.textSecondary : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {(analysisLoading || analysis || analysisError) && (
          <View
            style={[
              styles.analysisContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.analysisTitle, { color: colors.text }]}>Анализ договора</Text>
            {analysisLoading ? (
              <View style={styles.analysisLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.analysisHint, { color: colors.textSecondary }]}>
                  Запрашиваем анализ...
                </Text>
              </View>
            ) : analysisError ? (
              <Text style={[styles.analysisError, { color: colors.error }]}>{analysisError}</Text>
            ) : analysis ? (
              <Text style={[styles.analysisText, { color: colors.text }]}>
                {analysis.answer ?? JSON.stringify(analysis, null, 2)}
              </Text>
            ) : (
              <Text style={[styles.analysisHint, { color: colors.textSecondary }]}>
                Анализ не найден.
              </Text>
            )}
          </View>
        )}

        <WebView source={{ html: previewHtml }} style={styles.webview} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.headerBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('document.title')}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Controller
          control={control}
          name="parties"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('document.parties')}
              placeholder="Сторона 1, Сторона 2"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.parties?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('document.city')}
              placeholder="Алматы"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.city?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="subject"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('document.subject')}
              placeholder="Предмет договора"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.subject?.message}
              multiline
            />
          )}
        />

        <Controller
          control={control}
          name="dateStart"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('document.date_start')}
              placeholder="dd.mm.yyyy"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.dateStart?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="dateEnd"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('document.date_end')}
              placeholder="dd.mm.yyyy"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.dateEnd?.message}
            />
          )}
        />

        <Button
          title={t('document.preview')}
          onPress={handleSubmit(handlePreview)}
          loading={loading}
          style={styles.button}
          icon={<Ionicons name="eye-outline" size={20} color="#fff" />}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  exportIconButton: {
    padding: 4,
  },
  analysisContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  analysisHint: {
    fontSize: 12,
  },
  analysisError: {
    fontSize: 14,
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webview: {
    flex: 1,
  },
});

