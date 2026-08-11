import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { gateSchema } from "@ramh/shared";
import { PageHead, Toggle } from "../../components/ui";
import { api } from "../../lib/api";

type Biotime = { baseUrl: string; username: string; password: string; simulation: boolean };
type Floor = { key: string; nameAr: string; nameEn: string };
type Gate = { id: string; code: string; nameAr: string; nameEn: string; floorKey: string; isExit: boolean };

export function BiotimeSettings() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [cfg, setCfg] = useState<Biotime>({ baseUrl: "", username: "", password: "", simulation: true });
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [gate, setGate] = useState({ code: "", nameAr: "", floorKey: "G", isExit: false });
  const [msg, setMsg] = useState("");

  const loadGates = () => api.get<Gate[]>("/api/admin/gates").then(setGates);
  useEffect(() => {
    api.get<Biotime>("/api/admin/settings/biotime").then(setCfg);
    api.get<Floor[]>("/api/admin/floors").then(setFloors);
    loadGates();
  }, []);

  async function save() { await api.put("/api/admin/settings/biotime", cfg); setMsg("تم حفظ إعدادات BioTime."); }
  async function test() { setStatus(await api.get("/api/admin/settings/biotime/status")); }
  async function addGate() {
    const parsed = gateSchema.safeParse({ ...gate, nameEn: gate.nameAr });
    if (!parsed.success) { setMsg("أكمل بيانات البوابة"); return; }
    await api.post("/api/admin/gates", parsed.data);
    setGate({ code: "", nameAr: "", floorKey: "G", isExit: false });
    loadGates();
  }
  async function delGate(id: string) { await api.del(`/api/admin/gates/${id}`); loadGates(); }

  return (
    <div>
      <PageHead title={t("admin.device")} />
      {msg && <p className="mb-4 rounded-[10px] border border-[#d3e9ea] bg-soft p-2.5 text-[13px] font-bold text-cyan-600">{msg}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card grid gap-3 p-6">
          <h3 className="text-[16px] font-extrabold text-navy">{t("admin.biotimeTitle")}</h3>
          <div><label className="label">{t("admin.biotimeUrl")}</label><input className="input" dir="ltr" placeholder="https://biotime.kafalah.sa" value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t("admin.username")}</label><input className="input" dir="ltr" value={cfg.username} onChange={(e) => setCfg({ ...cfg, username: e.target.value })} /></div>
            <div><label className="label">{t("admin.password")}</label><input type="password" className="input" dir="ltr" value={cfg.password} onChange={(e) => setCfg({ ...cfg, password: e.target.value })} /></div>
          </div>
          <div className="flex items-center justify-between"><span className="text-sm font-bold">{t("admin.simulation")}</span><Toggle on={cfg.simulation} onChange={(v) => setCfg({ ...cfg, simulation: v })} /></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{t("admin.connStatus")}</span>
            <span className={`badge ${status ? (status.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700") : "bg-[#eef1f5] text-[#475569]"}`}>{status ? status.message : t("admin.notConfigured")}</span>
          </div>
          <div className="flex gap-2"><button onClick={test} className="btn-ghost flex-1">{t("admin.testConn")}</button><button onClick={save} className="btn-primary flex-1">{t("common.save")}</button></div>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 text-[16px] font-extrabold text-navy">{t("admin.floorsGates")}</h3>
          <div className="divide-y divide-line">
            {gates.length === 0 && <p className="py-2 text-sm text-slate">{t("admin.empty")}</p>}
            {gates.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>{isAr ? g.nameAr : g.nameEn} <span className="text-slate">· {g.floorKey} · {g.isExit ? t("admin.gateExit") : t("admin.gateEntry")}</span></span>
                <button onClick={() => delGate(g.id)} className="text-xs font-bold text-red-600">{t("common.delete")}</button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="code" dir="ltr" value={gate.code} onChange={(e) => setGate({ ...gate, code: e.target.value })} />
              <input className="input" placeholder={t("admin.addGate")} value={gate.nameAr} onChange={(e) => setGate({ ...gate, nameAr: e.target.value })} />
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <select className="input" value={gate.floorKey} onChange={(e) => setGate({ ...gate, floorKey: e.target.value })}>
                {floors.map((f) => <option key={f.key} value={f.key}>{isAr ? f.nameAr : f.nameEn}</option>)}
              </select>
              <select className="input" value={gate.isExit ? "1" : "0"} onChange={(e) => setGate({ ...gate, isExit: e.target.value === "1" })}>
                <option value="0">{t("admin.gateEntry")}</option><option value="1">{t("admin.gateExit")}</option>
              </select>
              <button onClick={addGate} className="btn-primary btn-sm">{t("common.add")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
