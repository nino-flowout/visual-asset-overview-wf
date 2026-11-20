import { usageChips } from "@/lib/asset-label";
import type { AssetUsage } from "@/lib/inventory";

export function UsageChips({ usage }: { usage: readonly AssetUsage[] }) {
  return (
    <ul className="flex min-w-0 flex-wrap gap-1.5">
      {usageChips(usage).map((chip) => (
        <li
          key={chip}
          className="border border-mist px-2 py-1 text-[11px] leading-[14px] text-navy"
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}
