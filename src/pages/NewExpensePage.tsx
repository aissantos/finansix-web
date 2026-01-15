import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  X,
  TrendingDown,
  Calendar,
  CreditCard,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { CustomNumericKeypad } from "@/components/ui/CustomNumericKeypad";
import { InstallmentConfirmDialog } from "@/components/features/InstallmentConfirmDialog";
import {
  useCreateTransaction,
  useCategories,
  useCreditCards,
  useAccounts,
  useSmartCategorySearch,
} from "@/hooks";
import { toast } from "@/hooks/useToast";
import { formatCurrency, cn } from "@/lib/utils";

const expenseSchema = z
  .object({
    amount: z.number().positive("Valor deve ser maior que zero"),
    description: z.string().min(1, "Descrição é obrigatória"),
    category_id: z.string().optional(),
    credit_card_id: z.string().optional(),
    account_id: z.string().optional(),
    transaction_date: z.string(),
    is_installment: z.boolean(),
    total_installments: z.number().min(1).max(48),
    is_reimbursable: z.boolean(),
    reimbursement_source: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Garantir que existe um meio de pagamento selecionado (seja cartão ou conta)
    // Se for parcelado, pode ser via cartão OU via conta ("Despesa Recorrente 12x")
    if (!data.credit_card_id && !data.account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione uma forma de pagamento (Cartão ou Conta)",
        path: ["credit_card_id"], // Aponta para cartão por padrão, mas poderia ser genérico
      });
    }
  });

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function NewExpensePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get("category");

  const [paymentMethod, setPaymentMethod] = useState<
    "credit" | "debit" | "pix"
  >("credit");
  const [showKeypad, setShowKeypad] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showInstallmentConfirm, setShowInstallmentConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] =
    useState<ExpenseForm | null>(null);

  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { data: categories } = useCategories();
  const { data: cards } = useCreditCards();
  const { data: accounts } = useAccounts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category_id: preselectedCategory || undefined,
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      is_installment: false,
      total_installments: 1,
      is_reimbursable: false,
    },
  });

  const isInstallment = watch("is_installment");
  const totalInstallments = watch("total_installments");
  const amount = watch("amount");

  const smartCategories = useSmartCategorySearch(categorySearch, amount);
  const displayCategories = categorySearch
    ? smartCategories.filter((c) => !c.type || c.type === "expense")
    : categories?.filter((c) => !c.type || c.type === "expense") ?? [];

  const handleAmountChange = (value: number) => {
    setValue("amount", value, { shouldDirty: true });
  };

  const handleKeypadConfirm = () => {
    setShowKeypad(false);
  };

  const handleFormSubmit = (data: ExpenseForm) => {
    if (data.is_installment && data.total_installments > 1) {
      setPendingSubmitData(data);
      setShowInstallmentConfirm(true);
      return;
    }
    submitTransaction(data);
  };

  const submitTransaction = (data: ExpenseForm) => {
    createTransaction(
      {
        type: "expense",
        amount: data.amount,
        description: data.description,
        category_id: data.category_id || null,
        credit_card_id: paymentMethod === "credit" ? data.credit_card_id : null,
        account_id: paymentMethod !== "credit" ? data.account_id : null,
        transaction_date: data.transaction_date,
        is_installment: data.is_installment,
        total_installments: data.is_installment ? data.total_installments : 1,
        is_reimbursable: data.is_reimbursable,
        reimbursement_source: data.is_reimbursable
          ? data.reimbursement_source
          : null,
      },
      {
        onSuccess: () => {
          const installmentText =
            data.is_installment && data.total_installments > 1
              ? ` em ${data.total_installments}x`
              : "";
          toast({
            title: "Despesa criada!",
            description: `Despesa de ${formatCurrency(
              data.amount
            )}${installmentText} registrada.`,
            variant: "success",
          });
          navigate("/");
        },
        onError: () => {
          toast({
            title: "Erro ao criar despesa",
            description: "Tente novamente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleInstallmentConfirm = () => {
    if (pendingSubmitData) {
      submitTransaction(pendingSubmitData);
    }
    setShowInstallmentConfirm(false);
    setPendingSubmitData(null);
  };

  const handleInstallmentCancel = () => {
    setShowInstallmentConfirm(false);
    setPendingSubmitData(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 transition-colors shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-expense/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-expense" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Nova Despesa
          </h1>
        </div>
        <div className="w-10" />
      </header>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex-1 px-4 pb-8"
      >
        {/* Amount Card */}
        <Card className="p-6 mb-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-expense/20">
          <p className="text-xs font-bold text-expense/70 uppercase tracking-wide mb-2">
            Valor da Despesa
          </p>
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            className="w-full text-left"
          >
            <span className="text-4xl font-black text-expense">
              {amount > 0 ? formatCurrency(amount) : "R$ 0,00"}
            </span>
          </button>
          {errors.amount && (
            <p className="text-xs text-red-500 mt-2">{errors.amount.message}</p>
          )}
        </Card>

        {/* Description */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Descrição
          </label>
          <input
            {...register("description")}
            type="text"
            className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="Ex: Mercado, Uber, iFood..."
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-2">
              {errors.description.message}
            </p>
          )}
        </Card>

        {/* Date */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Data
          </label>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <input
              {...register("transaction_date")}
              type="date"
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>
        </Card>

        {/* Category Search */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Categoria
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {displayCategories.map((cat) => {
              const isSelected = watch("category_id") === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue("category_id", cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  <Icon name={cat.icon} className="h-3 w-3 mr-1.5" /> {cat.name}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Forma de Pagamento
          </label>
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex mb-4">
            {(["credit", "debit", "pix"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  paymentMethod === method
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500"
                )}
              >
                {method === "credit"
                  ? "Crédito"
                  : method === "debit"
                  ? "Débito"
                  : "Pix"}
              </button>
            ))}
          </div>

          {/* Card Selection */}
          {paymentMethod === "credit" && cards?.length ? (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              {cards.map((card) => {
                const isSelected = watch("credit_card_id") === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setValue("credit_card_id", card.id)}
                    className={cn(
                      "flex-shrink-0 w-40 h-24 rounded-xl p-3 flex flex-col justify-between text-white shadow-md relative overflow-hidden transition-all",
                      isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    style={{ backgroundColor: card.color || "#6366f1" }}
                  >
                    <div className="flex justify-between items-start text-xs font-bold">
                      {card.name}
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 opacity-90 text-sm font-mono">
                      <span>••••</span>
                      <span>{card.last_four_digits}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : paymentMethod !== "credit" && accounts?.length ? (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              {accounts.map((acc) => {
                const isSelected = watch("account_id") === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setValue("account_id", acc.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 transition-all",
                      isSelected ? "ring-2 ring-primary" : ""
                    )}
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {acc.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(acc.current_balance ?? 0)}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </Card>

        {/* Installments - only for credit card */}
        {paymentMethod === "credit" && (
          <Card className="p-4 mb-4">
            <label className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Parcelar
                </p>
                <p className="text-xs text-slate-500">Dividir em até 48x</p>
              </div>
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => {
                  setValue("is_installment", e.target.checked);
                  if (!e.target.checked) setValue("total_installments", 1);
                }}
                className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
              />
            </label>

            {isInstallment && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500">
                    Número de parcelas
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {totalInstallments}x
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="48"
                  value={totalInstallments}
                  onChange={(e) =>
                    setValue("total_installments", Number(e.target.value))
                  }
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>2x</span>
                  <span>24x</span>
                  <span>48x</span>
                </div>
                {amount > 0 && (
                  <p className="text-center text-xs text-slate-500 mt-3">
                    {totalInstallments}x de{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(amount / totalInstallments)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Recurring Expense Checkbox (12x) */}
        <Card className="p-4 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Despesa Recorrente (12 meses)
              </p>
              <p className="text-xs text-slate-500">
                Criar automaticamente 12 parcelas fixas
              </p>
            </div>
            <input
              type="checkbox"
              onChange={(e) => {
                const checked = e.target.checked;
                setValue("is_installment", checked);
                setValue("total_installments", checked ? 12 : 1);
              }}
              checked={isInstallment && totalInstallments === 12}
              className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
            />
          </label>
        </Card>

        {/* Reimbursable */}
        <Card className="p-4 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Reembolsável
              </p>
              <p className="text-xs text-slate-500">
                Marque se será ressarcido
              </p>
            </div>
            <input
              type="checkbox"
              {...register("is_reimbursable")}
              className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
            />
          </label>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full bg-expense hover:bg-red-600"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Salvar Despesa
        </Button>
      </form>

      {/* Installment Confirmation Dialog */}
      <InstallmentConfirmDialog
        isOpen={showInstallmentConfirm}
        onClose={handleInstallmentCancel}
        onConfirm={handleInstallmentConfirm}
        totalAmount={pendingSubmitData?.amount ?? 0}
        installments={pendingSubmitData?.total_installments ?? 1}
        cardName={
          cards?.find((c) => c.id === pendingSubmitData?.credit_card_id)?.name
        }
        startDate={
          pendingSubmitData?.transaction_date
            ? new Date(pendingSubmitData.transaction_date)
            : undefined
        }
        description={pendingSubmitData?.description ?? ""}
        isLoading={isPending}
      />

      {/* Custom Numeric Keypad Modal */}
      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowKeypad(false)}
          />
          <div className="relative w-full bg-white dark:bg-slate-900 p-6 pt-8 rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <button
              type="button"
              onClick={() => setShowKeypad(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">
              Valor da Despesa
            </h3>
            <CustomNumericKeypad
              value={amount}
              onChange={handleAmountChange}
              onConfirm={handleKeypadConfirm}
              maxValue={999999.99}
              currency="BRL"
            />
          </div>
        </div>
      )}
    </div>
  );
}
