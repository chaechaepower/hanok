import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import Toast, { type ToastData } from './Toast';

// ═══════════════════════════════════════
// Context 타입 — showToast 함수만 외부에 노출
// ═══════════════════════════════════════
interface ToastContextValue {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ═══════════════════════════════════════
// useToast 훅
// — 컴포넌트 어디서든 showToast()를 호출할 수 있게 해주는 커스텀 훅
// — ToastProvider 바깥에서 호출하면 에러 발생
// ═══════════════════════════════════════
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ═══════════════════════════════════════
// ToastProvider
// — 앱 최상단(main.tsx)에서 감싸서 사용
// — 토스트 목록 상태 관리 + 화면 우상단에 렌더링
// ═══════════════════════════════════════
export default function ToastProvider({ children }: { children: ReactNode }) {
  // 현재 화면에 표시 중인 토스트 목록
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // 토스트 추가 — 고유 id를 생성해서 목록에 push
  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  // 토스트 제거 — 애니메이션 종료 후 Toast 컴포넌트가 호출
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* 토스트 컨테이너 — 화면 우상단 고정, 여러 개가 위→아래로 쌓임 */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast {...toast} onClose={removeToast} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
