"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { SearchableSelect } from "@/components/SearchableSelect";
import { formatDisplayDate, todayString } from "@/lib/dates";
import { rankFoodItems, suggestMealItems } from "@/lib/suggestions";
import {
  mealSlotsFor,
  normalizeMealItems,
  type FamilyMember,
  type MealItem,
  type MealRole,
} from "@/lib/types";

const MEAL_ROLES: MealRole[] = ["main", "side"];

const ROLE_HELP =
  "A main is the center of the meal, like pasta or chicken. A side is served with it, like salad or rice. Suggestions stay separate so a side is not offered as a main.";

function roleLabel(role: MealRole): string {
  return role === "side" ? "Side" : "Main";
}

function emptyRow(): MealItem {
  return { name: "", role: "main" };
}

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

function rowsForSlot(items: MealItem[] | undefined): MealItem[] {
  return items && items.length > 0 ? items : [emptyRow()];
}

function DayEditForm({
  member,
  date,
  initialMeals,
}: {
  member: FamilyMember;
  date: string;
  initialMeals: Record<string, MealItem[]>;
}) {
  const router = useRouter();
  const helpBaseId = useId();
  const { data, saveDayLog, addFoodItem } = useAppData();

  const slots = useMemo(() => mealSlotsFor(member), [member]);
  const [meals, setMeals] = useState<Record<string, MealItem[]>>(() => {
    const next: Record<string, MealItem[]> = {};
    for (const slot of slots) {
      next[slot] = rowsForSlot(initialMeals[slot]).map((item) => ({ ...item }));
    }
    return next;
  });
  const [applyTo, setApplyTo] = useState<string[]>([]);
  const [openRoleHelp, setOpenRoleHelp] = useState<string | null>(null);

  const others = data.members.filter((m) => m.id !== member.id);

  function setItem(slot: string, index: number, value: string) {
    setMeals((prev) => {
      const items = [...rowsForSlot(prev[slot])];
      const current = items[index] ?? emptyRow();
      items[index] = { ...current, name: value };
      return { ...prev, [slot]: items };
    });
  }

  function setRole(slot: string, index: number, role: MealRole) {
    setMeals((prev) => {
      const items = [...rowsForSlot(prev[slot])];
      const current = items[index] ?? emptyRow();
      items[index] = { ...current, role };
      return { ...prev, [slot]: items };
    });
  }

  const showSuggestionChips = date >= todayString();
  const suggestionsBySlot = useMemo(() => {
    const chips: Record<string, Record<MealRole, string[]>> = {};
    const options: Record<string, Record<MealRole, string[]>> = {};
    for (const slot of slots) {
      const exclude = (meals[slot] ?? []).map((item) => item.name);
      const base = {
        memberId: member.id,
        slot,
        asOfDate: date,
      };
      chips[slot] = { main: [], side: [] };
      options[slot] = { main: [], side: [] };
      for (const role of MEAL_ROLES) {
        chips[slot][role] = showSuggestionChips
          ? suggestMealItems(data.dayLogs, {
              ...base,
              role,
              exclude,
              limit: 5,
            })
          : [];
        options[slot][role] = rankFoodItems(data.foodItems, data.dayLogs, {
          ...base,
          role,
        });
      }
    }
    return { chips, options };
  }, [
    data.dayLogs,
    data.foodItems,
    date,
    meals,
    member.id,
    showSuggestionChips,
    slots,
  ]);

  function addItem(slot: string) {
    setMeals((prev) => ({
      ...prev,
      [slot]: [...rowsForSlot(prev[slot]), emptyRow()],
    }));
  }

  function applySuggestion(slot: string, name: string, role: MealRole) {
    setMeals((prev) => {
      const items = [...rowsForSlot(prev[slot])];
      const matchingEmpty = items.findIndex(
        (item) => !item.name.trim() && item.role === role,
      );
      const emptyIndex =
        matchingEmpty >= 0
          ? matchingEmpty
          : items.findIndex((item) => !item.name.trim());
      if (emptyIndex >= 0) {
        items[emptyIndex] = { name, role };
      } else {
        items.push({ name, role });
      }
      return { ...prev, [slot]: items };
    });
  }

  function removeItem(slot: string, index: number) {
    setMeals((prev) => {
      const items = rowsForSlot(prev[slot]).filter((_, i) => i !== index);
      return { ...prev, [slot]: items.length > 0 ? items : [emptyRow()] };
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
          const payload: Record<string, MealItem[]> = {};
          for (const slot of slots) {
            payload[slot] = normalizeMealItems(meals[slot] ?? []);
          }
          saveDayLog(member.id, date, payload, applyTo);
          router.push(`/members/${member.id}`);
        }}
      >
        {slots.map((slot, slotIndex) => {
          const items = rowsForSlot(meals[slot]);
          const suggestions = suggestionsBySlot.chips[slot] ?? {
            main: [],
            side: [],
          };
          const helpId = `${helpBaseId}-${slotIndex}`;
          const helpOpen = openRoleHelp === slot;
          return (
            <fieldset key={slot} className="meal-slot-fieldset">
              <legend className="meal-slot-legend">
                <span className="field-label">{slot}</span>
                <button
                  type="button"
                  className="role-help-button"
                  aria-expanded={helpOpen}
                  aria-controls={helpId}
                  aria-describedby={helpOpen ? helpId : undefined}
                  onClick={() =>
                    setOpenRoleHelp((current) => (current === slot ? null : slot))
                  }
                >
                  <span className="visually-hidden">About main and side</span>
                  <span aria-hidden="true">?</span>
                </button>
              </legend>
              {helpOpen && (
                <p id={helpId} className="role-help-note" role="note">
                  {ROLE_HELP}
                </p>
              )}
              <ul className="meal-item-list">
                {items.map((item, index) => (
                  <li key={`${slot}-${index}`} className="meal-item-row">
                    <SearchableSelect
                      ariaLabel={`${slot} item ${index + 1}`}
                      value={item.name}
                      options={
                        suggestionsBySlot.options[slot]?.[item.role] ??
                        data.foodItems
                      }
                      exclude={items.map((row) => row.name)}
                      onChange={(v) => setItem(slot, index, v)}
                      onAddOption={addFoodItem}
                    />
                    <div
                      className="role-toggle"
                      role="group"
                      aria-label={`${slot} item ${index + 1} type`}
                    >
                      {MEAL_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          className="role-toggle-option"
                          aria-pressed={item.role === role}
                          onClick={() => setRole(slot, index, role)}
                        >
                          {roleLabel(role)}
                        </button>
                      ))}
                    </div>
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
              {(suggestions.main.length > 0 || suggestions.side.length > 0) && (
                <div className="suggestion-groups">
                  {MEAL_ROLES.map((role) => {
                    const names = suggestions[role];
                    if (names.length === 0) return null;
                    return (
                      <div key={role} className="suggestions">
                        <p className="suggestions-label">
                          {roleLabel(role)} suggestions
                        </p>
                        <ul className="suggestion-chips">
                          {names.map((name) => (
                            <li key={name}>
                              <button
                                type="button"
                                className="suggestion-chip"
                                onClick={() => applySuggestion(slot, name, role)}
                              >
                                {name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
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
