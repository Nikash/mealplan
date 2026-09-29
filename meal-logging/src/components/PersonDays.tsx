"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { MemberIcon } from "@/components/MemberIcon";
import {
  dateRangeNewestFirst,
  formatDisplayDate,
  todayString,
} from "@/lib/dates";
import { mealSlotsFor, type MealItem } from "@/lib/types";

function MealSlotValue({ items }: { items: MealItem[] | undefined }) {
  const filled = (items ?? []).filter((item) => item.name.trim());
  if (filled.length === 0) {
    return <span className="meal-value">—</span>;
  }
  return (
    <span className="meal-value">
      {filled.map((item, index) => (
        <span
          key={`${item.role}-${item.name}-${index}`}
          className="meal-value-item"
        >
          <span className="meal-value-name">{item.name}</span>
          <span className={`meal-role-badge meal-role-${item.role}`}>
            {item.role === "side" ? "Side" : "Main"}
          </span>
        </span>
      ))}
    </span>
  );
}

export function PersonDays({ memberId }: { memberId: string }) {
  const router = useRouter();
  const { ready, getMember, getDayLog, data } = useAppData();
  const [jumpDate, setJumpDate] = useState("");

  const member = getMember(memberId);

  const dates = useMemo(() => {
    if (!member) return [];
    const today = todayString();
    const loggedDates = data.dayLogs
      .filter((l) => l.memberId === memberId)
      .map((l) => l.date);
    const earliestLogged =
      loggedDates.length > 0
        ? loggedDates.reduce((a, b) => (a < b ? a : b))
        : member.createdAt;
    const latestLogged =
      loggedDates.length > 0
        ? loggedDates.reduce((a, b) => (a > b ? a : b))
        : today;
    const start =
      earliestLogged < member.createdAt ? earliestLogged : member.createdAt;
    const endCandidate = latestLogged > today ? latestLogged : today;
    const end = endCandidate >= start ? endCandidate : start;
    return dateRangeNewestFirst(start, end);
  }, [member, data.dayLogs, memberId]);

  if (!ready) {
    return <p className="muted">Loading…</p>;
  }

  if (!member) {
    return (
      <div className="page">
        <p>Member not found.</p>
        <Link href="/" className="link-button">
          Back home
        </Link>
      </div>
    );
  }

  const slots = mealSlotsFor(member);

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link href="/" className="back-link">
          ← Family
        </Link>
        <div className="person-heading">
          <MemberIcon icon={member.icon} size={40} />
          <h1 className="app-title">{member.name}</h1>
          <Link href={`/members/${memberId}/edit`} className="link-button">
            Edit
          </Link>
        </div>
      </header>

      <form
        className="jump-date"
        onSubmit={(e) => {
          e.preventDefault();
          if (!jumpDate) return;
          router.push(`/members/${memberId}/days/${jumpDate}`);
        }}
      >
        <label className="field-label" htmlFor="jump-date">
          Open a day
        </label>
        <div className="inline-row">
          <input
            id="jump-date"
            type="date"
            className="text-input"
            value={jumpDate}
            onChange={(e) => setJumpDate(e.target.value)}
          />
          <button type="submit" className="secondary-button" disabled={!jumpDate}>
            Open
          </button>
        </div>
      </form>

      <div className="day-card-list">
        {dates.map((date) => {
          const log = getDayLog(memberId, date);
          return (
            <Link
              key={date}
              href={`/members/${memberId}/days/${date}`}
              className="day-card"
            >
              <h2 className="day-card-date">{formatDisplayDate(date)}</h2>
              <ul className="meal-rows">
                {slots.map((slot) => (
                  <li key={slot} className="meal-row">
                    <span className="meal-slot">{slot}</span>
                    <MealSlotValue items={log?.meals[slot]} />
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
