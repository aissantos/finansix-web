import { useState, useRef } from 'react';
import { 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { extractTextFromPDF, parseInvoiceText, type ParsedTransaction } from '@/lib/invoice-parser';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useCreditCard, useUpdateCreditCard, useCategories, useRecentTransactions, useHousehold } from '@/hooks';
import { predictCategory } from '@/lib/category-predictor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from 'lucide-react';
import { addDays, format } from 'date-fns';

type ParsedTransactionWithCategory = ParsedTransaction & {
  categoryId?: string;
  predictionReason?: string;
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

  const { data: categories = [] } = useCategories('expense');
  const { data: recentTransactions = [] } = useRecentTransactions(100);

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

  // ... (reset handleClose)
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
    onClose();
  };

  // ... (existing functions)

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

  const selectedTotal = transactions
    .filter((_, i) => selectedIndices.has(i))
    .reduce((sum, t) => sum + t.amount, 0);

  const diffManual = extractedTotal ? extractedTotal - selectedTotal : 0;
  const isDiffPositive = diffManual > 0.1;
  const isDiffNegative = diffManual < -0.1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ... (Header) */}
        <DialogHeader>
          <DialogTitle>Importar Fatura (PDF)</DialogTitle>
          <DialogDescription className="text-slate-500">
             Importe transações automaticamente da sua fatura em PDF.
          </DialogDescription>
        </DialogHeader>

        {/* ... (step === 'upload' && ...) */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Processando arquivo...</p>
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
                  accept="application/pdf"
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

        {/* ... (step === 'password' && ...) */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="py-8 px-4">
             {/* ... same implementation ... */}
             <div className="flex flex-col items-center max-w-sm mx-auto">
               <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Arquivo Protegido
              </h3>
               {/* ... */}
              <div className="w-full space-y-4">
                <Input
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center tracking-widest"
                  autoFocus
                />
                {/* ... */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="save-pwd" 
                    checked={savePassword}
                    onCheckedChange={(c) => setSavePassword(!!c)}
                  />
                  <label htmlFor="save-pwd" className="text-sm font-medium leading-none">
                    Salvar senha para este cartão
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={!password || isLoading} isLoading={isLoading}>
                  Abrir Fatura
                </Button>
                {error && <p className="text-xs text-expense text-center">{error}</p>}
              </div>
            </div>
          </form>
        )}

        {/* ... (step === 'summary' && ...) */}
        {step === 'summary' && (
          // ... same implementation ...
          <div className="flex flex-col gap-6 py-4 px-2 overflow-y-auto">
            {/* ... Comparison Card & Payment Options ... */}
             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
               {/* ... */}
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
               {/* ... */}
            </div>

            <div className="space-y-4">
                {/* ... Payment Scheduling Options ... */}
               <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="schedule-payment" 
                    checked={schedulePayment}
                    onCheckedChange={(c) => setSchedulePayment(!!c)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="schedule-payment" className="text-sm font-medium leading-none">
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
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Data de Vencimento</label>
                          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Valor do Pagamento</label>
                           <div className="flex flex-col gap-2">
                             <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} step="0.01" />
                             {extractedMinPayment > 0 && (
                               <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setPaymentAmount(extractedMinPayment)}>
                                    Mínimo: {formatCurrency(extractedMinPayment)}
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setPaymentAmount(extractedTotal || transactionsSum)}>
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
