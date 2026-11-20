import path from "node:path";
import { createLocalJsonStore } from "@/lib/store/local-json";
import type { ProjectStore } from "@/lib/store/types";

const directory = path.join(process.cwd(), "data", "projects");

let store: ProjectStore | undefined;

export function getProjectStore(): ProjectStore {
  store ??= createLocalJsonStore(directory);
  return store;
}
