'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
  currentDate: string; // "YYYY-MM-DD" - 현재 보고 있는 날짜
  todayDate: string;   // "YYYY-MM-DD" - 실제 오늘
  datesWithData: Set<string>; // 데이터가 있는 날짜들
  onSelectDate: (date: string) => void;
  onGoToday: () => void;
}

const KO_WEEKDAYS_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarModal({
  open,
  onClose,
  currentDate,
  todayDate,
  datesWithData,
  onSelectDate,
  onGoToday,
}: CalendarModalProps) {
  const [year, month] = currentDate.split('-').map(Number);
  // month is 1-based from currentDate, convert to 0-based for state
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month - 1); // 0-based

  // currentDate가 바뀌면 뷰도 동기화
  useEffect(() => {
    const [y, m] = currentDate.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }, [currentDate, open]);

  // ESC 키 닫기 + 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // 캘린더 그리드 계산
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=일
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const trailingBlanks = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = toDateString(viewYear, viewMonth, day);
    onSelectDate(dateStr);
    onClose();
  };

  const handleGoToday = () => {
    onGoToday();
    onClose();
  };

  const isCurrentDate = (day: number) =>
    toDateString(viewYear, viewMonth, day) === currentDate;

  const isToday = (day: number) =>
    toDateString(viewYear, viewMonth, day) === todayDate;

  const hasData = (day: number) =>
    datesWithData.has(toDateString(viewYear, viewMonth, day));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="날짜 선택"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className={[
          'relative z-10 w-80',
          'bg-[var(--card)] text-[var(--card-foreground)]',
          'rounded-[calc(var(--radius)*1.4)] shadow-xl',
          'p-4 flex flex-col gap-3',
          'animate-[status-appear_0.2s_ease_forwards]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더: 월 이동 + 닫기 */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            aria-label="이전 달"
            className={[
              'flex items-center justify-center w-7 h-7',
              'rounded-[var(--radius-sm)]',
              'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              'hover:bg-[var(--muted)] transition-colors duration-150',
            ].join(' ')}
          >
            <ChevronLeft size={14} strokeWidth={1.8} />
          </button>

          <span className="text-sm font-semibold text-[var(--foreground)]">
            {viewYear}년 {viewMonth + 1}월
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={nextMonth}
              aria-label="다음 달"
              className={[
                'flex items-center justify-center w-7 h-7',
                'rounded-[var(--radius-sm)]',
                'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                'hover:bg-[var(--muted)] transition-colors duration-150',
              ].join(' ')}
            >
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>

            <button
              onClick={onClose}
              aria-label="닫기"
              className={[
                'flex items-center justify-center w-7 h-7',
                'rounded-[var(--radius-sm)]',
                'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                'hover:bg-[var(--muted)] transition-colors duration-150',
              ].join(' ')}
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0.5">
          {KO_WEEKDAYS_SHORT.map((day, i) => (
            <div
              key={day}
              className={[
                'flex items-center justify-center h-8',
                'text-[11px] font-semibold',
                i === 0
                  ? 'text-[var(--destructive)]'
                  : i === 6
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* 이전 달 빈 칸 */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`prev-${i}`} className="w-9 h-9" />
          ))}

          {/* 이번 달 날짜 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const today = isToday(day);
            const selected = isCurrentDate(day);
            const dotVisible = hasData(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={[
                  'relative flex flex-col items-center justify-center w-9 h-9',
                  'text-sm rounded-full transition-colors duration-150',
                  today
                    ? 'bg-[var(--accent)] text-white font-bold'
                    : selected
                    ? 'text-[var(--foreground)] font-semibold'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                  selected && !today
                    ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--card)]'
                    : '',
                ].join(' ')}
                aria-label={`${viewYear}년 ${viewMonth + 1}월 ${day}일${today ? ' (오늘)' : ''}${selected ? ' (선택됨)' : ''}`}
              >
                <span className="leading-none">{day}</span>
                {dotVisible && (
                  <span
                    className={[
                      'absolute bottom-1 left-1/2 -translate-x-1/2',
                      'w-1 h-1 rounded-full',
                      today ? 'bg-white/70' : 'bg-[var(--accent)]',
                    ].join(' ')}
                  />
                )}
              </button>
            );
          })}

          {/* 다음 달 빈 칸 */}
          {Array.from({ length: trailingBlanks }).map((_, i) => (
            <div key={`next-${i}`} className="w-9 h-9" />
          ))}
        </div>

        {/* 푸터: 오늘로 돌아가기 (currentDate !== todayDate일 때만) */}
        {currentDate !== todayDate && (
          <div className="pt-1 border-t border-[var(--border)]">
            <button
              onClick={handleGoToday}
              className={[
                'w-full py-2 rounded-[var(--radius-sm)]',
                'text-[12px] font-semibold',
                'text-[var(--accent)] hover:bg-[var(--accent)]/10',
                'transition-colors duration-150',
              ].join(' ')}
            >
              오늘로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
