import Link from "next/link";
import { AssetGrid } from "@/components/asset-grid";
import { ScanForm } from "@/components/scan-form";
import { ViewToggle, inventoryHref } from "@/components/view-toggle";
import { formatBytes } from "@/lib/format";
import { countByStatus, type Asset, type HealthStatus } from "@/lib/inventory";
import { mediaUrl } from "@/lib/media-url";
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500">
          VISUAL ASSET OVERVIEW
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Local Webflow inventory</h1>
        <p className="max-w-2xl text-zinc-600">
          Scan an exported site on this machine. File sizes, alt text, and usage stay in a
          local inventory the dashboard can read.
        </p>
      </header>

      <ScanForm />

      {projects.length > 0 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Scanned projects">
          {projects.map((project) => {
            const active = project.siteId === inventory?.siteId;
            return (
              <Link
                key={project.siteId}
                href={inventoryHref(project.siteId, view)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  active
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                {project.siteName}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {!inventory || !counts ? (
        <p className="text-zinc-600">
          {requestedId
            ? "That project is not in the local inventory."
            : "No project scanned yet."}
        </p>
      ) : (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{inventory.siteName}</h2>
              <p className="text-sm text-zinc-500">
                {inventory.assets.length} assets · scanned{" "}
                {new Date(inventory.scannedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-end gap-6">
              <dl className="flex gap-6 text-sm">
                <Count label="Red" value={counts.red} tone="red" />
                <Count label="Yellow" value={counts.yellow} tone="yellow" />
                <Count label="Green" value={counts.green} tone="green" />
              </dl>
              <ViewToggle projectId={inventory.siteId} view={view} />
            </div>
          </div>

          {view === "grid" ? (
            <AssetGrid assets={inventory.assets} projectId={inventory.siteId} />
          ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Size</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Usage</th>
                </tr>
              </thead>
              <tbody>
                {inventory.assets.map((asset) => (
                  <AssetRow key={asset.id} projectId={inventory.siteId} asset={asset} />
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      )}
    </main>
  );
}

function Count({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: HealthStatus;
}) {
  return (
    <div>
      <dt className={`font-medium ${toneClass(tone)}`}>{label}</dt>
      <dd className="text-2xl font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}

function AssetRow({ projectId, asset }: { projectId: string; asset: Asset }) {
  const src = mediaUrl(asset, projectId);
  return (
    <tr className="border-t border-zinc-200 align-top">
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          {src && asset.type === "image" ? (
            // Local export files are served by the dev-only media route, not the image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={asset.alt ?? ""}
              className="h-12 w-12 rounded bg-zinc-100 object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded bg-zinc-100 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
              {asset.type === "lottie" ? "Lottie" : asset.type}
            </span>
          )}
          <span>
            <span className="block font-medium text-zinc-950">{asset.name}</span>
            <span className="block text-zinc-500">{asset.path ?? asset.url ?? "No file"}</span>
          </span>
        </div>
      </td>
      <td className="px-3 py-3 capitalize">{asset.type}</td>
      <td className="px-3 py-3 whitespace-nowrap">{formatBytes(asset.sizeBytes)}</td>
      <td className={`px-3 py-3 font-medium capitalize ${toneClass(asset.status)}`}>
        {asset.status}
      </td>
      <td className="px-3 py-3 text-zinc-600">
        {asset.usage.length === 0
          ? "Unused"
          : asset.usage.map((usage) => `${usage.context} · ${usage.location}`).join(", ")}
      </td>
    </tr>
  );
}

function toneClass(status: HealthStatus): string {
  if (status === "red") return "text-red-700";
  if (status === "yellow") return "text-amber-700";
  return "text-green-700";
}
