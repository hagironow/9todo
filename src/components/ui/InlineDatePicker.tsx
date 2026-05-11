'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatLocalDate } from '@/lib/date';

interface InlineDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  className?: string;
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function InlineDatePicker({ value, onChange, className = '' }: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = formatLocalDate(new Date());

  // value 또는 open 변경 시 뷰 동기화
  useEffect(() => {
    if (!value) return;
    const [y, m] = value.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }, [value, isOpen]);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // 캘린더 그리드
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // 이전 달 날짜 (빈칸 대신 표시)
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (day: number) => {
    onChange(toDateString(viewYear, viewMonth, day));
    setIsOpen(false);
  };

  const handleToday = () => {
    onChange(todayStr);
    setIsOpen(false);
  };

  // 표시용 포맷
  const displayText = (() => {
    if (!value) return '날짜 선택';
    const [y, m, d] = value.split('-').map(Number);
    const dayOfWeek = KO_WEEKDAYS[new Date(y, m - 1, d).getDay()];
    return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}. ${dayOfWeek}`;
  })();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="text-[12px] text-[var(--foreground)] bg-[var(--muted)] rounded-[var(--radius-sm)] px-2 py-1 border-none outline-none cursor-pointer hover:bg-[var(--muted)]/80 transition-colors"
      >
        {displayText}
      </button>

      {/* 드롭다운 캘린더 */}
      {isOpen && (
        <div
          className={[
            'absolute right-0 top-full mt-1.5 z-50',
            'w-[280px] p-3',
            'bg-[var(--card)] text-[var(--card-foreground)]',
            'rounded-[calc(var(--radius)*1.2)] shadow-xl',
            'border border-[var(--border)]',
            'animate-[status-appear_0.15s_ease_forwards]',
          ].join(' ')}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={prevMonth}
                className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <ChevronLeft size={14} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <ChevronRight size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* 요일 */}
          <div className="grid grid-cols-7 mb-0.5">
            {KO_WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={[
                  'flex items-center justify-center h-7',
                  'text-[11px] font-semibold',
                  i === 0 ? 'text-[var(--destructive)]' : i === 6 ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]',
                ].join(' ')}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {/* 이전 달 */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`p-${i}`} className="flex items-center justify-center w-[36px] h-[36px] mx-auto text-[12px] text-[var(--muted-foreground)]/40">
                {prevMonthDays - firstDay + 1 + i}
              </div>
            ))}

            {/* 이번 달 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateString(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={[
                    'flex items-center justify-center w-[36px] h-[36px] mx-auto',
                    'text-[12px] rounded-full transition-colors duration-100',
                    isSelected
                      ? 'bg-[var(--foreground)] text-[var(--background)] font-bold'
                      : isToday
                      ? 'text-[var(--accent)] font-bold hover:bg-[var(--muted)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}

            {/* 다음 달 */}
            {(() => {
              const totalCells = firstDay + daysInMonth;
              const trailing = (7 - (totalCells % 7)) % 7;
              return Array.from({ length: trailing }).map((_, i) => (
                <div key={`n-${i}`} className="flex items-center justify-center w-[36px] h-[36px] mx-auto text-[12px] text-[var(--muted-foreground)]/40">
                  {i + 1}
                </div>
              ));
            })()}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]/40">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-[11px] text-[var(--accent)] font-medium hover:opacity-80 transition-opacity"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
