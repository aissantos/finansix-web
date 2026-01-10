import { 
 
 
  addMonths, 
  subMonths,
 
  isBefore, 
  isAfter, 
  format,
  differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface InvoicePeriod {
  /** Início do período de compras que entram nesta fatura */
  purchaseStart: Date;
  /** Fim do período de compras (data de fechamento) */
  purchaseEnd: Date;
  /** Data de fechamento da fatura */
  closingDate: Date;
  /** Data de vencimento do pagamento */
  dueDate: Date;
  /** Mês de referência da fatura (para exibição) */
  referenceMonth: Date;
  /** Label formatado: "Janeiro 2026" */
  label: string;
  /** Status da fatura */
  status: 'open' | 'closed' | 'paid' | 'overdue';
}

export interface CreditCardDates {
  closingDay: number;
  dueDay: number;
}

/**
 * Calcula em qual fatura uma compra cai baseado na data de corte
 * 
 * Regra:
 * - Se data_compra <= dia_fechamento → Fatura do mês atual
 * - Se data_compra > dia_fechamento → Fatura do mês seguinte
 */
export function getInvoiceForPurchase(
  purchaseDate: Date,
  card: CreditCardDates
): InvoicePeriod {
  const purchaseDay = purchaseDate.getDate();
  const purchaseMonth = purchaseDate.getMonth();
  const purchaseYear = purchaseDate.getFullYear();
  
  let invoiceMonth: Date;
  
  if (purchaseDay <= card.closingDay) {
    // Compra entra na fatura do mês atual
    invoiceMonth = new Date(purchaseYear, purchaseMonth, 1);
  } else {
    // Compra entra na fatura do mês seguinte
    invoiceMonth = addMonths(new Date(purchaseYear, purchaseMonth, 1), 1);
  }
  
  return getInvoicePeriod(invoiceMonth, card);
}

/**
 * Retorna o período completo de uma fatura para um mês específico
 */
export function getInvoicePeriod(
  referenceMonth: Date,
  card: CreditCardDates
): InvoicePeriod {
  const year = referenceMonth.getFullYear();
  const month = referenceMonth.getMonth();
  
  // Data de fechamento é no mês de referência
  const closingDate = new Date(year, month, card.closingDay);
  
  // Data de vencimento é no mês seguinte (ou no mesmo mês se dueDay > closingDay)
  let dueDate: Date;
  if (card.dueDay > card.closingDay) {
    // Vencimento no mesmo mês (ex: fecha dia 5, vence dia 15)
    dueDate = new Date(year, month, card.dueDay);
  } else {
    // Vencimento no mês seguinte (ex: fecha dia 25, vence dia 10)
    dueDate = addMonths(new Date(year, month, card.dueDay), 1);
  }
  
  // Período de compras: do dia seguinte ao fechamento anterior até o fechamento atual
  const previousMonth = subMonths(referenceMonth, 1);
  const purchaseStart = new Date(
    previousMonth.getFullYear(),
    previousMonth.getMonth(),
    card.closingDay + 1
  );
  const purchaseEnd = closingDate;
  
  // Determinar status
  const today = new Date();
  let status: InvoicePeriod['status'];
  
  if (isBefore(today, closingDate)) {
    status = 'open';
  } else if (isBefore(today, dueDate)) {
    status = 'closed';
  } else {
    status = 'overdue';
  }
  
  return {
    purchaseStart,
    purchaseEnd,
    closingDate,
    dueDate,
    referenceMonth,
    label: format(referenceMonth, "MMMM 'de' yyyy", { locale: ptBR }),
    status,
  };
}

/**
 * Retorna a fatura atual (aberta) do cartão
 */
export function getCurrentInvoice(card: CreditCardDates): InvoicePeriod {
  return getInvoiceForPurchase(new Date(), card);
}

/**
 * Retorna as próximas N faturas do cartão
 */
export function getUpcomingInvoices(
  card: CreditCardDates,
  count: number = 3
): InvoicePeriod[] {
  const invoices: InvoicePeriod[] = [];
  let currentMonth = new Date();
  
  for (let i = 0; i < count; i++) {
    invoices.push(getInvoicePeriod(currentMonth, card));
    currentMonth = addMonths(currentMonth, 1);
  }
  
  return invoices;
}

/**
 * Calcula dias até o fechamento da fatura atual
 */
export function getDaysUntilClosing(card: CreditCardDates): number {
  const currentInvoice = getCurrentInvoice(card);
  const today = new Date();
  
  if (isAfter(today, currentInvoice.closingDate)) {
    // Já fechou, calcular para próximo mês
    const nextInvoice = getInvoicePeriod(addMonths(new Date(), 1), card);
    return differenceInDays(nextInvoice.closingDate, today);
  }
  
  return differenceInDays(currentInvoice.closingDate, today);
}

/**
 * Calcula dias até o vencimento da fatura atual
 */
export function getDaysUntilDue(card: CreditCardDates): number {
  const currentInvoice = getCurrentInvoice(card);
  const today = new Date();
  
  return differenceInDays(currentInvoice.dueDate, today);
}

/**
 * Formata o status da fatura para exibição
 */
export function getInvoiceStatusLabel(status: InvoicePeriod['status']): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'open':
      return { 
        label: 'Aberta', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100 dark:bg-blue-900/30' 
      };
    case 'closed':
      return { 
        label: 'Fechada', 
        color: 'text-amber-600', 
        bgColor: 'bg-amber-100 dark:bg-amber-900/30' 
      };
    case 'paid':
      return { 
        label: 'Paga', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100 dark:bg-green-900/30' 
      };
    case 'overdue':
      return { 
        label: 'Vencida', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100 dark:bg-red-900/30' 
      };
  }
}

/**
 * Agrupa transações por fatura
 */
export function groupTransactionsByInvoice<T extends { transaction_date: string }>(
  transactions: T[],
  card: CreditCardDates
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  for (const transaction of transactions) {
    const purchaseDate = new Date(transaction.transaction_date);
    const invoice = getInvoiceForPurchase(purchaseDate, card);
    const key = format(invoice.referenceMonth, 'yyyy-MM');
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(transaction);
  }
  
  return grouped;
}
