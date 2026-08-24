"use client";

import { MemberIcon } from "@/components/MemberIcon";
import { useAppData } from "@/context/AppDataContext";
import Link from "next/link";

export function FamilyHome() {
  const { ready, data } = useAppData();

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
            <Link href={`/members/${member.id}`} className="member-tile">
              <MemberIcon
                icon={member.icon}
                size={56}
                className="member-tile-icon"
              />
              <span className="member-tile-name">{member.name}</span>
            </Link>
            <Link href={`/members/${member.id}/edit`} className="link-button">
              Edit
            </Link>
          </div>
        ))}
      </div>

      {data.members.length === 0 && (
        <p className="muted empty-hint">Add a family member to get started.</p>
      )}

      <Link href="/members/new" className="primary-button add-member-btn">
        Add family member
      </Link>
    </div>
  );
}
