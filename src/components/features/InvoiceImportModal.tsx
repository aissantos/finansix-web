import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  Tag,
  Building2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
// Types only - erased at runtime
import type { ParsedTransaction } from '@/lib/invoice-parser';
import type { ExistingTransaction } from '@/lib/invoice-parsers/deduplication';
import type { CategoryPredictor } from '@/lib/ml/category-model';

import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useCreditCard, useUpdateCreditCard, useCategories, useRecentTransactions, useHousehold } from '@/hooks';
import { predictCategory } from '@/lib/category-predictor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';

type ParsedTransactionWithCategory = ParsedTransaction & {
  categoryId?: string;
  predictionReason?: string;
  isDuplicate?: boolean;
  duplicateScore?: number;
};

interface InvoiceImportModalProps {
  creditCardId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceImportModal({ 
  creditCardId, 
  isOpen, 
  onClose,
  onSuccess 
}: InvoiceImportModalProps) {
  const { toast } = useToast();
  const { data: card } = useCreditCard(creditCardId);
  const { mutate: updateCard } = useUpdateCreditCard();

  const { data: household } = useHousehold();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useCategories('expense');
  const { data: recentTransactions = [] } = useRecentTransactions(100);

  const [predictor, setPredictor] = useState<CategoryPredictor | null>(null);

  // Initialize ML Model - Lazy Load
  useEffect(() => {
    // HEAVY LIB DISABLE: TensorFlow.js causes build heap overflow/crash on some environments.
    // Uncomment to enable ML categorization feature if environment supports it.
    // if (household?.id) {
    //     // Dynamic import to avoid loading TensorFlow.js immediately
    //     import('@/lib/ml/model-storage').then(({ getCategoryPredictor }) => {
    //         getCategoryPredictor(household.id).then(setPredictor);
    //     });
    // }
  }, [household?.id]);

  const [step, setStep] = useState<'upload' | 'password' | 'summary' | 'review' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [savePassword, setSavePassword] = useState(false);
  
  // Data State
  const [transactions, setTransactions] = useState<ParsedTransactionWithCategory[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  
  // Metadata State
  const [extractedTotal, setExtractedTotal] = useState<number>(0);
  const [extractedMinPayment, setExtractedMinPayment] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [detectedBank, setDetectedBank] = useState<string | null>(null);
  
  // User Choices
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [schedulePayment, setSchedulePayment] = useState<boolean>(true);

  // Manual Transaction State
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when closing/opening
  const handleClose = () => {
    if (step === 'importing') return;
    setStep('upload');
    setFile(null);
    setPassword('');
    setTransactions([]);
    setExtractedTotal(0);
    setDueDate('');
    setError(null);
    setShowManualInput(false);
    setManualDescription('');
    setManualAmount('');
    setManualDate('');
    setDetectedBank(null);
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor, selecione um arquivo PDF ou Imagem (JPG, PNG).');
        return;
      }
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (pdfFile: File, manualPassword?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Dynamic imports for heavy libraries
      const { parseInvoiceText, extractTextFromPDF } = await import('@/lib/invoice-parser');
      // const { extractTextFromImage } = await import('@/lib/invoice-parsers/ocr');
      const { findDuplicates } = await import('@/lib/invoice-parsers/deduplication');


      // Try with stored password first if available and no manual password provided
      const passwordToUse = manualPassword ?? card?.pdf_password ?? undefined;
      
      let text = '';
      if (pdfFile.type === 'application/pdf') {
         text = await extractTextFromPDF(pdfFile, passwordToUse);
      } else {
         // It's an image
         // text = await extractTextFromImage(pdfFile);
      }
      const result = parseInvoiceText(text);

      if (result.transactions.length === 0) {
        setError('Nenhuma transação encontrada. O formato da fatura pode não ser suportado.');
        setIsLoading(false);
        return;
      }
      
      // Pre-calculate ML predictions if available
      const mlPredictions = new Map<number, { categoryId: string, confidence: number }>();
      if (predictor) {
        result.transactions.forEach((t, i) => {
            const preds = predictor.predict(t.description);
            if (preds.length > 0 && preds[0].confidence > 0.5) { // Threshold
                mlPredictions.set(i, preds[0]);
            }
        });
      }

      // Select all by default
      const initialSelection = new Set<number>();
      
      // Fetch existing transactions for deduplication
      // We look at the month range of the parsed transactions
      const dates = result.transactions.map(t => new Date(t.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      // Buffer of 5 days
      const queryStartDate = format(addDays(minDate, -5), 'yyyy-MM-dd');
      const queryEndDate = format(addDays(maxDate, 5), 'yyyy-MM-dd');
      
      const { data: existingTxs } = household ? await supabase
        .from('transactions')
        .select('id, amount, transaction_date, description')
        .eq('household_id', household.id)
        .gte('transaction_date', queryStartDate)
        .lte('transaction_date', queryEndDate) : { data: [] };

      const duplicates = findDuplicates(
        result.transactions, 
        (existingTxs || []) as ExistingTransaction[]
      );

      const duplicateMap = new Map();
      duplicates.forEach(d => {
        duplicateMap.set(d.importedIndex, d.score);
      });

      // Process Transactions
      setTransactions(result.transactions.map((t, i) => {
        // Legacy/Rule-based prediction
        const rulePrediction = predictCategory(t.description, categories, recentTransactions);
        
        // ML Prediction
        const mlPrediction = mlPredictions.get(i);
        
        let finalCategoryId = rulePrediction.categoryId;
        let finalReason = rulePrediction.reason;
        
        // Decide which to use
        if (mlPrediction) {
            finalCategoryId = mlPrediction.categoryId;
            finalReason = `IA (${Math.round(mlPrediction.confidence * 100)}%)`;
        }

        const duplicateScore = duplicateMap.get(i);
        const isDuplicate = duplicateScore !== undefined;

        // Auto-select ONLY if not duplicate
        if (!isDuplicate) {
          initialSelection.add(i);
        }

        return {
          ...t,
          categoryId: finalCategoryId,
          predictionReason: finalReason,
          isDuplicate,
          duplicateScore
        };
      }));
      
      setSelectedIndices(initialSelection);

      // Process Metadata
      setExtractedTotal(result.totalAmount || 0);
      setExtractedMinPayment(result.minimumPayment || 0);
      setDueDate(result.dueDate || format(addDays(new Date(), 10), 'yyyy-MM-dd')); // Default to 10 days from now if not found
      setDetectedBank(result.bankName || 'Genérico (Nubank detectado ou padrão)');
      
      // Default user choices
      setPaymentAmount(result.totalAmount || result.transactions.reduce((acc, t) => acc + t.amount, 0));
      setSchedulePayment(true);

      setStep('summary'); // Go to summary first
      
      // If we used a manual password and user wants to save
      if (manualPassword && savePassword) {
        updateCard({
          id: creditCardId,
          data: { pdf_password: manualPassword }
        });
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage === 'PASSWORD_REQUIRED') {
        setStep('password');
        // If we tried automatically and failed, clear the stored password attempt
        if (!manualPassword && card?.pdf_password) {
           setError('A senha salva não funcionou. Por favor, digite a senha.');
        }
      } else {
        console.error(err);
        setError('Erro ao processar o arquivo. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && password) {
      processFile(file, password);
    }
  };

  const updateCategory = async (index: number, categoryId: string) => {
    setTransactions(prev => {
      const targetTransaction = prev[index];
      // Auto-fill: Update the targeted transaction AND any other with the EXACT same description
      return prev.map((t, i) => 
        (i === index || t.description === targetTransaction.description) 
          ? { ...t, categoryId } 
          : t
      );
    });
    
    // Train the model with this correction
    if (predictor) {
        const description = transactions[index].description;
        // Don't await to avoid UI lag
        predictor.learnFromCorrection(description, categoryId).catch(console.error);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const calculateSum = () => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAddManualTransaction = () => {
    if (!manualDescription || !manualAmount || !manualDate) return;

    const amount = parseFloat(manualAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    const newTransaction: ParsedTransactionWithCategory = {
      description: manualDescription,
      amount: amount,
      date: manualDate,
      categoryId: undefined // User can select after
    };

    setTransactions(prev => [...prev, newTransaction]);
    setSelectedIndices(prev => new Set([...prev, transactions.length])); // Select the new item (index is length before push, but we push to new array so index is prev.length)
    
    // Reset inputs
    setManualDescription('');
    setManualAmount('');
    setManualDate('');
    setShowManualInput(false);
  };

  const handleImport = async () => {
    if (!card) return;
    
    setIsLoading(true);
    setStep('importing');

    try {
      const selectedTransactions = transactions.filter((_, i) => selectedIndices.has(i));
      
      if (selectedTransactions.length === 0 && !schedulePayment) {
        toast({ title: 'Nenhuma transação selecionada', description: 'Selecione transações ou agende o pagamento.', variant: 'destructive' });
        setStep('review');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      if (!household) throw new Error('Household not found');

      // 1. Create Expense Transactions
      // Using proper types for insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactionsToInsert: any[] = selectedTransactions.map(t => ({
        household_id: household.id,
        credit_card_id: creditCardId,
        type: 'expense' as const,
        amount: t.amount,
        description: t.description,
        transaction_date: t.date,
        category_id: t.categoryId,
        status: 'completed' as const,
      }));

      // 2. Create Bill Payment Transaction (if requested)
      if (schedulePayment) {
        transactionsToInsert.push({
          household_id: household.id,
          credit_card_id: creditCardId,
          type: 'expense' as const,
          amount: paymentAmount, // Use user chosen amount (Total, Min, or Custom)
          description: `Fatura ${card.name} ${format(new Date(dueDate), 'MM/yyyy')}`,
          transaction_date: dueDate, // Scheduled date
          category_id: undefined, // Or a specific "Credit Card Payment" category if exists
          status: 'pending' as const, // "A Vencer"
        });
      }

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      toast({
        title: 'Importação concluída!',
        description: `${selectedTransactions.length} despesas importadas. ${schedulePayment ? 'Pagamento agendado.' : ''}`,
        variant: 'success'
      });

      // Force a small delay to allow DB triggers to propagate changes to 'credit_cards' table (used_limit update)
      setIsLoading(true); // Keep loading state
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['installments'] }),
        queryClient.invalidateQueries({ queryKey: ['creditCards'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      ]);

      onSuccess();
      handleClose();

    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao salvar as transações.',
        variant: 'destructive'
      });
      setStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  const transactionsSum = calculateSum();
  const diff = extractedTotal ? Math.abs(extractedTotal - transactionsSum) : 0;
  const hasSignificantDiff = diff > 0.1; // tolerance for floating point

  const selectedTotal = transactions
    .filter((_, i) => selectedIndices.has(i))
    .reduce((sum, t) => sum + t.amount, 0);

  const diffManual = extractedTotal ? extractedTotal - selectedTotal : 0;
  const isDiffPositive = diffManual > 0.1;
  const isDiffNegative = diffManual < -0.1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Fatura (PDF)</DialogTitle>
          <DialogDescription className="text-slate-500">
             Importe transações automaticamente da sua fatura em PDF.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  {file?.type.startsWith('image/') 
                    ? 'Lendo imagem com IA (OCR)... Isso pode levar alguns segundos.' 
                    : 'Processando arquivo...'}
                </p>
              </div>
            ) : (
              <>
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Selecione sua fatura
                </h3>
                <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">
                  Suportamos faturas em PDF da maioria dos bancos (Nubank, Inter, Itaú, etc).
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf, image/jpeg, image/png"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <Button 
                  size="lg" 
                  onClick={() => fileInputRef.current?.click()}
                  className="font-bold"
                >
                  Escolher Arquivo
                </Button>

                {error && (
                  <div className="mt-6 flex items-center gap-2 text-expense text-sm bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="py-8 px-4">
            <div className="flex flex-col items-center max-w-sm mx-auto">
               <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Arquivo Protegido
              </h3>
              <p className="text-sm text-slate-500 mb-6 text-center">
                Este PDF requer uma senha. Normalmente os primeiros dígitos do CPF/CNPJ.
              </p>

              <div className="w-full space-y-4">
                <Input
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center tracking-widest"
                  autoFocus
                />
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="save-pwd" 
                    checked={savePassword}
                    onCheckedChange={(c) => setSavePassword(!!c)}
                  />
                  <label
                    htmlFor="save-pwd"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Salvar senha para este cartão
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!password || isLoading}
                  isLoading={isLoading}
                >
                  Abrir Fatura
                </Button>
                
                {error && (
                  <p className="text-xs text-expense text-center">{error}</p>
                )}
              </div>
            </div>
          </form>
        )}

        {step === 'summary' && (
          <div className="flex flex-col gap-6 py-4 px-2 overflow-y-auto">
            
            {/* Bank Detection Badge */}
            {detectedBank && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <Building2 className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Banco Detectado</p>
                  <p className="font-bold">{detectedBank}</p>
                </div>
                {/* Future: Add 'Change' button here if detection fails */}
              </div>
            )}
            
            {/* 1. Comparison Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
               <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                 <AlertTriangle className={`h-4 w-4 ${hasSignificantDiff ? 'text-amber-500' : 'text-slate-400'}`} />
                 Resumo e Reconciliação
               </h4>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-xs text-slate-500 mb-1">Total na Fatura (PDF)</p>
                   <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                     {extractedTotal ? formatCurrency(extractedTotal) : 'Não detectado'}
                   </p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-500 mb-1">Soma das Transações</p>
                   <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                     {formatCurrency(transactionsSum)}
                   </p>
                 </div>
               </div>

               {hasSignificantDiff && extractedTotal > 0 && (
                 <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg">
                   Diferença de <strong>{formatCurrency(diff)}</strong> detectada. Verifique se alguma transação não foi lida corretamente.
                 </div>
               )}
            </div>

            {/* 2. Payment Scheduling Options */}
            <div className="space-y-4">
               <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="schedule-payment" 
                    checked={schedulePayment}
                    onCheckedChange={(c) => setSchedulePayment(!!c)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="schedule-payment"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Agendar pagamento da fatura ("A Vencer")
                    </label>
                    <p className="text-xs text-slate-500">
                      Cria uma despesa pendente para a data de vencimento.
                    </p>
                  </div>
               </div>

               {schedulePayment && (
                 <div className="pl-6 space-y-4 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Data de Vencimento
                          </label>
                          <Input 
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Valor do Pagamento
                          </label>
                          {/* Payment Amount Choice */}
                          <div className="flex flex-col gap-2">
                             <Input 
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                step="0.01"
                             />
                             {extractedMinPayment > 0 && (
                               <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-6 text-[10px]"
                                    onClick={() => setPaymentAmount(extractedMinPayment)}
                                  >
                                    Mínimo: {formatCurrency(extractedMinPayment)}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-6 text-[10px]"
                                    onClick={() => setPaymentAmount(extractedTotal || transactionsSum)}
                                  >
                                    Total
                                  </Button>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex justify-end pt-4">
               <Button onClick={() => setStep('review')}>
                 Revisar Transações <ArrowRight className="h-4 w-4 ml-2" />
               </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col h-full flex-1 min-h-0">
             <div className="mb-4 flex items-center justify-between">
               <p className="text-sm text-slate-500">
                 Selecione as transações para importar.
               </p>
               <Button variant="ghost" size="sm" onClick={() => setStep('summary')}>
                 Voltar ao Resumo
               </Button>
             </div>

             <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50 dark:bg-slate-800/50 min-h-0 relative">
               <div className="divide-y divide-slate-100 dark:divide-slate-700 pb-20">
                 {transactions.map((t, index) => {
                   const isSelected = selectedIndices.has(index);
                   return (
                     <div 
                       key={index} 
                       className={`flex items-center gap-3 p-3 transition-colors ${
                         isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                       }`}
                       onClick={() => toggleSelection(index)}
                     >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(index)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate pr-2">
                              {t.description}
                            </p>
                            <p className="font-bold text-sm text-slate-900 dark:text-white flex-shrink-0">
                              {formatCurrency(t.amount)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {t.date.split('-').reverse().join('/')}
                            </span>
                            
                            <div className="flex-1 max-w-[180px]" onClick={(e) => e.stopPropagation()}>
                              <Select 
                                value={t.categoryId} 
                                onValueChange={(val) => updateCategory(index, val)}
                              >
                                <SelectTrigger className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                   <SelectValue placeholder="Sem categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-2 h-2 rounded-full" 
                                          style={{ backgroundColor: cat.color || '#94a3b8' }}
                                        />
                                        {cat.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {t.predictionReason && !t.categoryId && (
                             <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                               <Tag className="h-3 w-3" /> Sugestão disponível
                             </span>
                          )}
                          {t.isDuplicate && (
                             <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-medium">
                               <AlertTriangle className="h-3 w-3" /> Provável duplicata detectada
                             </span>
                          )}
                        </div>
                     </div>
                   );
                 })}
                 
                 {/* Manual Input Form */}
                 {showManualInput && (
                   <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-1 gap-3">
                        <Input 
                          placeholder="Descrição da despesa" 
                          value={manualDescription}
                          onChange={(e) => setManualDescription(e.target.value)}
                          className="h-9 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                           <Input 
                             type="number" 
                             placeholder="Valor" 
                             value={manualAmount}
                             onChange={(e) => setManualAmount(e.target.value)}
                             className="h-9 text-sm w-1/3"
                             step="0.01"
                           />
                           <Input 
                             type="date"
                             value={manualDate}
                             onChange={(e) => setManualDate(e.target.value)}
                             className="h-9 text-sm w-1/3"
                           />
                           <div className="flex-1 flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setShowManualInput(false)}>Cancelar</Button>
                              <Button size="sm" onClick={handleAddManualTransaction}>Adicionar</Button>
                           </div>
                        </div>
                      </div>
                   </div>
                 )}
               </div>
               
               {/* Add Manual Button (Floating) */}
               {!showManualInput && (
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                    <Button 
                      size="sm" 
                      className="shadow-lg pointer-events-auto rounded-full px-6"
                      onClick={() => {
                        setShowManualInput(true);
                        setManualDate(format(new Date(), 'yyyy-MM-dd'));
                      }}
                    >
                      + Adicionar Manualmente
                    </Button>
                 </div>
               )}
             </div>

             <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                {/* Total Comparison Row */}
                <div className="flex items-center justify-between text-xs px-2">
                   <div className="text-slate-500">
                     Fatura (PDF): <span className="font-mono text-slate-700 dark:text-slate-300">{extractedTotal ? formatCurrency(extractedTotal) : '-'}</span>
                   </div>
                   <div className={`${isDiffPositive ? 'text-green-600' : isDiffNegative ? 'text-red-600' : 'text-slate-500'}`}>
                     Diferença: <span className="font-mono">{formatCurrency(diffManual)}</span>
                   </div>
                   <div className="text-slate-500">
                     Selecionado: <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(selectedTotal)}</span>
                   </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport} isLoading={isLoading}>
                    <Check className="h-4 w-4 mr-2" />
                    Importar (+Recibo)
                  </Button>
                </div>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
