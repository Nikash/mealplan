"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { TrashIcon } from "@/components/TrashIcon";
import {
  DEFAULT_MEAL_SLOTS,
  mealItemKey,
  mealSlotsFor,
  type AppData,
  type MealRole,
} from "@/lib/types";

const MEAL_ROLES: MealRole[] = ["main", "side"];

type DishRole = MealRole | "mixed" | "none";

type DishSummary = {
  key: string;
  name: string;
  role: DishRole;
};

function roleLabel(role: MealRole): string {
  return role === "side" ? "Side" : "Main";
}

function safeReturnPath(from: string | null): string | null {
  if (!from) return null;
  if (
    !/^\/members\/[0-9a-f-]+(?:\/days\/\d{4}-\d{2}-\d{2}|\/edit)?$/.test(from)
  ) {
    return null;
  }
  return from;
}

function knownSlots(data: AppData, memberId: string): string[] {
  const extras = new Set<string>();
  const add = (slot: string) => {
    const trimmed = slot.trim();
    if (!trimmed || (DEFAULT_MEAL_SLOTS as readonly string[]).includes(trimmed)) {
      return;
    }
    extras.add(trimmed);
  };

  if (memberId) {
    const member = data.members.find((entry) => entry.id === memberId);
    if (member) {
      for (const slot of mealSlotsFor(member)) add(slot);
    }
    for (const log of data.dayLogs) {
      if (log.memberId !== memberId) continue;
      for (const slot of Object.keys(log.meals)) add(slot);
    }
  } else {
    for (const member of data.members) {
      for (const slot of member.extraMealSlots) add(slot);
    }
    for (const log of data.dayLogs) {
      for (const slot of Object.keys(log.meals)) add(slot);
    }
  }

  return [
    ...DEFAULT_MEAL_SLOTS,
    ...[...extras].sort((a, b) => a.localeCompare(b)),
  ];
}

function listDishes(data: AppData, memberId: string, slot: string): DishSummary[] {
  const names = new Map<string, string>();

  const remember = (raw: string) => {
    const key = mealItemKey(raw);
    if (!key || names.has(key)) return;
    const catalog = data.foodItems.find((item) => mealItemKey(item) === key);
    names.set(key, (catalog ?? raw).trim());
  };

  if (!memberId && !slot) {
    for (const name of data.foodItems) remember(name);
  }

  for (const log of data.dayLogs) {
    if (memberId && log.memberId !== memberId) continue;
    for (const [logSlot, items] of Object.entries(log.meals)) {
      if (slot && logSlot !== slot) continue;
      for (const item of items) remember(item.name);
    }
  }

  const roles = new Map<string, Set<MealRole>>();
  for (const log of data.dayLogs) {
    for (const items of Object.values(log.meals)) {
      for (const item of items) {
        const key = mealItemKey(item.name);
        if (!key || !names.has(key)) continue;
        const set = roles.get(key) ?? new Set<MealRole>();
        set.add(item.role);
        roles.set(key, set);
      }
    }
  }

  return [...names.entries()]
    .map(([key, name]) => {
      const set = roles.get(key);
      let role: DishRole = "none";
      if (set?.size === 1) role = [...set][0];
      else if (set && set.size > 1) role = "mixed";
      return { key, name, role };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function DishList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, data, renameFoodItem, setMealItemRole, deleteFoodItem } =
    useAppData();

  const memberParam = searchParams.get("member") ?? "";
  const slotParam = searchParams.get("slot") ?? "";
  const from = safeReturnPath(searchParams.get("from"));
  const memberId = data.members.some((member) => member.id === memberParam)
    ? memberParam
    : "";

  const slots = useMemo(
    () => knownSlots(data, memberId),
    [data, memberId],
  );
  const slot = slotParam;
  const slotChoices = slot && !slots.includes(slot) ? [...slots, slot] : slots;

  const dishes = useMemo(
    () => listDishes(data, memberId, slot),
    [data, memberId, slot],
  );

  function pushFilters(nextMember: string, nextSlot: string) {
    const params = new URLSearchParams();
    if (nextMember) params.set("member", nextMember);
    if (nextSlot) params.set("slot", nextSlot);
    if (from) params.set("from", from);
    const query = params.toString();
    router.replace(query ? `/dishes?${query}` : "/dishes");
  }

  if (!ready) {
    return <p className="muted">Loading…</p>;
  }

  let emptyCopy = "No dishes yet.";
  if (memberId && slot) {
    emptyCopy = "No dishes logged for this person and slot.";
  } else if (memberId) {
    emptyCopy = "No dishes logged for this person.";
  } else if (slot) {
    emptyCopy = "No dishes logged for this slot.";
  }

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link href={from ?? "/"} className="back-link">
          {from ? "← Back" : "← Family"}
        </Link>
        <h1 className="app-title">Dishes</h1>
      </header>

      <div className="dish-filters">
        <label className="field">
          <span className="field-label">Person</span>
          <select
            className="text-input"
            value={memberId}
            onChange={(event) => pushFilters(event.target.value, slot)}
          >
            <option value="">All</option>
            {data.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Slot</span>
          <select
            className="text-input"
            value={slotChoices.includes(slot) ? slot : ""}
            onChange={(event) => pushFilters(memberId, event.target.value)}
          >
            <option value="">All</option>
            {slotChoices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>
      </div>

      {dishes.length === 0 ? (
        <p className="muted empty-hint">{emptyCopy}</p>
      ) : (
        <ul className="dish-list panel">
          {dishes.map((dish) => (
            <li key={dish.name}>
              <DishRow
                name={dish.name}
                role={dish.role}
                onRename={renameFoodItem}
                onRole={setMealItemRole}
                onDelete={deleteFoodItem}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DishRow({
  name,
  role,
  onRename,
  onRole,
  onDelete,
}: {
  name: string;
  role: DishRole;
  onRename: (from: string, to: string) => boolean;
  onRole: (name: string, role: MealRole) => void;
  onDelete: (name: string) => void;
}) {
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setDraft(name);
      setError("");
      return;
    }
    if (!onRename(name, trimmed)) {
      setDraft(name);
      setError("A dish with that name already exists.");
      return;
    }
    setError("");
  }

  return (
    <div className="dish-row">
      <label className="field">
        <span className="visually-hidden">Dish name</span>
        <input
          className="text-input"
          value={draft}
          aria-label={`Rename ${name}`}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError("");
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        {error ? <span className="field-error">{error}</span> : null}
      </label>
      {role === "none" ? null : (
        <div className="role-toggle" role="group" aria-label={`${name} type`}>
          {MEAL_ROLES.map((option) => (
            <button
              key={option}
              type="button"
              className="role-toggle-option"
              aria-pressed={role === option}
              onClick={() => onRole(name, option)}
            >
              {roleLabel(option)}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="icon-button"
        aria-label={`Delete ${name}`}
        onClick={() => {
          if (window.confirm(`Delete "${name}" from every meal?`)) {
            onDelete(name);
          }
        }}
      >
        <TrashIcon />
      </button>
    </div>
  );
}
