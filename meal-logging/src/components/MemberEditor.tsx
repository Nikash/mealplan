"use client";

import { MemberIcon, iconLabel } from "@/components/MemberIcon";
import { useAppData } from "@/context/AppDataContext";
import { MEMBER_ICONS, type MemberIcon as MemberIconType } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MemberEditor({ memberId }: { memberId?: string }) {
  const router = useRouter();
  const { ready, getMember, addMember, updateMember } = useAppData();

  if (!ready) {
    return <p className="muted">Loading…</p>;
  }

  if (memberId) {
    const member = getMember(memberId);
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
      <div className="page">
        <header className="page-header with-back">
          <Link href="/" className="back-link">
            ← Family
          </Link>
          <div className="person-heading">
            <MemberIcon icon={member.icon} size={40} />
            <h1 className="app-title">Edit {member.name}</h1>
          </div>
        </header>
        <MemberForm
          initialIcon={member.icon}
          initialExtraSlots={member.extraMealSlots}
          onCancel={() => router.push("/")}
          onSave={(icon, extraMealSlots) => {
            updateMember(member.id, { icon, extraMealSlots });
            router.push("/");
          }}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header with-back">
        <Link href="/" className="back-link">
          ← Family
        </Link>
        <h1 className="app-title">Add family member</h1>
      </header>
      <MemberForm
        showName
        initialIcon="son"
        initialExtraSlots={[]}
        onCancel={() => router.push("/")}
        onSave={(icon, extraMealSlots, name) => {
          if (!name?.trim()) return;
          addMember({ name, icon, extraMealSlots });
          router.push("/");
        }}
      />
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

  function addDraft() {
    const t = draft.trim();
    if (!t) return;
    onChange([...slots, t]);
    setDraft("");
  }

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
      <div className="slot-add-row">
        <input
          className="text-input"
          value={draft}
          placeholder="e.g. Evening snack"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
        />
        <button type="button" className="secondary-button" onClick={addDraft}>
          Add meal slot
        </button>
      </div>
    </div>
  );
}

function MemberForm({
  showName = false,
  initialIcon,
  initialExtraSlots,
  onCancel,
  onSave,
}: {
  showName?: boolean;
  initialIcon: MemberIconType;
  initialExtraSlots: string[];
  onCancel: () => void;
  onSave: (icon: MemberIconType, extra: string[], name?: string) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<MemberIconType>(initialIcon);
  const [extra, setExtra] = useState<string[]>(initialExtraSlots);

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (showName && !name.trim()) return;
        onSave(icon, extra, name);
      }}
    >
      {showName && (
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
      )}
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
