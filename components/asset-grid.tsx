import { assetIssue, usageChips } from "@/lib/asset-label";
import { formatBytes } from "@/lib/format";
import type { Asset, AssetType, HealthStatus } from "@/lib/inventory";
import { mediaUrl } from "@/lib/media-url";

const ACCENT: Record<HealthStatus, string> = {
  red: "#C23B2A",
  yellow: "#C99212",
  green: "#1F7A4D",
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  red: "Red",
  yellow: "Yellow",
  green: "Green",
};

const TYPE_LABEL: Record<AssetType, string> = {
  image: "IMG",
  video: "VID",
  lottie: "LOT",
};

export function AssetGrid({
  assets,
  projectId,
}: {
  assets: Asset[];
  projectId: string;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[#5A6B7A] uppercase">
          Visual inventory
        </p>
        <p className="text-[12px] font-semibold text-[#0B1F33]">
          Showing {assets.length} of {assets.length}
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-[25px] sm:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <li key={asset.id}>
            <AssetTile asset={asset} projectId={projectId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssetTile({ asset, projectId }: { asset: Asset; projectId: string }) {
  const src = mediaUrl(asset, projectId);
  const showImage = Boolean(src) && asset.type === "image";
  const light = !showImage && asset.status === "green";
  const meta = light ? "#5A6B7A" : "#8FB0C4";
  const chips = usageChips(asset.usage);

  return (
    <article className="flex min-w-0 flex-col gap-2.5">
      <div
        className="relative flex h-[190px] overflow-hidden"
        style={{ backgroundImage: previewBackground(asset) }}
      >
        {showImage ? (
          // Local export files are served by the dev-only media route.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src ?? undefined}
            alt={asset.alt ?? ""}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        {showImage ? (
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/45" />
        ) : null}
        <span
          className="relative z-10 w-[5px] shrink-0"
          style={{ backgroundColor: ACCENT[asset.status] }}
        />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <span
              className="font-mono text-[10px] leading-3 tracking-[0.06em]"
              style={{ color: showImage ? "#F7FAFC" : meta }}
            >
              {TYPE_LABEL[asset.type]}
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-[5px] px-2 py-1"
              style={{ backgroundColor: "#F7FAFCEB" }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: ACCENT[asset.status] }}
              />
              <span
                className="text-[10px] leading-3 font-semibold"
                style={{ color: ACCENT[asset.status] }}
              >
                {STATUS_LABEL[asset.status]}
              </span>
            </span>
          </div>
          {showImage ? null : (
            <span className="flex flex-col gap-1.5" aria-hidden="true">
              <span
                className="h-2 w-[65%]"
                style={{ backgroundColor: light ? "#0B1F3324" : "#FFFFFF2E" }}
              />
              <span
                className="h-2 w-[40%]"
                style={{ backgroundColor: light ? "#0B1F3314" : "#FFFFFF1F" }}
              />
            </span>
          )}
          <span
            className="font-mono text-[11px] leading-[14px]"
            style={{ color: showImage ? "#F7FAFC" : meta }}
          >
            {formatBytes(asset.sizeBytes)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="truncate text-[14px] leading-[18px] font-medium text-[#0B1F33]" title={asset.name}>
          {asset.name}
        </h3>
        <p className="text-[12px] leading-4 text-[#5A6B7A]">{assetIssue(asset)}</p>
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li
              key={chip}
              className="border border-[#C5D3DE] px-2 py-1 text-[11px] leading-[14px] text-[#0B1F33]"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function previewBackground(asset: Asset): string {
  if (asset.type === "video" && asset.status === "red") {
    return "linear-gradient(160deg, #0B1F33 0%, #1A3548 40%, #3D5A6E 100%)";
  }
  if (asset.type === "lottie" && asset.status === "yellow") {
    return "linear-gradient(160deg, #1F3A5F 0%, #3A5F8A 50%, #5A7FA8 100%)";
  }
  if (asset.status === "red") {
    return "linear-gradient(145deg, #1A3A4A 0%, #3D6A7E 55%, #6B8FA3 100%)";
  }
  if (asset.status === "yellow") {
    return "linear-gradient(150deg, #3A4D40 0%, #6A8570 55%, #8FA892 100%)";
  }
  return "linear-gradient(180deg, #E8EEF2 0%, #C5D3DE 100%)";
}
