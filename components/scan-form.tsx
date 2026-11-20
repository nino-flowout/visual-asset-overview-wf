"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ScanForm() {
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
      router.push(`/?project=${payload.inventory.siteId}`);
      router.refresh();
    } catch {
      setError("Scan failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_16rem_auto]">
      <div className="grid gap-1 text-sm font-medium text-zinc-700">
        <label htmlFor="export-folder">Export folder</label>
        <div className="flex gap-2">
          <input
            id="export-folder"
            required
            value={folderPath}
            onChange={(event) => setFolderPath(event.target.value)}
            placeholder="/absolute/path/to/webflow-export"
            className="h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 font-normal text-zinc-950"
          />
          <button
            type="button"
            onClick={onBrowse}
            disabled={pending || browsing}
            className="h-11 shrink-0 rounded-md border border-zinc-300 bg-white px-4 font-medium text-zinc-950 disabled:opacity-60"
          >
            {browsing ? "Choosing…" : "Browse"}
          </button>
        </div>
      </div>
      <label className="grid gap-1 text-sm font-medium text-zinc-700">
        Site name
        <input
          value={siteName}
          onChange={(event) => setSiteName(event.target.value)}
          placeholder="Optional"
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 font-normal text-zinc-950"
        />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending || browsing}
          className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Scanning…" : "Scan folder"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-700 sm:col-span-3" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
