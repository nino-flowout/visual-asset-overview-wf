"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ScanForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [folderPath, setFolderPath] = useState("");
  const [siteName, setSiteName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [browsing, setBrowsing] = useState(false);

  async function onBrowse() {
    setBrowsing(true);
    setError(null);
    try {
      const response = await fetch("/api/browse", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        folderPath?: string;
        cancelled?: boolean;
      };
      if (!response.ok) {
        setError(payload.error ?? "Could not open the folder picker.");
        return;
      }
      if (payload.folderPath) setFolderPath(payload.folderPath);
    } catch {
      setError("Could not open the folder picker.");
    } finally {
      setBrowsing(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderPath,
          siteName: siteName.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        inventory?: { siteId: string };
      };
      if (!response.ok || !payload.inventory) {
        setError(payload.error ?? "Scan failed.");
        return;
      }
      onCancel();
      router.push(`/?project=${payload.inventory.siteId}`);
      router.refresh();
    } catch {
      setError("Scan failed.");
    } finally {
      setPending(false);
    }
  }

  const field =
    "h-11 w-full border border-mist bg-white px-3.5 text-[14px] leading-[18px] text-navy outline-none placeholder:text-ink";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full bg-foam text-navy"
      aria-labelledby="add-project-title"
    >
      <div className="flex flex-col gap-2 px-8 pt-7">
        <p className="text-[12px] leading-4 font-semibold tracking-[0.08em] text-ink uppercase">
          Projects
        </p>
        <h2
          id="add-project-title"
          className="text-[36px] leading-10 font-bold tracking-[-0.03em]"
        >
          Add project
        </h2>
        <p className="text-[14px] leading-[22px] text-ink">
          Point to a local Webflow export folder. We’ll scan HTML, CSS, JS, and media
          (images, videos, Lottie) to build the inventory.
        </p>
      </div>

      <div className="flex flex-col gap-5 px-8 pt-6">
        <label className="flex flex-col gap-2">
          <span className="text-[12px] leading-4 font-semibold tracking-[0.06em] text-ink uppercase">
            Project name
          </span>
          <input
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
            placeholder="e.g. Atlas Commerce"
            className={field}
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[12px] leading-4 font-semibold tracking-[0.06em] text-ink uppercase">
            Site URL
          </span>
          <input
            name="siteUrl"
            placeholder="optional — https://…"
            className={`${field} font-mono text-[13px]`}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="export-folder"
              className="text-[12px] leading-4 font-semibold tracking-[0.06em] text-ink uppercase"
            >
              Export folder
            </label>
            <span className="text-[12px] leading-4 text-ink">Local Webflow zip/export</span>
          </div>
          <div className="flex gap-2.5">
            <input
              id="export-folder"
              required
              value={folderPath}
              onChange={(event) => setFolderPath(event.target.value)}
              placeholder="/Users/you/exports/northline-studio"
              className={`${field} min-w-0 flex-1 font-mono text-[13px]`}
            />
            <button
              type="button"
              onClick={onBrowse}
              disabled={pending || browsing}
              className="h-11 shrink-0 border border-mist bg-white px-4 text-[14px] leading-[18px] font-semibold text-navy disabled:opacity-60"
            >
              {browsing ? "Opening…" : "Browse…"}
            </button>
          </div>
          <p className="text-[13px] leading-5 text-ink">
            Scans the folder for pages and assets — HTML/CSS/JS references plus images,
            videos, and Lottie files.
          </p>
        </div>

        {error ? (
          <p className="text-[13px] leading-5 text-mark-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3 px-8 py-7">
        <button
          type="button"
          onClick={onCancel}
          className="border border-mist px-[18px] py-3 text-[14px] leading-[18px] font-medium text-navy"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || browsing}
          className="bg-navy px-5 py-3 text-[14px] leading-[18px] font-medium text-foam disabled:opacity-60"
        >
          {pending ? "Scanning…" : "Scan folder"}
        </button>
      </div>
    </form>
  );
}
