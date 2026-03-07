import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

type FallbackProps = {
  error?: unknown;
  resetErrorBoundary: () => void;
};

type ErrorMessage = {
  title: string;
  description: string;
};

function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

function isRetriableAxiosError(error: unknown) {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status !== 401 && status !== 403;
}

function getErrorMessage(error: unknown): ErrorMessage {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 400:
        return {
          title: "잘못된 요청",
          description: "입력한 정보가 올바른지 확인하고 다시 시도해주세요.",
        };
      case 401:
        return {
          title: "로그인 필요",
          description: "로그인 후 다시 시도해주세요.",
        };
      case 403:
        return {
          title: "접근 권한 없음",
          description: "이 페이지를 볼 수 있는 권한이 없어요.",
        };
      case 404:
        return {
          title: "페이지를 찾을 수 없음",
          description: "요청한 페이지가 존재하지 않거나 삭제되었어요.",
        };
      case 500:
        return {
          title: "서버 오류 발생",
          description:
            "현재 서버에 문제가 발생했어요.\n잠시 후 다시 시도해주세요.",
        };
      default:
        return {
          title: "오류 발생",
          description: "예기치 않은 오류가 발생했어요.\n다시 시도해주세요.",
        };
    }
  }

  if (error instanceof Error) {
    return {
      title: "데이터 로딩 실패",
      description:
        "데이터를 불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.",
    };
  }

  return {
    title: "앗, 여기는 정보가 없는 것 같아요",
    description:
      "오류가 발생했어요.\n문제를 해결하기 위해 열심히 노력중입니다!\n잠시 후 다시 시도해주세요.",
  };
}

export default function ErrorComponent({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const errorLocation = useRef(location.pathname);

  const message = useMemo(() => getErrorMessage(error), [error]);

  useEffect(() => {
    if (location.pathname !== errorLocation.current) {
      resetErrorBoundary();
      errorLocation.current = location.pathname;
    }
  }, [location.pathname, resetErrorBoundary]);

  const retriable = isRetriableAxiosError(error);

  const handleAction = () => {
    if (retriable) resetErrorBoundary();
    else navigate("/");
  };

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-10 px-5 text-center">
      <div className="flex max-w-md flex-col items-center gap-4 whitespace-pre-line">
        <h1 className="text-2xl font-bold text-zinc-900">{message.title}</h1>
        <p className="text-sm leading-6 text-zinc-500">{message.description}</p>
      </div>

      <button
        type="button"
        aria-label="에러페이지 액션"
        onClick={handleAction}
        className="w-full max-w-xs rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:scale-[0.99]"
      >
        {retriable ? "다시 시도하기" : "홈으로 가기"}
      </button>
    </div>
  );
}
