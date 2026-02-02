import { describe, it, expect } from 'vitest';
import { findDuplicates, levenshteinDistance, similarity } from './deduplication';
import type { ParsedTransaction } from './index';
import type { ExistingTransaction } from './deduplication';

describe('Deduplication Logic', () => {
  
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('test', 'test')).toBe(0);
    });

    it('should calculate correct distance', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('Saturday', 'Sunday')).toBe(3);
    });
  });

  describe('similarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(similarity('Uber Trip', 'Uber Trip')).toBe(1.0);
    });

    it('should be case insensitive', () => {
      expect(similarity('Netflix', 'netflix')).toBe(1.0);
    });

    it('should return decent score for similar strings', () => {
      // "Uber Trip" vs "Uber Trip SP"
      // Distance is 3 (" SP"). Max len 12. Score 1 - 3/12 = 0.75
      const sim = similarity('Uber Trip', 'Uber Trip SP');
      expect(sim).toBeGreaterThan(0.7);
    });
  });

  describe('findDuplicates', () => {
    const imported: ParsedTransaction[] = [
      { date: '2023-10-15', description: 'Uber Trip', amount: 15.90 },
      { date: '2023-10-20', description: 'Netflix', amount: 55.90 }, // Exact
      { date: '2023-10-25', description: 'Padaria Doce', amount: 20.00 }, // No match
      { date: '2023-10-28', description: 'Amazon', amount: 100.00 }, // Amount diff
    ];

    const existing: ExistingTransaction[] = [
      { id: '1', transaction_date: '2023-10-15', description: 'Uber Trip Sao Paulo', amount: 15.90 }, // Fuzzy match
      { id: '2', transaction_date: '2023-10-20', description: 'Netflix', amount: 55.90 }, // Exact match
      { id: '3', transaction_date: '2023-10-28', description: 'Amazon', amount: 99.00 }, // Different amount
    ];

    it('should detect exact duplicates', () => {
      const results = findDuplicates(imported, existing);
      const netflix = results.find(r => r.importedIndex === 1);
      
      expect(netflix).toBeDefined();
      expect(netflix?.score).toBe(100);
      expect(netflix?.matchType).toBe('exact');
    });

    it('should detect fuzzy duplicates', () => {
      const results = findDuplicates(imported, existing);
      const uber = results.find(r => r.importedIndex === 0);
      
      expect(uber).toBeDefined();
      expect(uber?.score).toBeGreaterThan(80);
      expect(uber?.existingId).toBe('1');
    });

    it('should NOT detect matches when amount differs significantly', () => {
      const results = findDuplicates(imported, existing);
      const amazon = results.find(r => r.importedIndex === 3);
      
      expect(amazon).toBeUndefined();
    });

    it('should NOT detect matches for unique transactions', () => {
      const results = findDuplicates(imported, existing);
      const padaria = results.find(r => r.importedIndex === 2);
      
      expect(padaria).toBeUndefined();
    });
  });
});
