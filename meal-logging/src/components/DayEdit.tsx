"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { SearchableSelect } from "@/components/SearchableSelect";
import { formatDisplayDate } from "@/lib/dates";
import {
  mealSlotsFor,
  normalizeMealItems,
  type FamilyMember,
} from "@/lib/types";

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

function rowsForSlot(items: string[] | undefined): string[] {
  return items && items.length > 0 ? items : [""];
}

function DayEditForm({
  member,
  date,
  initialMeals,
}: {
  member: FamilyMember;
  date: string;
  initialMeals: Record<string, string[]>;
}) {
  const router = useRouter();
  const { data, saveDayLog, addFoodItem } = useAppData();

  const slots = useMemo(() => mealSlotsFor(member), [member]);
  const [meals, setMeals] = useState<Record<string, string[]>>(() => {
    const next: Record<string, string[]> = {};
    for (const slot of slots) {
      next[slot] = rowsForSlot(initialMeals[slot]);
    }
    return next;
  });
  const [applyTo, setApplyTo] = useState<string[]>([]);

  const others = data.members.filter((m) => m.id !== member.id);

  function setItem(slot: string, index: number, value: string) {
    setMeals((prev) => {
      const items = [...rowsForSlot(prev[slot])];
      items[index] = value;
      return { ...prev, [slot]: items };
    });
  }

  function addItem(slot: string) {
    setMeals((prev) => ({
      ...prev,
      [slot]: [...rowsForSlot(prev[slot]), ""],
    }));
  }

  function removeItem(slot: string, index: number) {
    setMeals((prev) => {
      const items = rowsForSlot(prev[slot]).filter((_, i) => i !== index);
      return { ...prev, [slot]: items.length > 0 ? items : [""] };
    });
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
          const payload: Record<string, string[]> = {};
          for (const slot of slots) {
            payload[slot] = normalizeMealItems(meals[slot] ?? []);
          }
          saveDayLog(member.id, date, payload, applyTo);
          router.push(`/members/${member.id}`);
        }}
      >
        {slots.map((slot) => {
          const items = rowsForSlot(meals[slot]);
          return (
            <fieldset key={slot} className="meal-slot-fieldset">
              <legend className="field-label">{slot}</legend>
              <ul className="meal-item-list">
                {items.map((item, index) => (
                  <li key={`${slot}-${index}`} className="meal-item-row">
                    <SearchableSelect
                      ariaLabel={`${slot} item ${index + 1}`}
                      value={item}
                      options={data.foodItems}
                      onChange={(v) => setItem(slot, index, v)}
                      onAddOption={addFoodItem}
                    />
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => removeItem(slot, index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="link-button add-item-button"
                onClick={() => addItem(slot)}
              >
                Add item
              </button>
            </fieldset>
          );
        })}

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

        <div className="button-row-split">
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
