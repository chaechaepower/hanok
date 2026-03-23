import { useCallback, useEffect, useState } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export function useKeyboardShortcuts(onKeyAction: KeyHandler) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => new Set());

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      setActiveKeys((prev) => {
        if (prev.has(event.key)) return prev;
        return new Set(prev).add(event.key);
      });

      onKeyAction(event);
    },
    [onKeyAction],
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setActiveKeys((prev) => {
      if (!prev.has(event.key)) return prev;
      const next = new Set(prev);
      next.delete(event.key);
      return next;
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return activeKeys;
}
