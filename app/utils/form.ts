import { z } from 'zod';

/**
 * Common form validation schemas
 */

export const emailSchema = z.string().email('Некорректный email');

export const iinSchema = z
  .string()
  .length(12, 'ИИН должен содержать 12 цифр')
  .regex(/^\d+$/, 'ИИН должен содержать только цифры');

export const dateSchema = z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Формат: dd.mm.yyyy');

export const requiredString = z.string().min(1, 'Обязательное поле');



