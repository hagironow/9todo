'use client';

import { useRef } from 'react';
import type { CompositionEvent, KeyboardEvent } from 'react';
import { applyShiftEnter } from '@/lib/checklist';

/**
 * textarea에서 Shift+Enter로 체크박스 줄을 만든다.
 *
 * 한글 조합 중 Shift+Enter는 조합이 끝난 뒤(compositionend)에 처리한다.
 * macOS 한글 IME는 Enter 하나에 keydown을 두 번 보내므로 두 번째는 무시한다.
 *
 * onKeyDown은 Shift+Enter를 처리했으면 true를 돌려준다 — 호출부의 Enter 처리를 건너뛰게.
 */
export function useChecklistShiftEnter(setValue: (value: string) => void) {
  const pendingRef = useRef(false);
  const lastAtRef = useRef(0);

  const apply = (el: HTMLTextAreaElement) => {
    lastAtRef.current = Date.now();
    const next = applyShiftEnter(el.value, el.selectionStart, el.selectionEnd);
    setValue(next.value);
    // 제어 컴포넌트라 리렌더 후 커서·높이를 맞춘다
    requestAnimationFrame(() => {
      el.setSelectionRange(next.caret, next.caret);
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (e.key !== 'Enter' || !e.shiftKey) return false;
    e.preventDefault();
    if (e.nativeEvent.isComposing) {
      pendingRef.current = true;
      return true;
    }
    if (Date.now() - lastAtRef.current < 120) return true;
    apply(e.currentTarget);
    return true;
  };

  const onCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    apply(e.currentTarget);
  };

  return { onKeyDown, onCompositionEnd };
}
