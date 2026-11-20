import Link from "next/link";
import { AssetGrid } from "@/components/asset-grid";
import { AssetList } from "@/components/asset-list";
import { DashboardFrame } from "@/components/dashboard-frame";
import { UsageFilter } from "@/components/usage-filter";
import { ViewToggle, inventoryHref } from "@/components/view-toggle";
import { formatBytes } from "@/lib/format";
import {
  countByStatus,
  matchesUsage,
  sortBySize,
  type AssetType,
  type HealthStatus,
  type SizeSort,
  type UsageFilter as UsageFilterValue,
} from "@/lib/inventory";
import { getProjectStore } from "@/lib/store";

const TYPE_FILTERS: { label: string; value?: AssetType }[] = [
  { label: "All" },
  { label: "Images", value: "image" },
  { label: "Videos", value: "video" },
  { label: "Lottie", value: "lottie" },
];

const STATUS_FILTERS: { label: string; value?: HealthStatus }[] = [
  { label: "All" },
  { label: "Red", value: "red" },
  { label: "Yellow", value: "yellow" },
  { label: "Green", value: "green" },
];

const USAGE_FILTERS: { label: string; value?: UsageFilterValue }[] = [
  { label: "Any" },
  { label: "Page", value: "page" },
  { label: "CMS", value: "cms" },
  { label: "Custom code", value: "custom-code" },
  { label: "Unused", value: "unused" },
];

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    view?: string;
    type?: string;
    status?: string;
    sort?: string;
    usage?: string;
  }>;
}) {
  const {
    project: requestedId,
    view: requestedView,
    type: requestedType,
    status: requestedStatus,
    sort: requestedSort,
    usage: requestedUsage,
  } = await searchParams;
  const view = requestedView === "grid" ? "grid" : "list";
  const assetType = requestedAssetType(requestedType);
  const status = requestedHealthStatus(requestedStatus);
  const sizeSort = requestedSizeSort(requestedSort);
  const usage = requestedUsageFilter(requestedUsage);
  const store = getProjectStore();
  const projects = await store.list();
  const selectedId = requestedId ?? projects[0]?.siteId;
  const selected = selectedId ? await store.get(selectedId) : null;
  const inventory = selected?.inventory ?? null;
  const visibleAssets = inventory
    ? sortBySize(
        inventory.assets.filter(
          (asset) =>
            (!assetType || asset.type === assetType) &&
            (!status || asset.status === status) &&
            matchesUsage(asset, usage),
        ),
        sizeSort,
      )
    : [];
  const counts = inventory ? countByStatus(inventory.assets) : null;
  const totalBytes = inventory
    ? inventory.assets.reduce((sum, asset) => sum + (asset.sizeBytes ?? 0), 0)
    : 0;

  return (
    <DashboardFrame
      projects={projects}
      activeId={inventory?.siteId}
      view={view}
      type={assetType}
      status={status}
      sort={sizeSort}
      usage={usage}
    >
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
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Asset type">
                {TYPE_FILTERS.map((filter) => (
                  <FilterChip
                    key={filter.label}
                    href={inventoryHref(inventory.siteId, view, {
                      type: filter.value,
                      status,
                      sort: sizeSort,
                      usage,
                    })}
                    active={assetType === filter.value}
                  >
                    {filter.label}
                  </FilterChip>
                ))}
              </div>
              <span className="mx-2 h-7 w-px bg-mist" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Health status">
                {STATUS_FILTERS.map((filter) => (
                  <FilterChip
                    key={filter.label}
                    href={inventoryHref(inventory.siteId, view, {
                      type: assetType,
                      status: filter.value,
                      sort: sizeSort,
                      usage,
                    })}
                    active={status === filter.value}
                    tone={filter.value}
                  >
                    {filter.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ViewToggle
                projectId={inventory.siteId}
                view={view}
                type={assetType}
                status={status}
                sort={sizeSort}
                usage={usage}
              />
              <UsageFilter
                value={usage ?? "any"}
                options={USAGE_FILTERS.map((filter) => ({
                  label: filter.label,
                  value: filter.value ?? "any",
                  href: inventoryHref(inventory.siteId, view, {
                    type: assetType,
                    status,
                    sort: sizeSort,
                    usage: filter.value,
                  }),
                }))}
              />
              <Link
                href={inventoryHref(inventory.siteId, view, {
                  type: assetType,
                  status,
                  sort: sizeSort === "asc" ? "desc" : "asc",
                  usage,
                })}
                aria-label={
                  sizeSort === "asc"
                    ? "Sorted by size, smallest first"
                    : "Sorted by size, largest first"
                }
                className="border border-mist px-3.5 py-2.5 text-[13px] leading-4 text-ink hover:border-navy"
              >
                Sort: Size {sizeSort === "asc" ? "↑" : "↓"}
              </Link>
            </div>
          </section>

          <section className="overflow-x-auto px-6 pt-7 pb-10 sm:px-10">
            {visibleAssets.length === 0 ? (
              <p className="text-[16px] leading-6 text-ink">
                {emptyInventoryMessage(assetType, status, usage)}
              </p>
            ) : view === "grid" ? (
              <AssetGrid
                assets={visibleAssets}
                projectId={inventory.siteId}
                total={inventory.assets.length}
              />
            ) : (
              <AssetList assets={visibleAssets} />
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

function requestedAssetType(value: string | undefined): AssetType | undefined {
  if (value === "image" || value === "video" || value === "lottie") return value;
  return undefined;
}

function requestedHealthStatus(value: string | undefined): HealthStatus | undefined {
  if (value === "red" || value === "yellow" || value === "green") return value;
  return undefined;
}

function requestedSizeSort(value: string | undefined): SizeSort {
  return value === "asc" ? "asc" : "desc";
}

function requestedUsageFilter(value: string | undefined): UsageFilterValue | undefined {
  if (value === "page" || value === "cms" || value === "custom-code" || value === "unused") {
    return value;
  }
  return undefined;
}

function emptyInventoryMessage(
  type: AssetType | undefined,
  status: HealthStatus | undefined,
  usage: UsageFilterValue | undefined,
): string {
  const typeName =
    type === "image"
      ? "images"
      : type === "video"
        ? "videos"
        : type === "lottie"
          ? "Lottie files"
          : "assets";
  const usageName =
    usage === "page"
      ? "page"
      : usage === "cms"
        ? "CMS"
        : usage === "custom-code"
          ? "custom code"
          : usage === "unused"
            ? "unused"
            : "";
  if (!status && !usage) {
    if (type === "image") return "No images in this inventory.";
    if (type === "video") return "No videos in this inventory.";
    if (type === "lottie") return "No Lottie files in this inventory.";
    return "No assets in this inventory.";
  }
  const detail = [status, usageName, typeName].filter(Boolean).join(" ");
  return `No ${detail} in this inventory.`;
}

function FilterChip({
  children,
  href,
  active = false,
  tone,
}: {
  children: string;
  href?: string;
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

  const activeToneClass =
    tone === "red"
      ? "border border-mark-red bg-mark-red/12 text-mark-red"
      : tone === "yellow"
        ? "border border-mark-amber bg-mark-amber/12 text-mark-amber"
        : tone === "green"
          ? "border border-mark-green bg-mark-green/12 text-mark-green"
          : "border border-navy bg-navy text-foam";

  const className = `px-4 py-2.5 text-[13px] leading-4 font-medium ${
    active ? activeToneClass : `border ${toneClass}`
  }`;

  if (!href) return <span className={className}>{children}</span>;

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
