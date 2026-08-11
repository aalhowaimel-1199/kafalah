import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";

type Page = { id: string; titleAr: string; titleEn: string; contentAr: string; contentEn: string };

export function PageView() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [page, setPage] = useState<Page | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setPage(null);
    setNotFound(false);
    api.get<Page>(`/api/pages/${id}`).then(setPage).catch(() => setNotFound(true));
  }, [id]);

  if (notFound)
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center font-bold text-slate">{t("common.notFound")}</div>;
  if (!page)
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-slate">{t("common.loading")}</div>;

  const title = isAr ? page.titleAr : page.titleEn;
  const content = isAr ? page.contentAr : page.contentEn;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-5 text-[26px] font-extrabold text-navy">{title}</h1>
      {content ? (
        <div className="whitespace-pre-wrap text-[15.5px] leading-8 text-ink">{content}</div>
      ) : (
        <p className="text-slate">—</p>
      )}
    </div>
  );
}
