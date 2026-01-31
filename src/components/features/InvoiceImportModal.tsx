import { useState, useRef } from 'react';
import { 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { extractTextFromPDF, parseInvoiceText, type ParsedTransaction } from '@/lib/invoice-parser';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useCreditCard, useUpdateCreditCard, useCategories, useRecentTransactions } from '@/hooks';
import { predictCategory } from '@/lib/category-predictor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from 'lucide-react';

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

  const { data: categories = [] } = useCategories('expense');
  const { data: recentTransactions = [] } = useRecentTransactions(100);

  const [step, setStep] = useState<'upload' | 'password' | 'review' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [savePassword, setSavePassword] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransactionWithCategory[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
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
    setError(null);
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor, selecione um arquivo PDF.');
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
      // Try with stored password first if available and no manual password provided
      const passwordToUse = manualPassword ?? card?.pdf_password ?? undefined;
      
      const text = await extractTextFromPDF(pdfFile, passwordToUse);
      const result = parseInvoiceText(text);
      
      if (result.transactions.length === 0) {
        setError('Nenhuma transação encontrada. O formato da fatura pode não ser suportado.');
        setIsLoading(false);
        return;
      }

      setTransactions(result.transactions.map(t => {
        const prediction = predictCategory(t.description, categories, recentTransactions);
        return {
          ...t,
          categoryId: prediction.categoryId,
          predictionReason: prediction.reason
        };
      }));
      // Select all by default
      setSelectedIndices(new Set(result.transactions.map((_, i) => i)));
      setStep('review');
      
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

  const updateCategory = (index: number, categoryId: string) => {
    setTransactions(prev => prev.map((t, i) => 
      i === index ? { ...t, categoryId } : t
    ));
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

  const handleImport = async () => {
    if (!card) return;
    
    setIsLoading(true);
    setStep('importing');

    try {
      const selectedTransactions = transactions.filter((_, i) => selectedIndices.has(i));
      
      if (selectedTransactions.length === 0) {
        toast({ title: 'Nenhuma transação selecionada', variant: 'destructive' });
        setStep('review');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: household } = await supabase
        .from('households')
        .select('id')
        .eq('owner_id', user.id)
        .single();
        
      if (!household) throw new Error('Household not found');

      // Create transactions in batch
      // Note: This matches the structure used in CardDetailPage manual add
      const transactionsToInsert = selectedTransactions.map(t => ({
        household_id: household.id,
        credit_card_id: creditCardId,
        type: 'expense' as const,
        amount: t.amount,
        description: t.description,
        transaction_date: t.date,
        category_id: t.categoryId,
        status: 'completed' as const,
      }));

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      toast({
        title: 'Importação concluída!',
        description: `${selectedTransactions.length} despesas importadas com sucesso.`,
        variant: 'success'
      });

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
                Este PDF requer uma senha para ser aberto. Normalmente são os primeiros dígitos do CPF.
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

        {step === 'review' && (
          <div className="flex flex-col h-full flex-1 min-h-0">
             <div className="mb-4">
               <p className="text-sm text-slate-500">
                 Encontramos <strong>{transactions.length}</strong> transações. Selecione as que deseja importar.
               </p>
             </div>

             <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50 dark:bg-slate-800/50 min-h-0">
               <div className="divide-y divide-slate-100 dark:divide-slate-700">
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
               </div>
             </div>

             <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
                <div className="text-sm">
                  <span className="text-slate-500">Total Selecionado: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(
                      transactions
                        .filter((_, i) => selectedIndices.has(i))
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport} isLoading={isLoading}>
                    <Check className="h-4 w-4 mr-2" />
                    Importar {selectedIndices.size} Itens
                  </Button>
                </div>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
