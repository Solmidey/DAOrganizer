import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PUBLIC_PROPOSAL_FIELDS = [
  "id",
  "title",
  "description",
  "startsAt",
  "endsAt",
  "quorum",
  "threshold"
] as const;

export type ValueOf<T> = T[keyof T];

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function parseNumber(value: string | number | null | undefined) {
  if (!value) return 0;
  const numeric = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : 0;
}
