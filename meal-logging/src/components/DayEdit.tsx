"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { SearchableSelect } from "@/components/SearchableSelect";
import { formatDisplayDate } from "@/lib/dates";
import { mealSlotsFor } from "@/lib/types";

export function DayEdit({
  memberId,
  date,
}: {
  memberId: string;
  date: string;
}) {
  const router = useRouter();
  const {
    ready,
    data,
    getMember,
    getDayLog,
    saveDayLog,
    addFoodItem,
  } = useAppData();

  const member = getMember(memberId);
  const existing = getDayLog(memberId, date);

  const slots = useMemo(
    () => (member ? mealSlotsFor(member) : []),
    [member],
  );

  const [meals, setMeals] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [applyTo, setApplyTo] = useState<string[]>([]);

  useEffect(() => {
    if (!ready || hydrated) return;
    setMeals(existing?.meals ? { ...existing.meals } : {});
    setHydrated(true);
  }, [ready, existing, hydrated]);

  const others = data.members.filter((m) => m.id !== memberId);

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

  function setMeal(slot: string, value: string) {
    setMeals((prev) => ({ ...prev, [slot]: value }));
  }

  function toggleApply(id: string) {
    setApplyTo((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link href={`/members/${memberId}`} className="back-link">
          ← {member.name}
        </Link>
        <h1 className="app-title">{formatDisplayDate(date)}</h1>
      </header>

      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          const payload: Record<string, string> = {};
          for (const slot of slots) {
            payload[slot] = (meals[slot] ?? "").trim();
          }
          saveDayLog(memberId, date, payload, applyTo);
          router.push(`/members/${memberId}`);
        }}
      >
        {slots.map((slot) => (
          <SearchableSelect
            key={slot}
            label={slot}
            value={meals[slot] ?? ""}
            options={data.foodItems}
            onChange={(v) => setMeal(slot, v)}
            onAddOption={addFoodItem}
          />
        ))}

        {others.length > 0 && (
          <fieldset className="apply-fieldset">
            <legend className="field-label">Also apply to</legend>
            <ul className="apply-list">
              {others.map((m) => (
                <li key={m.id}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={applyTo.includes(m.id)}
                      onChange={() => toggleApply(m.id)}
                    />
                    {m.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <div className="button-row">
          <button type="submit" className="primary-button">
            Save
          </button>
          <Link href={`/members/${memberId}`} className="secondary-button">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
