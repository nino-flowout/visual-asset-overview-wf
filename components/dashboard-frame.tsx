"use client";

import Link from "next/link";
import { useState } from "react";
import { ScanForm } from "@/components/scan-form";
import { inventoryHref } from "@/components/view-toggle";
import type { ProjectSummary } from "@/lib/store/types";

export function DashboardFrame({
  projects,
  activeId,
  view,
  children,
}: {
  projects: ProjectSummary[];
  activeId?: string;
  view: "list" | "grid";
  children: React.ReactNode;
}) {
  const [railOpen, setRailOpen] = useState(true);
  const [adding, setAdding] = useState(false);

  return (
    <div className="relative min-h-screen bg-[linear-gradient(165deg,#F7FAFC_0%,#E6EDF2_42%,#D5E2EB_100%)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[260px] -left-[180px] size-[720px] rounded-full bg-[radial-gradient(circle,#FFFFFFB3_0%,transparent_70%)]" />
        <div className="absolute top-[120px] -right-[120px] size-[560px] rounded-full bg-[radial-gradient(circle,#0B1F3314_0%,transparent_70%)]" />
        <div className="absolute -bottom-[160px] left-[38%] size-[420px] rounded-full bg-[radial-gradient(circle,#1F7A4D12_0%,transparent_72%)]" />
      </div>

      <div className="relative flex min-h-screen">
        {railOpen ? (
          <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col gap-7 bg-navy/96 px-[18px] py-6 text-foam">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-foam" />
                <span className="text-[12px] leading-4 font-semibold tracking-[0.08em] text-mist uppercase">
                  Projects
                </span>
              </span>
              <button
                type="button"
                onClick={() => setRailOpen(false)}
                aria-label="Collapse projects"
                className="flex size-7 items-center justify-center border border-mist/35 text-[14px] leading-[18px] text-foam"
              >
                ‹
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
              {projects.map((project) => {
                const active = project.siteId === activeId;
                return (
                  <Link
                    key={project.siteId}
                    href={inventoryHref(project.siteId, view)}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col gap-2 border-l-[3px] px-3 py-3.5 ${
                      active
                        ? "border-foam bg-foam/12"
                        : "border-transparent hover:bg-foam/6"
                    }`}
                  >
                    <span
                      className={`truncate text-[14px] leading-[18px] ${
                        active ? "font-semibold text-foam" : "font-medium text-mist"
                      }`}
                    >
                      {project.siteName}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Dot color="#C23B2A" />
                      <Dot color="#C99212" />
                      <Dot color="#1F7A4D" />
                      <span
                        className={`font-mono text-[11px] leading-[14px] ${
                          active ? "text-mist" : "text-mist/70"
                        }`}
                      >
                        {project.counts.red} · {project.counts.yellow} · {project.counts.green}
                      </span>
                    </span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-1 inline-flex items-center gap-2 border border-dashed border-mist/45 px-3 py-3 text-left"
              >
                <span className="text-[16px] leading-5 font-medium text-foam">+</span>
                <span className="text-[13px] leading-4 font-medium text-foam">Add project</span>
              </button>
            </div>

            <p className="font-mono text-[11px] leading-[14px] text-mist/55">
              {projectCountLabel(projects.length)}
            </p>
          </aside>
        ) : (
          <aside className="sticky top-0 flex h-screen w-14 shrink-0 flex-col items-center gap-5 bg-navy/96 py-5">
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              aria-label="Expand projects"
              className="flex size-7 items-center justify-center border border-mist/35 text-[14px] leading-[18px] text-foam"
            >
              ›
            </button>
            <div className="flex flex-col items-center gap-2.5">
              {projects.map((project) => (
                <Link
                  key={project.siteId}
                  href={inventoryHref(project.siteId, view)}
                  aria-label={project.siteName}
                  aria-current={project.siteId === activeId ? "page" : undefined}
                  className={`size-2.5 rounded-full ${
                    project.siteId === activeId ? "bg-foam" : "bg-mist/35"
                  }`}
                />
              ))}
            </div>
          </aside>
        )}

        <div className="dashboard-main relative min-w-0 flex-1">{children}</div>
      </div>

      {adding ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-navy/48 p-6">
          <button
            type="button"
            aria-label="Close add project"
            className="absolute inset-0 cursor-default"
            onClick={() => setAdding(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-project-title"
            className="relative z-10 w-full max-w-[660px]"
          >
            <ScanForm onCancel={() => setAdding(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function projectCountLabel(count: number): string {
  if (count === 0) return "No Webflow projects";
  if (count === 1) return "1 Webflow project";
  return `${count} Webflow projects`;
}
