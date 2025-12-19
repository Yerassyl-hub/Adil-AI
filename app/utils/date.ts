/**
 * Date utilities for formatting and relative dates
 */

export const formatDate = (date: Date | string, format: 'dd.mm.yyyy' | 'full' = 'dd.mm.yyyy'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'dd.mm.yyyy') {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  return d.toLocaleDateString();
};

export const getRelativeDate = (date: Date | string, locale: 'ru' | 'kz' = 'ru'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (locale === 'ru') {
    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'завтра';
    if (diffDays === -1) return 'вчера';
    if (diffDays > 1 && diffDays <= 7) return `через ${diffDays} дня`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} дня назад`;
  } else {
    if (diffDays === 0) return 'бүгін';
    if (diffDays === 1) return 'ертең';
    if (diffDays === -1) return 'кеше';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} күннен кейін`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} күн бұрын`;
  }

  return formatDate(d);
};

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

export const isPast = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < new Date().getTime();
};



