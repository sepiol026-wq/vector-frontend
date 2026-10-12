export type DiffLine = {
  type: "add" | "remove" | "same";
  text: string;
  oldNum?: number;
  newNum?: number;
  noNewline?: boolean;
  parts?: { text: string; changed: boolean }[];
};

export type DiffHunk = { header: string; rows: DiffLine[] };

export type DiffResult = { add: number; remove: number; hunks: DiffHunk[]; truncated: boolean };

export function revisionNumber(value: unknown): number | null {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647
    ? Number(value) : null;
}