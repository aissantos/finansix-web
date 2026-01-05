import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Currency formatting
export function formatCurrency(
  value: number,
  options?: {
    showSign?: boolean;
    compact?: boolean;
  }
): string {
  const { showSign = false, compact = false } = options || {};

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...(compact && {
      notation: 'compact',
      compactDisplay: 'short',
    }),
  });

  // Intl.NumberFormat may insert non-breaking spaces (U+00A0) between the
  // currency symbol and the value. Replace them with regular spaces to keep
  // formatting consistent for tests and UI comparisons.
  const formatted = formatter.format(Math.abs(value)).replace(/\u00A0/g, ' ');

  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  return value < 0 ? `-${formatted}` : formatted;
}

// Short currency (without R$)
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Date formatting
export function formatDate(
  date: Date | string,
  formatStr = 'dd/MM/yyyy'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: ptBR });
}

export function formatDateRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return `Hoje, ${format(d, 'HH:mm')}`;
  }

  if (isYesterday(d)) {
    return `Ontem, ${format(d, 'HH:mm')}`;
  }

  return format(d, "dd MMM, HH:mm", { locale: ptBR });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';

  return format(d, 'dd MMM', { locale: ptBR });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM yyyy', { locale: ptBR });
}

export function formatMonthShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM', { locale: ptBR });
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

// Percentage formatting
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Card number formatting
export function formatCardNumber(lastFour: string): string {
  return `•••• ${lastFour}`;
}

// Installment formatting
export function formatInstallment(current: number, total: number): string {
  return `${current}/${total}`;
}

// Phone formatting
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Truncate text
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}
