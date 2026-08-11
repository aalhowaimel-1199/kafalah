const paths: Record<string, JSX.Element> = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  doc: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4" /><path d="M9 13h6M9 17h6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  gate: <><path d="M4 21V5l8-2 8 2v16" /><path d="M4 21h16M9 21V10M15 21V10" /></>,
  scan: <><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3" /><path d="M7 8v8M10 8v8M13 8v8M16 8v8" /></>,
  dash: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
  send: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></>,
  pulse: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  note: <><path d="M5 3h14v12l-5 6H5z" /><path d="M14 21v-6h5" /></>,
  tag: <><path d="M3 12l9-9 9 9-9 9z" /><circle cx="12" cy="9" r="1.4" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 5a3 3 0 010 6M21 20c0-2.5-2-4-4.5-4.3" /></>,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  plug: <><path d="M9 2v6M15 2v6" /><path d="M7 8h10v3a5 5 0 01-10 0z" /><path d="M12 16v6" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  shield: <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5z" />,
  bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>,
};

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
