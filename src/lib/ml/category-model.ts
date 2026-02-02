

import * as tf from '@tensorflow/tfjs';

export interface TrainingData {
  description: string;
  categoryId: string;
}

export interface Prediction {
  categoryId: string;
  confidence: number;
}

export class CategoryPredictor {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private categories: string[] = [];
  private isTrained = false;

  constructor() {}

  async initialize(data: TrainingData[]) {
    if (data.length === 0) return;

    // 1. Build Vocabulary and Categories
    this.buildVocabulary(data);
    this.categories = [...new Set(data.map(d => d.categoryId))];

    // 2. Create Model
    this.model = this.createModel();

    // 3. Train
    await this.train(data);
    this.isTrained = true;
  }

  private buildVocabulary(data: TrainingData[]) {
    const wordCounts = new Map<string, number>();
    
    data.forEach(d => {
      const tokens = this.tokenize(d.description);
      tokens.forEach(token => {
        wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
      });
    });

    // Keep top 500 words
    const sortedWords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 500)
      .map(([word]) => word);

    sortedWords.forEach((word, index) => {
      this.vocabulary.set(word, index); // index + 1 if we wanted 0 padding, but dense input is fine
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .split(/\s+/)
      .filter(w => w.length > 2 && !/^\d+$/.test(w)); // Remove short words and pure numbers
  }

  private textToVector(text: string): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    const tokens = this.tokenize(text);
    
    tokens.forEach(token => {
      const index = this.vocabulary.get(token);
      if (index !== undefined) {
        vector[index] = 1;
      }
    });

    return vector;
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Simple Feed Forward Network
    model.add(tf.layers.dense({
      inputShape: [this.vocabulary.size],
      units: 32,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));

    model.add(tf.layers.dense({
      units: this.categories.length,
      activation: 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async train(data: TrainingData[]) {
    if (!this.model) return;

    // Prepare inputs
    const xs = tf.tensor2d(data.map(d => this.textToVector(d.description)));
    
    // Prepare outputs (One-hot encoding)
    const ys = tf.tensor2d(data.map(d => {
      const vector = new Array(this.categories.length).fill(0);
      const catIndex = this.categories.indexOf(d.categoryId);
      if (catIndex !== -1) vector[catIndex] = 1;
      return vector;
    }));

    await this.model.fit(xs, ys, {
      epochs: 30,
      batchSize: 16,
      shuffle: true,
      // verbose: 0
    });

    xs.dispose();
    ys.dispose();
  }

  predict(description: string): Prediction[] {
    if (!this.model || !this.isTrained) return [];

    const inputVector = this.textToVector(description);
    // If input vector is all zeros (no known words), return empty
    if (inputVector.every(v => v === 0)) return [];

    const input = tf.tensor2d([inputVector]);
    const output = this.model.predict(input) as tf.Tensor;
    const values = output.dataSync();

    input.dispose();
    output.dispose();

    const predictions: Prediction[] = Array.from(values)
      .map((confidence, index) => ({
        categoryId: this.categories[index],
        confidence: Number(confidence) // Ensure number
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return predictions;
  }

  async learnFromCorrection(description: string, categoryId: string) {
    if (!this.model) return;
    
    // Ensure category exists
    if (!this.categories.includes(categoryId)) {
        this.categories.push(categoryId);
        // Note: Changing categories usually invalidates the output layer size.
        // For a simple local model, we might need to re-create/re-compile or just ignore new categories for now.
        // Re-creating the model on the fly is expensive. 
        // Strategy: Only learn for existing known categories for now, or re-initialize.
        // For MVP, let's ignore if category is completely new to the model structure, 
        // OR we can rely on a large pre-defined list of categories.
        // Given the constraints, let's just log a warning if it's a new category and return.
        console.warn('New category encountered. Model needs full retraining to include it.', categoryId);
        return;
    }

    const vector = this.textToVector(description);
    const xs = tf.tensor2d([vector]);
    
    const outputVector = new Array(this.categories.length).fill(0);
    const catIndex = this.categories.indexOf(categoryId);
    outputVector[catIndex] = 1;
    const ys = tf.tensor2d([outputVector]);

    await this.model.fit(xs, ys, {
        epochs: 1, // Quick update
        verbose: 0
    });

    xs.dispose();
    ys.dispose();

    await this.save();
  }

  async save() {
    if (this.model) {
      await this.model.save('indexeddb://category-predictor-model');
      
      // Also save metadata
      const metadata = {
        vocabulary: Array.from(this.vocabulary.entries()),
        categories: this.categories
      };
      localStorage.setItem('category-predictor-metadata', JSON.stringify(metadata));
    }
  }

  async load() {
    try {
      this.model = await tf.loadLayersModel('indexeddb://category-predictor-model');
      
      const metadataStr = localStorage.getItem('category-predictor-metadata');
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        this.vocabulary = new Map(metadata.vocabulary);
        this.categories = metadata.categories;
        this.isTrained = true;
        
        // Recompile is needed after load
        this.model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
      }
    } catch (e) {
      console.warn('No saved model found', e);
    }
  }
}
