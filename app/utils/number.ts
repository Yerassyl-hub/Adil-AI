/**
 * Number formatting utilities
 */

export const formatNumber = (num: number, locale: 'ru' | 'kz' = 'ru'): string => {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'kk-KZ').format(num);
};

export const formatCurrency = (amount: number, locale: 'ru' | 'kz' = 'ru'): string => {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'kk-KZ', {
    style: 'currency',
    currency: 'KZT',
  }).format(amount);
};



