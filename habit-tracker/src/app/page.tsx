"use client";

import { useEffect, useMemo, useState } from "react";

type Habit = {
  id: string;
  name: string;
  description?: string;
  color: string;
  goalPerWeek: number;
  createdAt: string;
  completedDates: string[];
};

type HabitFormState = {
  name: string;
  description: string;
  goalPerWeek: number;
  color: string;
};

const STORAGE_KEY = "habit-tracker/v1";
const COLOR_OPTIONS = ["#6366f1", "#22d3ee", "#f97316", "#f472b6", "#22c55e", "#a855f7"];

function createDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekDates(reference: Date) {
  const start = new Date(reference);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return date;
  });
}

function calculateStreak(habit: Habit, reference: Date) {
  const dates = new Set(habit.completedDates);
  const cursor = new Date(reference);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  while (dates.has(createDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function countCompletionsInWeek(habit: Habit, weekDates: Date[]) {
  const lookup = new Set(habit.completedDates);
  return weekDates.reduce((total, date) => {
    return total + (lookup.has(createDateKey(date)) ? 1 : 0);
  }, 0);
}

function createDemoHabits(): Habit[] {
  const today = new Date();
  const week = getWeekDates(today);
  return [
    {
      id: "demo-habit-1",
      name: "Morning Stretch",
      description: "10 min flow before breakfast",
      color: COLOR_OPTIONS[0],
      goalPerWeek: 5,
      createdAt: today.toISOString(),
      completedDates: week
        .slice(0, 4)
        .map((date) => createDateKey(date)),
    },
    {
      id: "demo-habit-2",
      name: "Hydration Goal",
      description: "Drink 8 glasses of water",
      color: COLOR_OPTIONS[1],
      goalPerWeek: 7,
      createdAt: today.toISOString(),
      completedDates: week
        .slice(0, 3)
        .map((date, idx) =>
          idx % 2 === 0 ? createDateKey(date) : createDateKey(new Date(date)),
        ),
    },
    {
      id: "demo-habit-3",
      name: "Deep Work Session",
      description: "Focus for 60 uninterrupted minutes",
      color: COLOR_OPTIONS[2],
      goalPerWeek: 4,
      createdAt: today.toISOString(),
      completedDates: week
        .slice(0, 2)
        .map((date) => createDateKey(date)),
    },
  ];
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `habit-${Math.random().toString(36).slice(2, 10)}`;
}

const IconPlus = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>
);

const IconCheck = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
  </svg>
);

const IconFlame = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3c1.5 2 1 4 0 5s-1 3 1 4c2.5 1.5 4-2 3-4 3 2 4 6 2.5 8.5C17 19.5 14.5 21 12 21s-5-1.5-6.5-4.5C4 14 5 9 9 6c-.5 2 1 3 2 2s1.5-2.5 1-5Z"
    />
  </svg>
);

const IconSparkle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3.25 13.3 8.7 18.75 10 13.3 11.3 12 16.75 10.7 11.3 5.25 10 10.7 8.7 12 3.25z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.25 17.25 6.8 19.4 9 19.95 6.8 20.5 6.25 22.7 5.7 20.5 3.5 19.95 5.7 19.4 6.25 17.25z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.75 17.25 18.3 19.4 20.5 19.95 18.3 20.5 17.75 22.7 17.2 20.5 15 19.95 17.2 19.4 17.75 17.25z"
    />
  </svg>
);

function loadHabitsFromStorage() {
  if (typeof window === "undefined") {
    return createDemoHabits();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return createDemoHabits();
  }

  try {
    const parsed = JSON.parse(stored) as Habit[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fall through to demo habits
  }

  return createDemoHabits();
}

export default function Home() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => createDateKey(today), [today]);
  const [habits, setHabits] = useState<Habit[]>(() => loadHabitsFromStorage());
  const [showComposer, setShowComposer] = useState(false);
  const [formState, setFormState] = useState<HabitFormState>({
    name: "",
    description: "",
    goalPerWeek: 5,
    color: COLOR_OPTIONS[0],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const weekDates = useMemo(() => getWeekDates(today), [today]);

  const { completedToday, totalCompletionsThisWeek, longestHabitStreak } = useMemo(() => {
    const completedTodayCount = habits.filter((habit) =>
      habit.completedDates.includes(todayKey),
    ).length;

    const totalWeek = habits.reduce(
      (total, habit) => total + countCompletionsInWeek(habit, weekDates),
      0,
    );

    const streak = habits.reduce((max, habit) => {
      return Math.max(max, calculateStreak(habit, today));
    }, 0);

    return {
      completedToday: completedTodayCount,
      totalCompletionsThisWeek: totalWeek,
      longestHabitStreak: streak,
    };
  }, [habits, today, todayKey, weekDates]);

  const completionRate = useMemo(() => {
    if (!habits.length) return 0;
    const completed = habits.filter((habit) =>
      habit.completedDates.includes(todayKey),
    ).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits, todayKey]);

  const handleToggleCompletion = (habitId: string, dateKey: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const alreadyDone = habit.completedDates.includes(dateKey);
        return {
          ...habit,
          completedDates: alreadyDone
            ? habit.completedDates.filter((key) => key !== dateKey)
            : [...habit.completedDates, dateKey],
        };
      }),
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
  };

  const handleCreateHabit = () => {
    if (!formState.name.trim()) return;

    const newHabit: Habit = {
      id: createId(),
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      color: formState.color,
      goalPerWeek: formState.goalPerWeek,
      createdAt: new Date().toISOString(),
      completedDates: [],
    };

    setHabits((prev) => [newHabit, ...prev]);
    setFormState({
      name: "",
      description: "",
      goalPerWeek: 5,
      color: COLOR_OPTIONS[0],
    });
    setShowComposer(false);
  };

  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }),
    [],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-28 pt-12 sm:max-w-lg sm:px-6">
      <header className="rounded-4xl border border-white/10 bg-[rgba(15,23,42,0.72)] p-6 shadow-[0_40px_120px_-60px_rgba(99,102,241,0.8)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Today&apos;s Focus
            </p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight text-white">
              Keep the streak alive
            </h1>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(99,102,241,0.12)] text-emerald-300">
            <IconFlame className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-3xl border border-white/5 bg-[rgba(148,163,184,0.12)] px-3 py-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Complete
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{completionRate}%</p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-[rgba(148,163,184,0.12)] px-3 py-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Today
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{completedToday}</p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-[rgba(148,163,184,0.12)] px-3 py-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Streak
            </p>
            <p className="mt-2 flex items-center gap-1 text-2xl font-semibold text-white">
              {longestHabitStreak}
              <IconSparkle className="h-4 w-4 text-indigo-300/80" />
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-200/60">
              This Week
            </p>
            <h2 className="text-xl font-semibold text-white">
              {totalCompletionsThisWeek} check-ins
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <IconPlus className="h-5 w-5" />
            New Habit
          </button>
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-white/5 bg-[rgba(15,23,42,0.72)] p-4 text-[var(--color-text-muted)] shadow-[0_30px_80px_-60px_rgba(14,165,233,0.7)]">
          {weekDates.map((date) => {
            const key = createDateKey(date);
            const isToday = key === todayKey;
            return (
              <div key={key} className="flex flex-col items-center gap-1 text-xs">
                <span className="font-medium uppercase">{weekdayFormatter.format(date).slice(0, 2)}</span>
                <span
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full border border-white/10",
                    isToday ? "bg-white text-slate-900 font-semibold" : "bg-white/5 text-white/80",
                  ].join(" ")}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        {habits.length === 0 && (
          <div className="rounded-4xl border border-dashed border-white/20 bg-[rgba(15,23,42,0.5)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            Tap the plus button to set your first habit and start building momentum.
          </div>
        )}

        {habits.map((habit) => {
          const completionsThisWeek = countCompletionsInWeek(habit, weekDates);
          const progressFraction =
            habit.goalPerWeek === 0
              ? 0
              : Math.min(1, completionsThisWeek / habit.goalPerWeek);
          const progressDegrees = Math.round(progressFraction * 360);
          const completedTodayForHabit = habit.completedDates.includes(todayKey);
          const streak = calculateStreak(habit, today);

          return (
            <article
              key={habit.id}
              className="group rounded-4xl border border-white/5 bg-[rgba(15,23,42,0.78)] p-5 shadow-[0_25px_80px_-60px_rgba(99,102,241,0.7)] transition hover:border-white/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Goal {habit.goalPerWeek}/week
                  </p>
                  <h3 className="truncate text-lg font-semibold text-white">
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
                      {habit.description}
                    </p>
                  )}
                </div>
                <div
                  className="relative h-16 w-16 shrink-0 rounded-full p-[2px]"
                  style={{
                    background: `conic-gradient(${habit.color} ${progressDegrees}deg, rgba(100,116,139,0.15) ${progressDegrees}deg)`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900/90 text-sm font-semibold text-white">
                    {Math.round(progressFraction * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span>{streak} day streak</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="rounded-full px-3 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white/80"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCompletion(habit.id, todayKey)}
                  className={[
                    "flex flex-1 items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition",
                    completedTodayForHabit
                      ? "bg-white text-slate-900"
                      : "bg-white/8 text-white hover:bg-white/15",
                  ].join(" ")}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20">
                    {completedTodayForHabit && (
                      <IconCheck className="h-3.5 w-3.5 text-slate-900" />
                    )}
                  </span>
                  {completedTodayForHabit ? "Completed" : "Mark today"}
                </button>

                <div className="flex gap-1.5 rounded-3xl bg-white/5 p-1.5">
                  {weekDates.map((date) => {
                    const key = createDateKey(date);
                    const checked = habit.completedDates.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`Toggle ${habit.name} on ${date.toDateString()}`}
                        onClick={() => handleToggleCompletion(habit.id, key)}
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-medium transition",
                          checked
                            ? "bg-white text-slate-900"
                            : "bg-white/5 text-white/70 hover:bg-white/15",
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <button
        type="button"
        onClick={() => setShowComposer(true)}
        className="fixed bottom-10 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_20px_45px_-20px_rgba(236,72,153,0.8)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 sm:right-10"
      >
        <IconPlus className="h-7 w-7" />
      </button>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-8">
          <div className="w-full max-w-lg rounded-4xl border border-white/10 bg-[var(--color-surface-strong)] p-6 pb-7 shadow-[0_40px_120px_-60px_rgba(99,102,241,0.8)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  New Habit
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Design your ritual</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="rounded-full px-3 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Habit name
                </span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Evening reading"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Why it matters
                </span>
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="How will this habit improve your day?"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
              </label>

              <div className="space-y-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Weekly target: <strong className="text-white">{formState.goalPerWeek}</strong> times
                </span>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={formState.goalPerWeek}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      goalPerWeek: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-indigo-400"
                />
                <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                  <span>1x</span>
                  <span>4x</span>
                  <span>7x</span>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Accent color
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          color,
                        }))
                      }
                      className={[
                        "flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition",
                        formState.color === color
                          ? "border-white scale-105"
                          : "border-transparent opacity-70 hover:opacity-100",
                      ].join(" ")}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color} accent`}
                    >
                      {formState.color === color && <IconCheck className="h-5 w-5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateHabit}
              className="mt-6 w-full rounded-3xl bg-white py-3 text-base font-semibold text-slate-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!formState.name.trim()}
            >
              Add Habit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
