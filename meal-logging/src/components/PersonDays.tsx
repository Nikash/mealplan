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
import { formatMealItems, mealSlotsFor } from "@/lib/types";

export function PersonDays({ memberId }: { memberId: string }) {
  const router = useRouter();
  const { ready, getMember, getDayLog, data } = useAppData();
  const [jumpDate, setJumpDate] = useState("");

  const member = getMember(memberId);

  const dates = useMemo(() => {
    if (!member) return [];
    const today = todayString();
    const loggedBefore = data.dayLogs
      .filter((l) => l.memberId === memberId)
      .map((l) => l.date);
    const earliestLogged =
      loggedBefore.length > 0
        ? loggedBefore.reduce((a, b) => (a < b ? a : b))
        : member.createdAt;
    const start =
      earliestLogged < member.createdAt ? earliestLogged : member.createdAt;
    const end = today >= start ? today : start;
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
          Open a past day
        </label>
        <div className="inline-row">
          <input
            id="jump-date"
            type="date"
            className="text-input"
            value={jumpDate}
            max={todayString()}
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
                    <span className="meal-value">
                      {formatMealItems(log?.meals[slot])}
                    </span>
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
