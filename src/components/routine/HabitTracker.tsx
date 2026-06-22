'use client';

import { useState, useMemo } from 'react';
import { Habit } from '@/lib/types';
import { useLocale } from '@/i18n/context';
import { getToday } from '@/lib/date';
import { Check, Flame, Plus, Trash2 } from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateHabitTitle: (id: string, title: string) => void;
  onToggleHabitDate: (id: string, date: string) => void;
  weekStartDay?: 0 | 1;
}

export default function HabitTracker({
  habits,
  onAddHabit,
  onRemoveHabit,
  onUpdateHabitTitle,
  onToggleHabitDate,
  weekStartDay = 1,
}: HabitTrackerProps) {
  const { t } = useLocale();
  const [newTitle, setNewTitle] = useState('');
  const todayStr = getToday();

  // Get current week's dates
  const weekDates = useMemo(() => {
    const d = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const diff = (dayOfWeek - weekStartDay + 7) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - diff);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const date = String(cur.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${date}`);
    }
    return dates;
  }, [todayStr, weekStartDay]);

  const weekdaysStr = weekStartDay === 1 ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getStreak = (completedDates: string[]) => {
    let count = 0;
    const dateSet = new Set(completedDates);
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() - 1); // check from yesterday
    for (let i = 0; i < 365; i++) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dd}`;
      if (dateSet.has(dateStr)) count++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    if (dateSet.has(todayStr)) count++;
    return count;
  };

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      onAddHabit(trimmed);
      setNewTitle('');
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--foreground)]">{t.routine || 'Habits'}</span>
        <Flame size={14} className="text-[var(--accent)]" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex flex-col gap-4">
        {/* Header Row for Weekdays */}
        {habits.length > 0 && (
          <div className="flex items-center group h-6">
            <div className="w-[180px] sm:w-[240px] shrink-0 border-r border-transparent pr-3" />
            <div className="flex-1 grid grid-cols-7 gap-1 pl-3">
              {weekDates.map((date, i) => (
                <div key={date} className="text-center text-[10px] font-semibold text-[var(--muted-foreground)]">
                  {weekdaysStr[i]}
                </div>
              ))}
            </div>
            <div className="w-8 shrink-0" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {habits.map((habit) => {
            const streak = getStreak(habit.completedDates);
            return (
              <div key={habit.id} className="flex items-center group h-8">
                {/* Habit Title */}
                <div className="w-[180px] sm:w-[240px] shrink-0 flex items-center justify-between pr-3 border-r border-[var(--border)]">
                  <input
                    value={habit.title}
                    onChange={(e) => onUpdateHabitTitle(habit.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    className="flex-1 bg-transparent text-[13px] font-medium text-[var(--foreground)] outline-none truncate placeholder:text-[var(--muted-foreground)] min-w-0 pr-2"
                    placeholder="Habit title"
                  />
                  {streak > 0 && (
                    <div className="flex items-center gap-0.5 text-[11px] text-[var(--accent)] font-bold ml-1" title={`${streak} days streak`}>
                      <Flame size={12} />
                      <span>{streak}</span>
                    </div>
                  )}
                </div>

                {/* Week Circles */}
                <div className="flex-1 grid grid-cols-7 gap-1 pl-3">
                  {weekDates.map((date) => {
                    const isToday = date === todayStr;
                    const isCompleted = habit.completedDates.includes(date);
                    const isFuture = date > todayStr;
                    
                    return (
                      <button
                        key={date}
                        disabled={isFuture}
                        onClick={() => onToggleHabitDate(habit.id, date)}
                        className={[
                          'relative w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all duration-200',
                          isFuture ? 'opacity-40 cursor-not-allowed border border-dashed border-[var(--muted-foreground)]' : 'cursor-pointer hover:scale-110 active:scale-95',
                          isCompleted
                            ? 'bg-[var(--accent)] text-[var(--background)] shadow-sm'
                            : !isFuture ? 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20' : '',
                          isToday && !isCompleted ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--card)]' : ''
                        ].join(' ')}
                        title={date}
                      >
                        {isCompleted && <Check size={14} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <button
                  onClick={() => onRemoveHabit(habit.id)}
                  className="w-8 h-8 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted-foreground)] hover:text-[var(--g-error)]"
                  title="Remove Habit"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {/* Add Habit Row */}
          <div className="flex items-center gap-2 mt-1 h-8">
            <Plus size={16} className="text-[var(--muted-foreground)]" />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="Add a new habit..."
              className="flex-1 bg-transparent text-[13px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
