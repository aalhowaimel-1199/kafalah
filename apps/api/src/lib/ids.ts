import { randomBytes } from "node:crypto";

export function generateRequestNo(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `RV-${year}-${rand}`;
}

export function generateCardNumber(): string {
  const t = Date.now().toString().slice(-7);
  const r = Math.floor(100 + Math.random() * 899).toString();
  return `${t}${r}`;
}
