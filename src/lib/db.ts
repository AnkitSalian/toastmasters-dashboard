import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureFile(file: string, fallback: unknown) {
  const filePath = path.join(DATA_DIR, file);
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf-8");
  }
  return filePath;
}

export async function readData<T>(file: string, fallback: T): Promise<T> {
  const filePath = await ensureFile(file, fallback);
  const raw = await fs.readFile(filePath, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeData<T>(file: string, data: T): Promise<void> {
  const filePath = await ensureFile(file, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

const fileLocks = new Map<string, Promise<unknown>>();

/**
 * Serializes read-modify-write access to a single data file so concurrent
 * requests (e.g. rapid clicks each firing a PUT) can't race and clobber
 * each other's changes. The mutator receives the current contents and
 * returns the new contents, which are written before the lock releases.
 */
export async function withFileLock<T>(file: string, fallback: T, mutator: (current: T) => T | Promise<T>): Promise<T> {
  const previous = fileLocks.get(file) ?? Promise.resolve();
  const run = previous.catch(() => {}).then(async () => {
    const current = await readData<T>(file, fallback);
    const next = await mutator(current);
    await writeData(file, next);
    return next;
  });
  fileLocks.set(file, run);
  return run;
}
