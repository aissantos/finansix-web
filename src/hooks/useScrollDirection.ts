import { useState, useEffect, useRef, useCallback } from 'react';

type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  /** Minimum scroll distance before triggering direction change (default: 10) */
  threshold?: number;
  /** Disable the hook (always returns 'up') */
  disabled?: boolean;
}

/**
 * Hook that detects scroll direction
 * Returns 'up' when scrolling up (show nav), 'down' when scrolling down (hide nav)
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}): ScrollDirection {
  const { threshold = 10, disabled = false } = options;
  
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY;
    const difference = scrollY - lastScrollY.current;

    // Only update direction if scrolled more than threshold
    if (Math.abs(difference) >= threshold) {
      // Determine direction
      const newDirection = difference > 0 ? 'down' : 'up';
      setScrollDirection(newDirection);
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
    }

    ticking.current = false;
  }, [threshold]);

  useEffect(() => {
    if (disabled) {
      setScrollDirection('up');
      return;
    }

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Set initial scroll position
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disabled, updateScrollDirection]);

  return scrollDirection;
}
