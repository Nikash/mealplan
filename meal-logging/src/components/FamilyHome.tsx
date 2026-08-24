"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppData } from "@/context/AppDataContext";
import { MemberIcon, iconLabel } from "@/components/MemberIcon";
import { MEMBER_ICONS, type MemberIcon as MemberIconType } from "@/lib/types";

export function FamilyHome() {
  const { ready, data, addMember, updateMember } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!ready) {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="app-title">Meal Log</h1>
        <p className="page-sub">Who ate what today</p>
      </header>

      <div className="member-grid">
        {data.members.map((member) => (
          <div key={member.id} className="member-tile-wrap">
            <Link
              href={`/members/${member.id}`}
              className="member-tile"
            >
              <MemberIcon icon={member.icon} size={56} className="member-tile-icon" />
              <span className="member-tile-name">{member.name}</span>
            </Link>
            <button
              type="button"
              className="link-button"
              onClick={() =>
                setEditingId((id) => (id === member.id ? null : member.id))
              }
            >
              Edit
            </button>
            {editingId === member.id && (
              <MemberEditForm
                initialIcon={member.icon}
                initialExtraSlots={member.extraMealSlots}
                onCancel={() => setEditingId(null)}
                onSave={(icon, extraMealSlots) => {
                  updateMember(member.id, { icon, extraMealSlots });
                  setEditingId(null);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {data.members.length === 0 && !showAdd && (
        <p className="muted empty-hint">Add a family member to get started.</p>
      )}

      {showAdd ? (
        <MemberAddForm
          onCancel={() => setShowAdd(false)}
          onSave={(name, icon, extraMealSlots) => {
            addMember({ name, icon, extraMealSlots });
            setShowAdd(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="primary-button add-member-btn"
          onClick={() => setShowAdd(true)}
        >
          Add family member
        </button>
      )}
    </div>
  );
}

function IconPicker({
  value,
  onChange,
}: {
  value: MemberIconType;
  onChange: (icon: MemberIconType) => void;
}) {
  return (
    <div className="icon-picker" role="radiogroup" aria-label="Icon">
      {MEMBER_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          role="radio"
          aria-checked={value === icon}
          className={`icon-pick${value === icon ? " selected" : ""}`}
          onClick={() => onChange(icon)}
          title={iconLabel(icon)}
        >
          <MemberIcon icon={icon} size={36} />
          <span>{iconLabel(icon)}</span>
        </button>
      ))}
    </div>
  );
}

function ExtraSlotsEditor({
  slots,
  onChange,
}: {
  slots: string[];
  onChange: (slots: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="field">
      <span className="field-label">Extra meal slots</span>
      <ul className="slot-list">
        {slots.map((slot, i) => (
          <li key={`${slot}-${i}`} className="slot-row">
            <span>{slot}</span>
            <button
              type="button"
              className="link-button"
              onClick={() => onChange(slots.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="inline-row">
        <input
          className="text-input"
          value={draft}
          placeholder="e.g. Evening snack"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const t = draft.trim();
              if (!t) return;
              onChange([...slots, t]);
              setDraft("");
            }
          }}
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            const t = draft.trim();
            if (!t) return;
            onChange([...slots, t]);
            setDraft("");
          }}
        >
          Add slot
        </button>
      </div>
    </div>
  );
}

function MemberAddForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (name: string, icon: MemberIconType, extra: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<MemberIconType>("boy");
  const [extra, setExtra] = useState<string[]>([]);

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name, icon, extra);
      }}
    >
      <h2 className="panel-title">Add family member</h2>
      <div className="field">
        <label className="field-label" htmlFor="member-name">
          Name
        </label>
        <input
          id="member-name"
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="field">
        <span className="field-label">Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <ExtraSlotsEditor slots={extra} onChange={setExtra} />
      <div className="button-row">
        <button type="submit" className="primary-button">
          Save
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function MemberEditForm({
  initialIcon,
  initialExtraSlots,
  onCancel,
  onSave,
}: {
  initialIcon: MemberIconType;
  initialExtraSlots: string[];
  onCancel: () => void;
  onSave: (icon: MemberIconType, extra: string[]) => void;
}) {
  const [icon, setIcon] = useState<MemberIconType>(initialIcon);
  const [extra, setExtra] = useState<string[]>(initialExtraSlots);

  return (
    <form
      className="panel panel-nested"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(icon, extra);
      }}
    >
      <h2 className="panel-title">Edit member</h2>
      <div className="field">
        <span className="field-label">Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <ExtraSlotsEditor slots={extra} onChange={setExtra} />
      <div className="button-row">
        <button type="submit" className="primary-button">
          Save
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
