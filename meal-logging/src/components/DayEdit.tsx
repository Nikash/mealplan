"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { SearchableSelect } from "@/components/SearchableSelect";
import { formatDisplayDate } from "@/lib/dates";
import { mealSlotsFor, type FamilyMember } from "@/lib/types";

export function DayEdit({
  memberId,
  date,
}: {
  memberId: string;
  date: string;
}) {
  const { ready, getMember, getDayLog } = useAppData();
  const member = getMember(memberId);
  const existing = getDayLog(memberId, date);

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

  return (
    <DayEditForm
      key={`${memberId}-${date}`}
      member={member}
      date={date}
      initialMeals={existing?.meals ?? {}}
    />
  );
}

function DayEditForm({
  member,
  date,
  initialMeals,
}: {
  member: FamilyMember;
  date: string;
  initialMeals: Record<string, string>;
}) {
  const router = useRouter();
  const { data, saveDayLog, addFoodItem } = useAppData();

  const slots = useMemo(() => mealSlotsFor(member), [member]);
  const [meals, setMeals] = useState<Record<string, string>>(() => ({
    ...initialMeals,
  }));
  const [applyTo, setApplyTo] = useState<string[]>([]);

  const others = data.members.filter((m) => m.id !== member.id);

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
        <Link href={`/members/${member.id}`} className="back-link">
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
          saveDayLog(member.id, date, payload, applyTo);
          router.push(`/members/${member.id}`);
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
          <Link href={`/members/${member.id}`} className="secondary-button">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
