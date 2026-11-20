import type { ReactNode } from "react";
import Link from "next/link";

export function inventoryHref(
  projectId: string | undefined,
  view: "list" | "grid",
): string {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (view === "grid") params.set("view", "grid");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function ViewToggle({
  projectId,
  view,
}: {
  projectId?: string;
  view: "list" | "grid";
}) {
  return (
    <div className="flex shrink-0 border border-mist" role="group" aria-label="Layout">
      <ToggleLink href={inventoryHref(projectId, "list")} active={view === "list"}>
        <ListIcon active={view === "list"} />
        List
      </ToggleLink>
      <ToggleLink href={inventoryHref(projectId, "grid")} active={view === "grid"}>
        <GridIcon active={view === "grid"} />
        Grid
      </ToggleLink>
    </div>
  );
}

function ToggleLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] leading-4 font-medium ${
        active ? "bg-navy text-foam" : "text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function ListIcon({ active }: { active: boolean }) {
  const color = active ? "#F7FAFC" : "#5A6B7A";
  return (
    <span className="flex h-2.5 w-3 flex-col justify-between" aria-hidden="true">
      <span className="h-0.5 w-3" style={{ backgroundColor: color }} />
      <span className="h-0.5 w-3" style={{ backgroundColor: color }} />
      <span className="h-0.5 w-3" style={{ backgroundColor: color }} />
    </span>
  );
}

function GridIcon({ active }: { active: boolean }) {
  const color = active ? "#F7FAFC" : "#5A6B7A";
  return (
    <span className="grid size-3 grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="size-[5px]" style={{ backgroundColor: color }} />
      <span className="size-[5px]" style={{ backgroundColor: color }} />
      <span className="size-[5px]" style={{ backgroundColor: color }} />
      <span className="size-[5px]" style={{ backgroundColor: color }} />
    </span>
  );
}
