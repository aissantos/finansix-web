import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomNumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  onConfirm?: () => void;
  maxValue?: number;
  currency?: string;
}

const keys = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  ',', '0', 'del'
];

export function CustomNumericKeypad({
  value,
  onChange,
  onConfirm,
  maxValue = 999999.99,
  currency = 'BRL',
}: CustomNumericKeypadProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Initialize display with current value
    if (value > 0) {
      const formatted = (value / 100).toFixed(2).replace('.', ',');
      setDisplayValue(formatted);
    } else {
      setDisplayValue('0,00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyPress = (key: string) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    let newDisplay = displayValue;

    if (key === 'del') {
      // Remove last character
      newDisplay = newDisplay.slice(0, -1) || '0,00';
    } else if (key === ',') {
      // Decimal separator - already handled in input
      return;
    } else {
      // Number key
      // Remove leading zeros and format as currency
      const cleanValue = newDisplay.replace(/[^\d]/g, '');
      const newValue = cleanValue + key;
      
      // Convert to number to check max value
      const numValue = parseInt(newValue) / 100;
      
      if (numValue > maxValue) {
        // Exceeded max value - do nothing (with visual feedback)
        return;
      }

      // Format as currency
      const cents = parseInt(newValue);
      const reais = (cents / 100).toFixed(2).replace('.', ',');
      newDisplay = reais;
    }

    setDisplayValue(newDisplay);
    
    // Convert to cents and update parent
    const numValue = parseFloat(newDisplay.replace(',', '.'));
    onChange(Math.round(numValue * 100) / 100);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
      }
      onConfirm();
    }
  };

  return (
    <div className="w-full">
      {/* Display */}
      <div className="mb-6 text-center">
        <motion.div
          key={displayValue}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="text-5xl font-black text-slate-900 dark:text-white tabular-nums"
        >
          {currency === 'BRL' && 'R$ '}
          {displayValue}
        </motion.div>
        <p className="text-xs text-slate-500 mt-2">
          Toque nos números para digitar o valor
        </p>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {keys.map((key) => {
          const isDelete = key === 'del';
          const isDecimal = key === ',';
          
          return (
            <motion.button
              key={key}
              onClick={() => handleKeyPress(key)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'h-16 rounded-2xl font-bold text-xl',
                'transition-all duration-150',
                'active:shadow-inner',
                isDelete
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 col-span-1'
                  : isDecimal
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  : 'glass-button text-slate-900 dark:text-white shadow-md hover:shadow-lg'
              )}
            >
              {isDelete ? (
                <Delete className="h-6 w-6 mx-auto" />
              ) : (
                key
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm Button */}
      {onConfirm && (
        <motion.button
          onClick={handleConfirm}
          whileTap={{ scale: 0.98 }}
          className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          disabled={value === 0}
        >
          <Check className="h-5 w-5" />
          Confirmar Valor
        </motion.button>
      )}

      {/* Quick Amount Shortcuts */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[10, 20, 50, 100].map((amount) => (
          <motion.button
            key={amount}
            onClick={() => {
              // Add to current value instead of replacing
              const currentValue = parseFloat(displayValue.replace(',', '.'));
              const newValue = currentValue + amount;
              
              // Check max value
              if (newValue > maxValue) {
                return;
              }
              
              const formatted = newValue.toFixed(2).replace('.', ',');
              setDisplayValue(formatted);
              onChange(newValue);
            }}
            whileTap={{ scale: 0.95 }}
            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            +{amount}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
