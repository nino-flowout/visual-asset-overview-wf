"use client";

import { useRouter } from "next/navigation";

export function UsageFilter({
  value,
  options,
}: {
  value: string;
  options: { label: string; value: string; href: string }[];
}) {
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-2 border border-mist px-3.5 py-2.5 text-[13px] leading-4 text-ink hover:border-navy">
      <span aria-hidden="true">Usage</span>
      <select
        aria-label="Usage"
        value={value}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next) router.push(next.href);
        }}
        className="cursor-pointer bg-transparent text-[13px] leading-4 text-ink outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
