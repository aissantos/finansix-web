# 🚀 Roadmap de Melhorias - Finansix v1.5.9.0

> **Versix Team Developers** | Fevereiro 2026  
> Documento de planejamento para evolução das features existentes

---

## 📋 Sumário Executivo

Este roadmap detalha as melhorias prioritárias para as features existentes do Finansix, organizadas em 4 frentes principais:

| Frente | Prioridade | Sprints | Impacto |
|--------|------------|---------|---------|
| Invoice Parser | 🔴 Alta | 4-5 | Expansão de mercado |
| SmartInsights | 🟠 Média-Alta | 3-4 | Engajamento |
| Category Predictor | 🟡 Média | 2-3 | UX/Automação |
| UX/UI | 🟢 Contínua | 2-3 | Satisfação |

**Timeline Total:** 12-16 semanas (Q1-Q2 2026)

---

## 1️⃣ Invoice Parser - Expansão Multi-Banco

### 1.1 Visão Geral

**Estado Atual:** Suporte apenas para Nubank  
**Objetivo:** Suportar os 6 principais bancos brasileiros + OCR para faturas escaneadas

### 1.2 Bancos Prioritários

| Banco | Market Share | Complexidade | Sprint |
|-------|--------------|--------------|--------|
| Nubank | ✅ Implementado | - | - |
| Itaú | 18.2% | Média | Sprint 1 |
| Bradesco | 14.8% | Média | Sprint 1 |
| Santander | 11.3% | Média | Sprint 2 |
| Banco Inter | 8.1% | Baixa | Sprint 2 |
| C6 Bank | 5.4% | Baixa | Sprint 3 |
| BTG Pactual | 3.2% | Alta | Sprint 3 |

### 1.3 Implementação Técnica

#### Sprint 1: Itaú + Bradesco (2 semanas)

**Arquivos a modificar:**
- `src/lib/invoice-parser.ts` - Adicionar parsers específicos
- `src/components/features/InvoiceImportModal.tsx` - UI de seleção de banco

**Estrutura proposta:**

```typescript
// src/lib/invoice-parsers/index.ts
export interface BankParser {
  bankId: string;
  bankName: string;
  detectBank: (text: string) => boolean;
  parseTransactions: (text: string) => ParsedTransaction[];
  parseMetadata: (text: string) => InvoiceMetadata;
}

// Registry de parsers
export const bankParsers: BankParser[] = [
  nubankParser,
  itauParser,
  bradescoParser,
  // ...
];

// Auto-detect bank from PDF content
export function detectBankAndParse(text: string): ParseResult {
  const parser = bankParsers.find(p => p.detectBank(text));
  if (!parser) throw new Error('Banco não suportado');
  return {
    bank: parser.bankName,
    transactions: parser.parseTransactions(text),
    metadata: parser.parseMetadata(text),
  };
}
```

**Patterns de detecção por banco:**

```typescript
// Itaú
const itauPatterns = {
  detect: /itaú|itau|iuclick/i,
  date: /(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)$/,
  total: /total\s+da\s+fatura[:\s]*([\d.,]+)/i,
};

// Bradesco
const bradescoPatterns = {
  detect: /bradesco|bradescard/i,
  date: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d.,]+)/,
  total: /valor\s+total[:\s]*R\$\s*([\d.,]+)/i,
};
```

**Tasks:**
- [ ] Criar `src/lib/invoice-parsers/itau.ts`
- [ ] Criar `src/lib/invoice-parsers/bradesco.ts`
- [ ] Refatorar `invoice-parser.ts` para usar registry pattern
- [ ] Adicionar testes com PDFs reais de cada banco
- [ ] Atualizar UI para mostrar banco detectado

**Critérios de Aceite:**
- [ ] Parser detecta banco automaticamente com 95%+ precisão
- [ ] Extrai ≥90% das transações corretamente
- [ ] Testes passando com amostras reais
- [ ] Fallback para seleção manual se auto-detect falhar

---

#### Sprint 2: Santander + Inter (2 semanas)

**Patterns adicionais:**

```typescript
// Santander
const santanderPatterns = {
  detect: /santander|getnet/i,
  date: /(\d{2}\s+\w{3})\s+(.+?)\s+([\d.,]+)\s*$/,
  dueDate: /vencimento[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
};

// Inter
const interPatterns = {
  detect: /banco\s*inter|inter\s*mastercard/i,
  date: /(\d{2}\/\d{2})\s+-\s+(.+?)\s+R\$\s*([\d.,]+)/,
};
```

**Tasks:**
- [ ] Criar `src/lib/invoice-parsers/santander.ts`
- [ ] Criar `src/lib/invoice-parsers/inter.ts`
- [ ] Implementar handling de formatos de data variados
- [ ] Adicionar suporte a múltiplas páginas

---

#### Sprint 3: C6 + BTG + OCR (2 semanas)

**OCR com Tesseract.js:**

```typescript
// src/lib/invoice-parsers/ocr.ts
import Tesseract from 'tesseract.js';

export async function extractTextWithOCR(imageFile: File): Promise<string> {
  const result = await Tesseract.recognize(imageFile, 'por', {
    logger: m => console.log(m), // Progress callback
  });
  return result.data.text;
}

// Preprocessamento para melhorar OCR
export async function preprocessImage(file: File): Promise<Blob> {
  // Aumentar contraste, binarização, deskew
  // Usar canvas API ou sharp no backend
}
```

**Tasks:**
- [ ] Criar `src/lib/invoice-parsers/c6.ts`
- [ ] Criar `src/lib/invoice-parsers/btg.ts`
- [ ] Implementar OCR com Tesseract.js
- [ ] Adicionar opção "Upload de foto/scan"
- [ ] Implementar pré-processamento de imagem

---

#### Sprint 4: Deduplicação Inteligente (1 semana)

**Problema:** Usuário importa fatura e já tem transações manuais duplicadas

**Solução:**

```typescript
// src/lib/invoice-parsers/deduplication.ts
interface MatchScore {
  transactionId: string;
  importedIndex: number;
  score: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'amount_date';
}

export function findDuplicates(
  imported: ParsedTransaction[],
  existing: Transaction[],
  threshold = 80
): MatchScore[] {
  return imported.flatMap((imp, idx) => {
    const matches = existing
      .map(ex => ({
        transactionId: ex.id,
        importedIndex: idx,
        score: calculateMatchScore(imp, ex),
        matchType: determineMatchType(imp, ex),
      }))
      .filter(m => m.score >= threshold);
    return matches;
  });
}

function calculateMatchScore(a: ParsedTransaction, b: Transaction): number {
  let score = 0;
  
  // Mesmo valor = +40 pontos
  if (Math.abs(a.amount - b.amount) < 0.01) score += 40;
  
  // Mesma data = +30 pontos
  if (a.date === b.transaction_date) score += 30;
  
  // Descrição similar = +30 pontos (fuzzy match)
  const similarity = levenshteinSimilarity(a.description, b.description);
  score += Math.round(similarity * 30);
  
  return score;
}
```

**UI de resolução:**

```tsx
// src/components/features/DuplicateResolver.tsx
function DuplicateResolver({ duplicates, onResolve }) {
  return (
    <Dialog>
      <DialogTitle>Transações Possivelmente Duplicadas</DialogTitle>
      {duplicates.map(dup => (
        <Card key={dup.importedIndex}>
          <div className="flex justify-between">
            <div>
              <p className="font-bold">Importada:</p>
              <p>{dup.imported.description}</p>
              <p>{formatCurrency(dup.imported.amount)}</p>
            </div>
            <div>
              <p className="font-bold">Existente:</p>
              <p>{dup.existing.description}</p>
              <p>{formatCurrency(dup.existing.amount)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => onResolve(dup, 'skip')}>
              Ignorar (já existe)
            </Button>
            <Button onClick={() => onResolve(dup, 'import')}>
              Importar mesmo assim
            </Button>
            <Button onClick={() => onResolve(dup, 'merge')}>
              Mesclar informações
            </Button>
          </div>
        </Card>
      ))}
    </Dialog>
  );
}
```

**Tasks:**
- [ ] Criar algoritmo de matching fuzzy
- [ ] Implementar UI de resolução de duplicatas
- [ ] Adicionar opção "Importar todos sem duplicados"
- [ ] Salvar preferência do usuário para auto-resolver

---

### 1.4 Métricas de Sucesso

| Métrica | Atual | Meta |
|---------|-------|------|
| Bancos suportados | 1 | 7 |
| Taxa de extração | ~85% | ≥95% |
| Duplicatas detectadas | 0% | ≥90% |
| Tempo médio de import | 8s | <5s |

---

## 2️⃣ SmartInsights - Análise Avançada

### 2.1 Visão Geral

**Estado Atual:** Comparação simples com média histórica  
**Objetivo:** Insights acionáveis e personalizados com análise comportamental

### 2.2 Novos Tipos de Insights

#### Sprint 5: Análise Temporal (2 semanas)

**Insight: Padrões por dia da semana**

```typescript
// src/lib/analysis/temporal-patterns.ts
interface DayPattern {
  dayOfWeek: number; // 0-6
  dayName: string;
  avgSpending: number;
  transactionCount: number;
  topCategory: string;
  peakHour: number;
}

export async function analyzeDayPatterns(
  householdId: string,
  months = 3
): Promise<DayPattern[]> {
  const transactions = await getTransactionsForPeriod(householdId, months);
  
  const byDay = groupBy(transactions, tx => 
    new Date(tx.transaction_date).getDay()
  );
  
  return Object.entries(byDay).map(([day, txs]) => ({
    dayOfWeek: Number(day),
    dayName: DAYS_PT[day],
    avgSpending: mean(txs.map(t => t.amount)),
    transactionCount: txs.length,
    topCategory: mode(txs.map(t => t.category?.name)),
    peakHour: findPeakHour(txs),
  }));
}

// Gerar insight
export function generateTemporalInsight(patterns: DayPattern[]): SpendingInsight | null {
  const sorted = orderBy(patterns, 'avgSpending', 'desc');
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  
  if (highest.avgSpending > lowest.avgSpending * 2) {
    return {
      type: 'neutral',
      message: `${highest.dayName} é seu dia de maior gasto`,
      detail: `Você gasta em média ${formatCurrency(highest.avgSpending)} às ${highest.dayName}s, ` +
              `principalmente em ${highest.topCategory}. ` +
              `Considere planejar compras para ${lowest.dayName}s.`,
      metric: `${Math.round((highest.avgSpending / lowest.avgSpending - 1) * 100)}% mais`,
    };
  }
  return null;
}
```

**Insight: Gastos por horário**

```typescript
interface HourlyPattern {
  hour: number;
  avgAmount: number;
  frequency: number;
  isImpulse: boolean; // Compras >R$100 após 22h ou <6h
}

export function detectImpulseBuying(transactions: Transaction[]): SpendingInsight | null {
  const lateNight = transactions.filter(tx => {
    const hour = new Date(tx.created_at).getHours();
    return (hour >= 22 || hour < 6) && tx.amount > 100;
  });
  
  if (lateNight.length >= 3) {
    const total = sumBy(lateNight, 'amount');
    return {
      type: 'warning',
      message: 'Compras noturnas detectadas',
      detail: `Você fez ${lateNight.length} compras acima de R$100 entre 22h e 6h ` +
              `totalizando ${formatCurrency(total)}. Compras nesse horário tendem a ser impulsivas.`,
      metric: formatCurrency(total),
    };
  }
  return null;
}
```

**Tasks:**
- [ ] Criar `src/lib/analysis/temporal-patterns.ts`
- [ ] Adicionar campo `created_at` com hora nas transações
- [ ] Implementar visualização de heatmap semanal
- [ ] Criar componente `WeeklyPatternChart`

---

#### Sprint 6: Detecção de Assinaturas Esquecidas (1.5 semanas)

**Problema:** Usuário paga Netflix, Spotify, etc. mas não catalogou como assinatura

```typescript
// src/lib/analysis/subscription-detector.ts
interface SuspectedSubscription {
  description: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  confidence: number;
  occurrences: Date[];
  suggestedCategory: string;
}

export async function detectHiddenSubscriptions(
  householdId: string
): Promise<SuspectedSubscription[]> {
  const transactions = await getLast12MonthsTransactions(householdId);
  
  // Agrupar por descrição normalizada
  const grouped = groupBy(transactions, tx => 
    normalizeDescription(tx.description)
  );
  
  return Object.entries(grouped)
    .map(([desc, txs]) => analyzeRecurrence(desc, txs))
    .filter(sub => sub !== null && sub.confidence >= 70)
    .filter(sub => !isAlreadySubscription(sub, householdId));
}

function analyzeRecurrence(description: string, transactions: Transaction[]): SuspectedSubscription | null {
  if (transactions.length < 3) return null;
  
  const amounts = transactions.map(t => t.amount);
  const dates = transactions.map(t => new Date(t.transaction_date));
  
  // Verificar se valores são consistentes (±5%)
  const avgAmount = mean(amounts);
  const isConsistentAmount = amounts.every(a => 
    Math.abs(a - avgAmount) / avgAmount < 0.05
  );
  
  if (!isConsistentAmount) return null;
  
  // Calcular intervalo médio entre transações
  const intervals = dates.slice(1).map((d, i) => 
    differenceInDays(d, dates[i])
  );
  const avgInterval = mean(intervals);
  
  // Determinar frequência
  let frequency: 'monthly' | 'yearly' | 'weekly' | null = null;
  if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
  else if (avgInterval >= 360 && avgInterval <= 370) frequency = 'yearly';
  else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'weekly';
  
  if (!frequency) return null;
  
  // Calcular confiança baseado na consistência
  const intervalVariance = Math.abs(max(intervals) - min(intervals));
  const confidence = Math.max(0, 100 - intervalVariance * 5);
  
  return {
    description,
    amount: avgAmount,
    frequency,
    confidence,
    occurrences: dates,
    suggestedCategory: predictSubscriptionCategory(description),
  };
}

// Keywords para categorização
const SUBSCRIPTION_KEYWORDS = {
  'streaming': ['netflix', 'spotify', 'disney', 'hbo', 'prime', 'youtube', 'deezer'],
  'software': ['adobe', 'microsoft', 'google', 'dropbox', 'notion', 'figma', 'github'],
  'fitness': ['smartfit', 'gympass', 'strava', 'nike'],
  'news': ['folha', 'estadao', 'globo', 'uol'],
};
```

**UI de sugestão:**

```tsx
// src/components/features/SubscriptionSuggestions.tsx
function SubscriptionSuggestions() {
  const { data: suggestions } = useHiddenSubscriptions();
  
  if (!suggestions?.length) return null;
  
  return (
    <Card className="p-4 border-l-4 border-l-violet-500">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h3 className="font-bold">Assinaturas Detectadas</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Encontramos cobranças recorrentes que parecem ser assinaturas:
      </p>
      {suggestions.map(sub => (
        <div key={sub.description} className="flex justify-between items-center py-2 border-b">
          <div>
            <p className="font-medium">{sub.description}</p>
            <p className="text-xs text-slate-400">
              {sub.frequency === 'monthly' ? 'Mensal' : 'Anual'} • 
              {sub.occurrences.length} cobranças detectadas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{formatCurrency(sub.amount)}</span>
            <Button size="sm" onClick={() => convertToSubscription(sub)}>
              Adicionar
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}
```

**Tasks:**
- [ ] Criar `src/lib/analysis/subscription-detector.ts`
- [ ] Implementar normalização de descrições (remover datas, números)
- [ ] Criar hook `useHiddenSubscriptions`
- [ ] Adicionar UI de sugestão na HomePage
- [ ] Implementar conversão em Assinatura catalogada

---

#### Sprint 7: Benchmark Anônimo (1.5 semanas)

**Conceito:** "Você gasta X% menos que a média em restaurantes"

**Arquitetura:**

```sql
-- Supabase Edge Function para agregar dados anônimos
-- supabase/functions/benchmark-aggregator/index.ts

-- Tabela de benchmarks (atualizada diariamente via cron)
CREATE TABLE category_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  region TEXT DEFAULT 'BR', -- Futuro: por estado/cidade
  income_bracket TEXT, -- 'low', 'medium', 'high'
  avg_monthly_spend DECIMAL(10,2),
  median_monthly_spend DECIMAL(10,2),
  percentile_25 DECIMAL(10,2),
  percentile_75 DECIMAL(10,2),
  sample_size INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Leitura pública, escrita apenas via service role
ALTER TABLE category_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON category_benchmarks FOR SELECT USING (true);
```

**Edge Function para agregação:**

```typescript
// supabase/functions/benchmark-aggregator/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Agregar gastos por categoria dos últimos 3 meses
  // IMPORTANTE: Dados completamente anônimos
  const { data: aggregates } = await supabase.rpc('aggregate_category_spending');
  
  // Atualizar tabela de benchmarks
  for (const agg of aggregates) {
    await supabase.from('category_benchmarks').upsert({
      category_name: agg.category_name,
      avg_monthly_spend: agg.avg_spend,
      median_monthly_spend: agg.median_spend,
      percentile_25: agg.p25,
      percentile_75: agg.p75,
      sample_size: agg.user_count,
    });
  }
  
  return new Response('OK');
});
```

**Insight de comparação:**

```typescript
// src/lib/analysis/benchmark.ts
export async function generateBenchmarkInsight(
  householdId: string,
  categoryId: string
): Promise<SpendingInsight | null> {
  const [userSpending, benchmark] = await Promise.all([
    getUserCategorySpending(householdId, categoryId, 3),
    getCategoryBenchmark(categoryId),
  ]);
  
  if (!benchmark || benchmark.sample_size < 100) return null;
  
  const userAvg = userSpending.avgMonthly;
  const diff = ((userAvg - benchmark.median_monthly_spend) / benchmark.median_monthly_spend) * 100;
  
  if (Math.abs(diff) < 10) return null; // Diferença insignificante
  
  const isBelow = diff < 0;
  
  return {
    type: isBelow ? 'positive' : 'neutral',
    message: isBelow 
      ? `Você economiza em ${benchmark.category_name}` 
      : `Gasto acima da média em ${benchmark.category_name}`,
    detail: isBelow
      ? `Seus gastos com ${benchmark.category_name} são ${Math.abs(Math.round(diff))}% menores que a média dos usuários Finansix.`
      : `Você gasta ${Math.round(diff)}% mais que a média em ${benchmark.category_name}. Considere revisar esses gastos.`,
    metric: `${isBelow ? '-' : '+'}${Math.abs(Math.round(diff))}%`,
  };
}
```

**Privacidade:**
- ✅ Dados agregados, nunca individuais
- ✅ Mínimo 100 usuários por categoria para exibir
- ✅ Sem correlação com renda ou localização por padrão
- ✅ Opt-out disponível nas configurações

**Tasks:**
- [ ] Criar tabela `category_benchmarks`
- [ ] Implementar Edge Function de agregação
- [ ] Configurar cron job diário
- [ ] Criar `src/lib/analysis/benchmark.ts`
- [ ] Adicionar opt-out em configurações
- [ ] Implementar UI de comparação

---

### 2.3 Arquitetura Final do SmartInsights

```typescript
// src/lib/analysis/insight-engine.ts
export async function generateAllInsights(householdId: string): Promise<SpendingInsight[]> {
  const insights: SpendingInsight[] = [];
  
  // Executar todos os analisadores em paralelo
  const [
    trendInsights,
    temporalInsights,
    subscriptionInsights,
    benchmarkInsights,
    impulseInsights,
  ] = await Promise.all([
    calculateSpendingInsights(householdId),      // Existente
    generateTemporalInsight(householdId),        // Novo
    detectHiddenSubscriptions(householdId),      // Novo
    generateBenchmarkInsights(householdId),      // Novo
    detectImpulseBuying(householdId),            // Novo
  ]);
  
  // Priorizar e limitar a 5 insights
  return prioritizeInsights([
    ...trendInsights,
    temporalInsights,
    ...subscriptionInsights.map(toInsight),
    ...benchmarkInsights,
    impulseInsights,
  ].filter(Boolean)).slice(0, 5);
}

function prioritizeInsights(insights: SpendingInsight[]): SpendingInsight[] {
  const priority = { warning: 3, positive: 2, neutral: 1 };
  return orderBy(insights, i => priority[i.type], 'desc');
}
```

---

## 3️⃣ Category Predictor - ML Local

### 3.1 Visão Geral

**Estado Atual:** Keywords hardcoded + histórico exato  
**Objetivo:** Modelo treinado com dados do usuário que aprende com correções

### 3.2 Implementação

#### Sprint 8: TensorFlow.js + Treinamento Local (2 semanas)

**Arquitetura:**

```typescript
// src/lib/ml/category-model.ts
import * as tf from '@tensorflow/tfjs';

// Modelo simples de classificação de texto
export class CategoryPredictor {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private categories: string[] = [];
  
  async initialize(transactions: TransactionWithDetails[]) {
    // Construir vocabulário das descrições
    this.buildVocabulary(transactions);
    
    // Extrair categorias únicas
    this.categories = [...new Set(
      transactions.map(t => t.category_id).filter(Boolean)
    )] as string[];
    
    // Criar modelo
    this.model = this.createModel();
    
    // Treinar com histórico
    await this.train(transactions);
  }
  
  private buildVocabulary(transactions: TransactionWithDetails[]) {
    const words = new Set<string>();
    transactions.forEach(tx => {
      this.tokenize(tx.description).forEach(w => words.add(w));
    });
    
    // Top 1000 palavras mais frequentes
    const wordFreq = new Map<string, number>();
    transactions.forEach(tx => {
      this.tokenize(tx.description).forEach(w => {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      });
    });
    
    [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1000)
      .forEach(([word], idx) => this.vocabulary.set(word, idx));
  }
  
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .split(/\s+/)
      .filter(w => w.length > 2);
  }
  
  private textToVector(text: string): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    this.tokenize(text).forEach(word => {
      const idx = this.vocabulary.get(word);
      if (idx !== undefined) vector[idx] = 1;
    });
    return vector;
  }
  
  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.vocabulary.size],
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: this.categories.length,
          activation: 'softmax',
        }),
      ],
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
    
    return model;
  }
  
  async train(transactions: TransactionWithDetails[]) {
    const validTx = transactions.filter(t => t.category_id);
    
    const xs = tf.tensor2d(
      validTx.map(tx => this.textToVector(tx.description))
    );
    
    const ys = tf.tensor2d(
      validTx.map(tx => {
        const oneHot = new Array(this.categories.length).fill(0);
        oneHot[this.categories.indexOf(tx.category_id!)] = 1;
        return oneHot;
      })
    );
    
    await this.model!.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: accuracy = ${logs?.acc?.toFixed(3)}`);
        },
      },
    });
    
    xs.dispose();
    ys.dispose();
  }
  
  predict(description: string): { categoryId: string; confidence: number }[] {
    if (!this.model) throw new Error('Model not initialized');
    
    const input = tf.tensor2d([this.textToVector(description)]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const probabilities = prediction.dataSync();
    
    input.dispose();
    prediction.dispose();
    
    return this.categories
      .map((catId, idx) => ({
        categoryId: catId,
        confidence: probabilities[idx],
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3
  }
  
  // Retreinar com correção do usuário
  async learnFromCorrection(description: string, correctCategoryId: string) {
    const xs = tf.tensor2d([this.textToVector(description)]);
    const ys = tf.tensor2d([
      this.categories.map(c => c === correctCategoryId ? 1 : 0),
    ]);
    
    await this.model!.fit(xs, ys, { epochs: 5 });
    
    xs.dispose();
    ys.dispose();
    
    // Salvar modelo atualizado no IndexedDB
    await this.model!.save('indexeddb://category-predictor');
  }
}
```

**Persistência do modelo:**

```typescript
// src/lib/ml/model-storage.ts
export async function loadOrCreateModel(
  householdId: string
): Promise<CategoryPredictor> {
  const predictor = new CategoryPredictor();
  
  try {
    // Tentar carregar modelo salvo
    const model = await tf.loadLayersModel('indexeddb://category-predictor');
    predictor.setModel(model);
    return predictor;
  } catch {
    // Treinar novo modelo com histórico
    const transactions = await getLast6MonthsTransactions(householdId);
    await predictor.initialize(transactions);
    await predictor.model.save('indexeddb://category-predictor');
    return predictor;
  }
}
```

**Tasks:**
- [ ] Instalar TensorFlow.js (`pnpm add @tensorflow/tfjs`)
- [ ] Criar `src/lib/ml/category-model.ts`
- [ ] Implementar persistência em IndexedDB
- [ ] Criar hook `useCategoryPrediction`
- [ ] Adicionar indicador de confiança na UI

---

#### Sprint 9: Feedback Loop + Keywords Brasileiros (1 semana)

**Correção via UI:**

```tsx
// src/components/features/CategorySelector.tsx
function CategorySelector({ 
  description, 
  value, 
  onChange,
  showPrediction = true 
}) {
  const { predictions, isLoading } = useCategoryPrediction(description);
  const [wasAutoPredicted, setWasAutoPredicted] = useState(false);
  
  useEffect(() => {
    if (predictions?.[0]?.confidence > 0.7 && !value) {
      onChange(predictions[0].categoryId);
      setWasAutoPredicted(true);
    }
  }, [predictions]);
  
  const handleManualChange = async (newCategoryId: string) => {
    onChange(newCategoryId);
    
    // Se usuário corrigiu uma predição automática, retreinar
    if (wasAutoPredicted && newCategoryId !== predictions?.[0]?.categoryId) {
      await learnFromCorrection(description, newCategoryId);
      toast({ title: 'Aprendizado registrado', description: 'Próximas sugestões serão melhores!' });
    }
  };
  
  return (
    <div>
      <Select value={value} onValueChange={handleManualChange}>
        {/* Options */}
      </Select>
      
      {showPrediction && predictions?.length > 0 && (
        <div className="mt-2 flex gap-2">
          <span className="text-xs text-slate-400">Sugestões:</span>
          {predictions.slice(0, 2).map(p => (
            <Badge 
              key={p.categoryId}
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleManualChange(p.categoryId)}
            >
              {getCategoryName(p.categoryId)} ({Math.round(p.confidence * 100)}%)
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Expandir keywords brasileiros:**

```typescript
// src/lib/ml/brazilian-keywords.ts
export const BRAZILIAN_MERCHANT_MAP: Record<string, string[]> = {
  // Supermercados
  'mercado': ['carrefour', 'extra', 'pao de acucar', 'assai', 'atacadao', 'dia', 'big', 'nacional', 'zaffari', 'angeloni', 'imperatriz', 'savegnago'],
  
  // Farmácias
  'saude': ['drogasil', 'droga raia', 'pacheco', 'drogaria', 'farmacia', 'ultrafarma', 'pague menos', 'panvel', 'nissei'],
  
  // Postos
  'transporte': ['ipiranga', 'shell', 'petrobras', 'br', 'ale', 'posto'],
  
  // Restaurantes/Fast Food
  'alimentacao': ['mcdonalds', 'burger king', 'subway', 'habibs', 'giraffas', 'bobs', 'outback', 'madero', 'coco bambu', 'pf', 'restaurante', 'lanchonete', 'pizzaria', 'churrascaria'],
  
  // Delivery
  'delivery': ['ifood', 'rappi', 'uber eats', 'zé delivery', 'aiqfome'],
  
  // Streaming
  'assinaturas': ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'apple', 'youtube premium', 'deezer', 'globoplay', 'paramount'],
  
  // Transporte
  'uber_taxi': ['uber', '99', 'cabify', '99app', 'indriver'],
  
  // E-commerce
  'compras': ['amazon', 'mercado livre', 'magalu', 'americanas', 'casas bahia', 'shopee', 'aliexpress', 'shein'],
  
  // Telecomunicação
  'servicos': ['vivo', 'claro', 'tim', 'oi', 'net', 'sky'],
  
  // Educação
  'educacao': ['udemy', 'coursera', 'alura', 'rocketseat', 'escola', 'faculdade', 'curso'],
};
```

**Tasks:**
- [ ] Implementar feedback loop na UI
- [ ] Expandir `BRAZILIAN_MERCHANT_MAP`
- [ ] Criar testes de acurácia
- [ ] Adicionar métrica de "correções por semana"

---

## 4️⃣ UX/UI - Polish & Performance

### 4.1 Dark Mode Automático

#### Sprint 10: Implementação (1 semana)

```typescript
// src/hooks/useTheme.ts
type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const [mode, setMode] = useLocalStorage<ThemeMode>('theme-mode', 'system');
  const [scheduleStart, setScheduleStart] = useLocalStorage('theme-schedule-start', '18:00');
  const [scheduleEnd, setScheduleEnd] = useLocalStorage('theme-schedule-end', '06:00');
  
  const isDark = useMemo(() => {
    if (mode === 'light') return false;
    if (mode === 'dark') return true;
    
    // System mode
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [mode]);
  
  // Listener para mudanças do sistema
  useEffect(() => {
    if (mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);
  
  // Aplicar classe
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  
  return { mode, setMode, isDark, scheduleStart, scheduleEnd, setScheduleStart, setScheduleEnd };
}
```

**UI de configuração:**

```tsx
// src/components/settings/ThemeSettings.tsx
function ThemeSettings() {
  const { mode, setMode } = useTheme();
  
  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">Aparência</h3>
      
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={mode === 'light' ? 'default' : 'outline'}
          onClick={() => setMode('light')}
          className="flex flex-col items-center py-4"
        >
          <Sun className="h-6 w-6 mb-2" />
          <span>Claro</span>
        </Button>
        
        <Button
          variant={mode === 'dark' ? 'default' : 'outline'}
          onClick={() => setMode('dark')}
          className="flex flex-col items-center py-4"
        >
          <Moon className="h-6 w-6 mb-2" />
          <span>Escuro</span>
        </Button>
        
        <Button
          variant={mode === 'system' ? 'default' : 'outline'}
          onClick={() => setMode('system')}
          className="flex flex-col items-center py-4"
        >
          <Monitor className="h-6 w-6 mb-2" />
          <span>Sistema</span>
        </Button>
      </div>
    </Card>
  );
}
```

---

### 4.2 Temas Customizáveis

```typescript
// src/lib/themes.ts
export interface ThemeColors {
  id: string;
  name: string;
  primary: string;
  primaryForeground: string;
  income: string;
  expense: string;
  accent: string;
}

export const PRESET_THEMES: ThemeColors[] = [
  {
    id: 'default',
    name: 'Índigo',
    primary: '79 70 229', // indigo-600
    primaryForeground: '255 255 255',
    income: '34 197 94', // green-500
    expense: '239 68 68', // red-500
    accent: '139 92 246', // violet-500
  },
  {
    id: 'ocean',
    name: 'Oceano',
    primary: '6 182 212', // cyan-500
    primaryForeground: '255 255 255',
    income: '52 211 153', // emerald-400
    expense: '251 146 60', // orange-400
    accent: '56 189 248', // sky-400
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    primary: '249 115 22', // orange-500
    primaryForeground: '255 255 255',
    income: '34 197 94',
    expense: '220 38 38',
    accent: '251 191 36', // amber-400
  },
  {
    id: 'forest',
    name: 'Floresta',
    primary: '22 163 74', // green-600
    primaryForeground: '255 255 255',
    income: '74 222 128', // green-400
    expense: '248 113 113', // red-400
    accent: '34 197 94',
  },
];

// Aplicar tema via CSS variables
export function applyTheme(theme: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-foreground', theme.primaryForeground);
  root.style.setProperty('--income', theme.income);
  root.style.setProperty('--expense', theme.expense);
  root.style.setProperty('--accent', theme.accent);
  
  localStorage.setItem('user-theme', theme.id);
}
```

---

### 4.3 Animações e Haptic Feedback

```typescript
// src/lib/haptics.ts
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error') {
  if (!('vibrate' in navigator)) return;
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [50, 30, 50, 30, 50],
  };
  
  navigator.vibrate(patterns[type]);
}

// Usar em ações importantes
function handleDeleteTransaction() {
  hapticFeedback('medium');
  // ...
}

function handleSaveSuccess() {
  hapticFeedback('success');
  // ...
}
```

**Shared Element Transitions:**

```tsx
// src/components/features/TransactionItem.tsx
import { motion } from 'framer-motion';

function TransactionItem({ transaction, onClick }) {
  return (
    <motion.div
      layoutId={`transaction-${transaction.id}`}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="..."
    >
      <motion.div layoutId={`transaction-icon-${transaction.id}`}>
        <CategoryIcon category={transaction.category} />
      </motion.div>
      <motion.span layoutId={`transaction-amount-${transaction.id}`}>
        {formatCurrency(transaction.amount)}
      </motion.span>
    </motion.div>
  );
}

// Na página de detalhe
function TransactionDetail({ id }) {
  const { data: transaction } = useTransaction(id);
  
  return (
    <motion.div layoutId={`transaction-${id}`}>
      <motion.div layoutId={`transaction-icon-${id}`} className="w-20 h-20">
        <CategoryIcon category={transaction.category} size="lg" />
      </motion.div>
      <motion.span layoutId={`transaction-amount-${id}`} className="text-3xl">
        {formatCurrency(transaction.amount)}
      </motion.span>
    </motion.div>
  );
}
```

**Tasks:**
- [ ] Implementar `useTheme` hook
- [ ] Criar UI de seleção de tema
- [ ] Adicionar preset de temas
- [ ] Implementar haptic feedback
- [ ] Adicionar shared element transitions nas transações

---

## 📊 Cronograma Consolidado

```
2026
├── Fevereiro
│   ├── Sprint 1 (Sem 1-2): Invoice Parser - Itaú + Bradesco
│   └── Sprint 2 (Sem 3-4): Invoice Parser - Santander + Inter
│
├── Março
│   ├── Sprint 3 (Sem 1-2): Invoice Parser - C6 + BTG + OCR
│   ├── Sprint 4 (Sem 3): Invoice Parser - Deduplicação
│   └── Sprint 5 (Sem 4 - Abril Sem 1): SmartInsights - Temporal
│
├── Abril
│   ├── Sprint 6 (Sem 2-3): SmartInsights - Assinaturas
│   └── Sprint 7 (Sem 4 - Maio Sem 1): SmartInsights - Benchmark
│
├── Maio
│   ├── Sprint 8 (Sem 2-3): Category Predictor - ML
│   └── Sprint 9 (Sem 4): Category Predictor - Feedback
│
└── Junho
    └── Sprint 10 (Sem 1-2): UX/UI - Dark Mode + Temas + Animações
```

---

## ✅ Definition of Done

Cada feature deve atender:

- [ ] Código implementado e revisado (PR aprovado)
- [ ] Testes unitários (≥80% cobertura do novo código)
- [ ] Testes E2E para fluxos críticos
- [ ] Documentação atualizada
- [ ] Sem regressões no Lighthouse (Performance ≥90)
- [ ] Aprovado em QA interno
- [ ] Feature flag para rollout gradual

---

## 📈 Métricas de Sucesso Global

| Métrica | Baseline (v1.5.9) | Meta (v1.7.0) |
|---------|-------------------|---------------|
| Bancos suportados | 1 | 7 |
| Acurácia categoria | ~60% | ≥85% |
| Insights por usuário | 1-2 | 4-5 |
| Assinaturas detectadas | 0% | ≥80% |
| Tempo de onboarding | 5min | 2min |
| NPS | - | ≥50 |

---

**Documento mantido por:** Versix Team Developers  
**Última atualização:** Fevereiro 2026  
**Versão:** 1.0.0
