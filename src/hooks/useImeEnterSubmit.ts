'use client';

import { useRef } from 'react';
import type { CompositionEvent, KeyboardEvent } from 'react';

type El = HTMLInputElement | HTMLTextAreaElement;

/**
 * 한글 IME에서 Enter 한 번으로 제출되게 한다.
 *
 * 한글은 마지막 글자가 조합 중이라, 첫 Enter가 조합을 끝내는 데 쓰이고 삼켜진다.
 * (`isComposing`만 보고 무시하면 Enter를 두 번 쳐야 한다)
 * 조합 중 Enter가 들어오면 표시만 해두고, 조합이 끝나는 순간 대신 제출한다.
 *
 * 제출 값은 state가 아니라 DOM 값을 쓴다 — 조합이 막 끝난 시점이라 state가 아직 안 따라왔을 수 있다.
 */
export function useImeEnterSubmit<T extends El>(
  submit: (value: string) => void,
  options?: { allowShiftNewline?: boolean },
) {
  const pendingRef = useRef(false);
  const lastSubmitAtRef = useRef(0);

  const onKeyDown = (e: KeyboardEvent<T>) => {
    if (e.key !== 'Enter') return;
    if (options?.allowShiftNewline && e.shiftKey) return;
    e.preventDefault();
    if (e.nativeEvent.isComposing) {
      pendingRef.current = true;
      return;
    }
    // macOS 한글 IME는 Enter 하나에 keydown을 두 번 보낸다
    // (조합 중 1회 → compositionend → 조합이 끝난 상태로 1회 더).
    // 두 번째를 그대로 처리하면 같은 Enter로 제출이 두 번 일어난다.
    if (Date.now() - lastSubmitAtRef.current < 120) return;
    submit(e.currentTarget.value);
  };

  const onCompositionEnd = (e: CompositionEvent<T>) => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    lastSubmitAtRef.current = Date.now();
    submit(e.currentTarget.value);
  };

  return { onKeyDown, onCompositionEnd };
}
