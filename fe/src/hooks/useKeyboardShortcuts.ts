import { useEffect, useEffectEvent, useState } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export function useKeyboardShortcuts(onKeyAction: KeyHandler) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => new Set());
  const handleKeyAction = useEffectEvent(onKeyAction);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
        return;
      }

      setActiveKeys((prev) => {
        if (prev.has(event.key)) return prev;
        return new Set(prev).add(event.key);
      });

      handleKeyAction(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setActiveKeys((prev) => {
        if (!prev.has(event.key)) return prev;
        const next = new Set(prev);
        next.delete(event.key);
        return next;
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return activeKeys;
}
