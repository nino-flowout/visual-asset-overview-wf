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
    <div className="flex shrink-0 border border-[#C5D3DE]" role="group" aria-label="Layout">
      <ToggleLink href={inventoryHref(projectId, "list")} active={view === "list"}>
        List
      </ToggleLink>
      <ToggleLink href={inventoryHref(projectId, "grid")} active={view === "grid"}>
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
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`px-3.5 py-2.5 text-[13px] leading-4 font-medium ${
        active ? "bg-[#0B1F33] text-[#F7FAFC]" : "text-[#5A6B7A]"
      }`}
    >
      {children}
    </Link>
  );
}
