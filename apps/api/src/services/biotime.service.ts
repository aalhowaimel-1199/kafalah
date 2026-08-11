import { settingsService } from "./settings.service";

export type BioGate = { code: string; nameAr: string; biotimeDoorId: string | null; isExit: boolean };
export type EnrollInput = {
  cardNumber: string;
  barcode: string;
  visitorName: string;
  floorKeys: string[];
  gates: BioGate[];
  entryFrom: Date;
  entryTo: Date;
};
export type SyncResult = { target: string; ok: boolean; message: string };
export type BioMovement = { card: string; doorId: string | null; direction: "IN" | "OUT"; at: Date };

async function token(baseUrl: string, username: string, password: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`auth ${res.status}`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("no token");
  return data.token;
}

export const biotimeService = {
  async status(): Promise<{ ok: boolean; simulation: boolean; message: string }> {
    const cfg = await settingsService.getBiotime();
    if (cfg.simulation) return { ok: true, simulation: true, message: "محاكاة" };
    if (!cfg.baseUrl) return { ok: false, simulation: false, message: "غير مهيّأ" };
    try {
      await token(cfg.baseUrl, cfg.username, cfg.password);
      return { ok: true, simulation: false, message: "متصل" };
    } catch (e) {
      return { ok: false, simulation: false, message: (e as Error).message };
    }
  },

  async enroll(input: EnrollInput): Promise<SyncResult[]> {
    const cfg = await settingsService.getBiotime();
    if (cfg.simulation || !cfg.baseUrl) {
      const scope = input.floorKeys.length ? input.floorKeys.join("، ") : input.gates.map((g) => g.code).join("، ");
      return [{ target: "BioTime", ok: true, message: `(محاكاة) سُجّل ${input.visitorName} — كارت ${input.cardNumber} — ${scope}` }];
    }
    try {
      const t = await token(cfg.baseUrl, cfg.username, cfg.password);
      const res = await fetch(`${cfg.baseUrl}/personnel/api/employees/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `JWT ${t}` },
        body: JSON.stringify({
          emp_code: input.cardNumber,
          first_name: input.visitorName.slice(0, 24),
          card_no: input.barcode,
          hire_date: input.entryFrom.toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) return [{ target: "BioTime", ok: false, message: `فشل التسجيل (${res.status})` }];
      return [{ target: "BioTime", ok: true, message: "سُجّل الزائر على BioTime" }];
    } catch (e) {
      return [{ target: "BioTime", ok: false, message: (e as Error).message }];
    }
  },

  async revoke(cardNumber: string): Promise<SyncResult[]> {
    const cfg = await settingsService.getBiotime();
    if (cfg.simulation || !cfg.baseUrl) return [{ target: "BioTime", ok: true, message: `(محاكاة) أُلغي الكارت ${cardNumber}` }];
    try {
      const t = await token(cfg.baseUrl, cfg.username, cfg.password);
      await fetch(`${cfg.baseUrl}/personnel/api/employees/?emp_code=${cardNumber}`, {
        method: "DELETE",
        headers: { Authorization: `JWT ${t}` },
      });
      return [{ target: "BioTime", ok: true, message: "أُلغي التصريح" }];
    } catch (e) {
      return [{ target: "BioTime", ok: false, message: (e as Error).message }];
    }
  },

  async fetchMovements(since: Date): Promise<BioMovement[]> {
    const cfg = await settingsService.getBiotime();
    if (cfg.simulation || !cfg.baseUrl) return [];
    try {
      const t = await token(cfg.baseUrl, cfg.username, cfg.password);
      const res = await fetch(`${cfg.baseUrl}/iclock/api/transactions/?start_time=${since.toISOString()}`, {
        headers: { Authorization: `JWT ${t}` },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: Array<Record<string, unknown>> };
      return (data.data ?? []).map((r) => ({
        card: String(r.emp_code ?? r.card_no ?? ""),
        doorId: r.terminal_sn ? String(r.terminal_sn) : null,
        direction: String(r.punch_state) === "1" ? "OUT" : "IN",
        at: new Date(String(r.punch_time ?? r.upload_time ?? Date.now())),
      }));
    } catch {
      return [];
    }
  },
};
