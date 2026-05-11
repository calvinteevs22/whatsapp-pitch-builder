import { useState, useEffect, useRef } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms using an ease-out curve.
 * Returns the current animated value as an integer.
 */
export function useCountUp(target: number | undefined, duration = 1200): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | undefined>(undefined);
  const prevTarget = useRef<number>(0);

  useEffect(() => {
    if (target === undefined || target === 0) {
      setValue(0);
      return;
    }

    // If target hasn't changed, don't re-animate
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const startValue = 0;
    startRef.current = undefined as number | undefined;

    const animate = (timestamp: number) => {
      if (startRef.current === undefined) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: decelerating towards end
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
