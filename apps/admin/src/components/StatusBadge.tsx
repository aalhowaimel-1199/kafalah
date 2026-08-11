import { useTranslation } from "react-i18next";

const styles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-200 text-gray-600",
  CANCELLED: "bg-gray-200 text-gray-600",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${styles[status] ?? "bg-gray-100"}`}>
      {t(`status.${status}`)}
    </span>
  );
}
