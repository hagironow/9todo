import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="text-6xl font-bold text-[var(--muted-foreground)]">404</div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          주소가 올바른지 확인해 주세요.
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 rounded-[var(--radius)] bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-85 transition-opacity"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
