import { AssetGrid } from "@/components/asset-grid";
import { AssetList } from "@/components/asset-list";
import { DashboardFrame } from "@/components/dashboard-frame";
import { ViewToggle } from "@/components/view-toggle";
import { formatBytes } from "@/lib/format";
import { countByStatus, type HealthStatus } from "@/lib/inventory";
import { getProjectStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; view?: string }>;
}) {
  const { project: requestedId, view: requestedView } = await searchParams;
  const view = requestedView === "grid" ? "grid" : "list";
  const store = getProjectStore();
  const projects = await store.list();
  const selectedId = requestedId ?? projects[0]?.siteId;
  const selected = selectedId ? await store.get(selectedId) : null;
  const inventory = selected?.inventory ?? null;
  const counts = inventory ? countByStatus(inventory.assets) : null;
  const totalBytes = inventory
    ? inventory.assets.reduce((sum, asset) => sum + (asset.sizeBytes ?? 0), 0)
    : 0;

  return (
    <DashboardFrame projects={projects} activeId={inventory?.siteId} view={view}>
      <header className="flex items-center justify-between gap-6 px-6 pt-7 sm:px-10">
        <p className="inline-flex items-center gap-2.5 text-[13px] leading-4 font-medium tracking-[0.06em] text-ink uppercase">
          <span className="size-2.5 rounded-full bg-navy" aria-hidden="true" />
          Visual Asset Overview
        </p>
        <p className="flex items-center gap-6">
          <span className="hidden font-mono text-[12px] leading-4 text-ink sm:inline">
            Export · JSON ready
          </span>
          <span className="text-[13px] leading-4 font-medium text-navy">
            {inventory ? "Scan complete" : "Awaiting scan"}
          </span>
        </p>
      </header>

      {!inventory || !counts ? (
        <section className="flex flex-col gap-4 px-6 pt-14 sm:px-10">
          <h1 className="project-title text-navy">
            {requestedId ? "Project not found" : "No project yet"}
          </h1>
          <p className="max-w-[560px] text-[16px] leading-6 text-ink">
            {requestedId
              ? "That project is not in the local inventory."
              : "Add a local Webflow export. The inventory lists every image, video, and Lottie once the scan finishes."}
          </p>
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-[18px] px-6 pt-12 sm:px-10">
            <h1 className="project-title text-navy">{inventory.siteName}</h1>
            <p className="max-w-[640px] text-[16px] leading-6 text-ink sm:text-[18px] sm:leading-7">
              Site-wide inventory — images, videos, and Lottie across pages, CMS, and custom
              code.
            </p>
          </section>

          <section className="flex flex-wrap items-end gap-8 px-6 pt-10 sm:gap-10 sm:px-10">
            <Stat
              label="Red"
              value={counts.red}
              color="#C23B2A"
              detail=">1.5 MB or unused"
            />
            <span className="hidden h-[102px] w-px bg-mist sm:block" aria-hidden="true" />
            <Stat
              label="Yellow"
              value={counts.yellow}
              color="#C99212"
              detail="500 KB–1.5 MB or missing alt"
            />
            <span className="hidden h-[102px] w-px bg-mist sm:block" aria-hidden="true" />
            <Stat
              label="Green"
              value={counts.green}
              color="#1F7A4D"
              detail="Optimized and in use"
            />
            <div className="ml-auto flex flex-col justify-end gap-1.5 pb-1">
              <p className="text-[12px] leading-4 tracking-[0.06em] text-ink uppercase">
                Total weight
              </p>
              <p className="font-mono text-[22px] leading-7 text-navy">{formatBytes(totalBytes)}</p>
            </div>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-4 px-6 pt-9 sm:px-10">
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip active>All</FilterChip>
              <FilterChip>Images</FilterChip>
              <FilterChip>Videos</FilterChip>
              <FilterChip>Lottie</FilterChip>
              <span className="mx-2 h-7 w-px bg-mist" aria-hidden="true" />
              <FilterChip tone="red">Red</FilterChip>
              <FilterChip tone="yellow">Yellow</FilterChip>
              <FilterChip tone="green">Green</FilterChip>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ViewToggle projectId={inventory.siteId} view={view} />
              <span className="border border-mist px-3.5 py-2.5 text-[13px] leading-4 text-ink">
                Usage: Any
              </span>
              <span className="border border-mist px-3.5 py-2.5 text-[13px] leading-4 text-ink">
                Sort: Size ↓
              </span>
            </div>
          </section>

          <section className="overflow-x-auto px-6 pt-7 pb-10 sm:px-10">
            {view === "grid" ? (
              <AssetGrid assets={inventory.assets} projectId={inventory.siteId} />
            ) : (
              <AssetList assets={inventory.assets} />
            )}
          </section>
        </>
      )}
    </DashboardFrame>
  );
}

function Stat({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-[140px] flex-col gap-2">
      <p className="inline-flex items-center gap-2.5">
        <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
        <span
          className="text-[12px] leading-4 font-semibold tracking-[0.08em] uppercase"
          style={{ color }}
        >
          {label}
        </span>
      </p>
      <p className="text-[48px] leading-[52px] font-bold tracking-[-0.03em] text-navy">{value}</p>
      <p className="text-[13px] leading-[18px] text-ink">{detail}</p>
    </div>
  );
}

function FilterChip({
  children,
  active = false,
  tone,
}: {
  children: string;
  active?: boolean;
  tone?: HealthStatus;
}) {
  const toneClass =
    tone === "red"
      ? "border-mark-red/35 text-mark-red"
      : tone === "yellow"
        ? "border-mark-amber/35 text-mark-amber"
        : tone === "green"
          ? "border-mark-green/35 text-mark-green"
          : "border-mist text-navy";

  return (
    <span
      className={`px-4 py-2.5 text-[13px] leading-4 font-medium ${
        active ? "border border-navy bg-navy text-foam" : `border ${toneClass}`
      }`}
    >
      {children}
    </span>
  );
}
