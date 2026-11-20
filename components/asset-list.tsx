import { assetIssue } from "@/lib/asset-label";
import { formatBytes } from "@/lib/format";
import type { Asset } from "@/lib/inventory";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  TYPE_CODE,
  TYPE_LABEL,
  assetSwatch,
} from "@/components/asset-visual";
import { UsageChips } from "@/components/usage-chips";

export function AssetList({ assets }: { assets: Asset[] }) {
  return (
    <div className="min-w-[760px]">
      <div className="flex items-center gap-4 border-b border-mist pb-3 text-[11px] leading-[14px] font-semibold tracking-[0.08em] text-ink uppercase">
        <span className="w-[72px] shrink-0" />
        <span className="w-[280px] shrink-0">Asset</span>
        <span className="w-[72px] shrink-0">Type</span>
        <span className="w-[88px] shrink-0">Size</span>
        <span className="w-[96px] shrink-0">Status</span>
        <span className="min-w-0 flex-1">Usage</span>
      </div>
      <ul>
        {assets.map((asset) => (
          <AssetListRow key={asset.id} asset={asset} />
        ))}
      </ul>
    </div>
  );
}

function AssetListRow({ asset }: { asset: Asset }) {
  const swatch = assetSwatch(asset.name, asset.type, asset.status);
  return (
    <li className="flex items-center gap-4 border-b border-[#C5D3DE] py-3.5">
      <span
        className="flex h-[52px] w-[72px] shrink-0 items-center justify-center font-mono text-[10px] leading-3 tracking-[0.06em]"
        style={{ backgroundColor: swatch.bg, color: swatch.fg }}
      >
        {TYPE_CODE[asset.type]}
      </span>
      <span className="flex w-[280px] shrink-0 flex-col gap-0.5">
        <span className="truncate text-[14px] leading-[18px] font-medium text-navy" title={asset.name}>
          {asset.name}
        </span>
        <span className="text-[12px] leading-4 text-ink">{assetIssue(asset)}</span>
      </span>
      <span className="w-[72px] shrink-0 text-[13px] leading-4 text-ink">{TYPE_LABEL[asset.type]}</span>
      <span className="w-[88px] shrink-0 font-mono text-[13px] leading-4 text-navy">
        {formatBytes(asset.sizeBytes)}
      </span>
      <span className="flex w-[96px] shrink-0 items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: STATUS_COLOR[asset.status] }}
        />
        <span
          className="text-[13px] leading-4 font-medium"
          style={{ color: STATUS_COLOR[asset.status] }}
        >
          {STATUS_LABEL[asset.status]}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <UsageChips usage={asset.usage} />
      </span>
    </li>
  );
}
