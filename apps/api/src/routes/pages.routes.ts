import { Hono } from "hono";
import { pageService } from "../services/page.service";

export const pagesRoutes = new Hono();

// قائمة الصفحات المنشورة (لتذييل الموقع)
pagesRoutes.get("/", async (c) => c.json(await pageService.listPublished()));

// محتوى صفحة منشورة
pagesRoutes.get("/:id", async (c) => {
  const page = await pageService.getPublished(c.req.param("id")!);
  if (!page) return c.json({ error: "not_found" }, 404);
  return c.json(page);
});
