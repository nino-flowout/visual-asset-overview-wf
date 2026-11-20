"use client";

import { useState } from "react";
import { assetIssue } from "@/lib/asset-label";
import { formatBytes } from "@/lib/format";
import type { Asset } from "@/lib/inventory";
import { mediaUrl } from "@/lib/media-url";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  TYPE_CODE_LONG,
  assetSwatch,
} from "@/components/asset-visual";
import { UsageChips } from "@/components/usage-chips";

export function AssetGrid({
  assets,
  projectId,
  total,
}: {
  assets: Asset[];
  projectId: string;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[12px] leading-4 font-semibold tracking-[0.08em] text-ink uppercase">
          Visual inventory
        </p>
        <p className="font-mono text-[12px] leading-4 text-ink">
          Showing {assets.length} of {total}
        </p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-x-6 gap-y-6">
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
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && asset.type === "image" && !failed;
  const swatch = assetSwatch(asset.name, asset.type, asset.status);
  const meta = showImage || !swatch.light ? "#8FB0C4" : "#5A6B7A";
  const bars = swatch.light
    ? ["#0B1F3324", "#0B1F3314", "#0B1F330F"]
    : ["#FFFFFF2E", "#FFFFFF1F", "#FFFFFF1A"];

  return (
    <article className="asset-card flex min-w-0 flex-col gap-3">
      <div
        className="asset-preview relative flex overflow-hidden"
        style={{ backgroundImage: swatch.gradient }}
      >
        {showImage ? (
          // Local export files are served by the dev-only media route.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src ?? undefined}
            alt={asset.alt ?? ""}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        {showImage ? (
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/40" />
        ) : null}
        <span
          className="relative z-10 w-1.5 shrink-0"
          style={{ backgroundColor: STATUS_COLOR[asset.status] }}
        />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between px-5 py-[18px]">
          <div className="flex items-start justify-between gap-3">
            <span
              className="font-mono text-[11px] leading-[14px] tracking-[0.08em]"
              style={{ color: showImage ? "#F7FAFC" : meta }}
            >
              {TYPE_CODE_LONG[asset.type]}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 bg-foam/92 px-2.5 py-[5px]">
              <span
                className="size-[7px] rounded-full"
                style={{ backgroundColor: STATUS_COLOR[asset.status] }}
              />
              <span
                className="text-[11px] leading-[14px] font-semibold"
                style={{ color: STATUS_COLOR[asset.status] }}
              >
                {STATUS_LABEL[asset.status]}
              </span>
            </span>
          </div>
          {showImage ? (
            <span />
          ) : (
            <span className="flex flex-col gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-[70%]" style={{ backgroundColor: bars[0] }} />
              <span className="h-2.5 w-[45%]" style={{ backgroundColor: bars[1] }} />
              <span className="mt-2 h-2.5 w-[58%]" style={{ backgroundColor: bars[2] }} />
            </span>
          )}
          <span
            className="font-mono text-[12px] leading-4"
            style={{ color: showImage ? "#F7FAFC" : meta }}
          >
            {formatBytes(asset.sizeBytes)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="truncate text-[15px] leading-[18px] font-medium text-navy" title={asset.name}>
            {asset.name}
          </h3>
          <p className="text-[12px] leading-4 text-ink">{assetIssue(asset)}</p>
        </div>
        <UsageChips usage={asset.usage} />
      </div>
    </article>
  );
}
