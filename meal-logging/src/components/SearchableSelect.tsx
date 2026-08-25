"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
  label?: string;
  ariaLabel?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddOption: (value: string) => void;
};

export function SearchableSelect({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  onAddOption,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const query = open ? draft : value;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const canAdd =
    query.trim().length > 0 &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  function select(item: string) {
    onChange(item);
    setDraft(item);
    setOpen(false);
  }

  function addNew() {
    const trimmed = query.trim();
    if (!trimmed) return;
    onAddOption(trimmed);
    onChange(trimmed);
    setDraft(trimmed);
    setOpen(false);
  }

  const accessibleName = ariaLabel ?? label;

  return (
    <div className="field" ref={wrapRef}>
      {label ? (
        <label className="field-label" htmlFor={listId}>
          {label}
        </label>
      ) : null}
      <input
        id={listId}
        className="text-input"
        role="combobox"
        aria-label={label ? undefined : accessibleName}
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${listId}-list`}
        autoComplete="off"
        value={query}
        placeholder="Search or add…"
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setDraft(value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (canAdd) addNew();
            else if (filtered[0]) select(filtered[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          id={`${listId}-list`}
          className="combobox-list"
          role="listbox"
        >
          {filtered.map((item) => (
            <li key={item} role="option" aria-selected={item === value}>
              <button
                type="button"
                className="combobox-option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(item)}
              >
                {item}
              </button>
            </li>
          ))}
          {canAdd && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                className="combobox-option combobox-option-add"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addNew}
              >
                Add “{query.trim()}”
              </button>
            </li>
          )}
          {filtered.length === 0 && !canAdd && (
            <li className="combobox-empty">No items yet</li>
          )}
        </ul>
      )}
    </div>
  );
}
