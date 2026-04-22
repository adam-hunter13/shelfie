"use client";

interface Props {
  name: string;        // display_name or email
  color: string;       // hex bg color
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: { outer: "w-7 h-7",  text: "text-xs"  },
  md: { outer: "w-9 h-9",  text: "text-sm"  },
  lg: { outer: "w-14 h-14", text: "text-xl" },
};

function initials(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, color, size = "md" }: Props) {
  const s = SIZE[size];
  return (
    <div
      className={`${s.outer} rounded-full flex items-center justify-center flex-shrink-0 font-sans font-semibold text-white select-none`}
      style={{ backgroundColor: color }}
    >
      <span className={s.text}>{initials(name)}</span>
    </div>
  );
}
