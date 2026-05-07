'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="text-4xl">:(</div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          문제가 발생했어요
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
          일시적인 오류일 수 있어요. 아래 버튼을 눌러 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          className="mt-2 px-5 py-2.5 rounded-[var(--radius)] bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-85 transition-opacity"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
