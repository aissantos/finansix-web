/* eslint-disable no-console */

import type { TrainingData } from './category-model';
import { CategoryPredictor } from './category-model';
import { supabase } from '@/lib/supabase/client';

let predictorInstance: CategoryPredictor | null = null;
let isInitializing = false;

export async function getCategoryPredictor(householdId?: string): Promise<CategoryPredictor> {
  if (predictorInstance) return predictorInstance;
  
  // Singleton pattern to avoid re-initializing multiple times
  if (!predictorInstance) {
    predictorInstance = new CategoryPredictor();
  }

  if (isInitializing) return predictorInstance;
  
  // Try to load saved model
  await predictorInstance.load();

  // If not loaded or need retraining (could add version check here), do cold start
  // For now, we only train if we couldn't load a model
  // In a real app, we would check if we have enough new data to re-train
  // But checking 'isTrained' property in stored model is implicit by load() success
  
  // Actually, let's always try to fetch recent data and see if we need to train
  // If we just loaded, we might be fine, but let's allow "Cold Start" if missing
  /* 
     NOTE: In this implementation, we try to load. If it fails (no model in IndexedDB),
     we fetch data and train.
   */
  
  if (householdId) {
     isInitializing = true;
     try {
       // If not loaded effectively (no vocab), force train
       // Access private property hack or just try-catch prediction?
       // Let's assume prediction returns [] empty if not trained.
      //  const test = predictorInstance.predict('teste');
       
      //  if (test.length === 0) {
         console.log('⚠️ ML Model not found or empty. Starting training...');
         const { data: transactions } = await supabase
            .from('transactions')
            .select('description, category_id')
            .eq('household_id', householdId)
            .not('category_id', 'is', null)
            .order('transaction_date', { ascending: false })
            .limit(500); // Learn from last 500 transactions

         if (transactions && transactions.length > 10) {
            const trainingData: TrainingData[] = transactions
                .filter(t => t.description && t.category_id)
                .map(t => ({
                    description: t.description!,
                    categoryId: t.category_id!
                }));
            
            await predictorInstance.initialize(trainingData);
            await predictorInstance.save();
            console.log('✅ ML Model trained and saved.');
         }
      //  }
     } catch (err) {
        console.error('Failed to initialize ML model', err);
     } finally {
        isInitializing = false;
     }
  }

  return predictorInstance;
}
