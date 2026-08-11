import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FLOORS = [
  { key: "G", nameAr: "الدور G", nameEn: "Floor G", sortOrder: 0 },
  { key: "B1", nameAr: "الدور B1", nameEn: "Floor B1", sortOrder: 1 },
  { key: "B2", nameAr: "الدور B2", nameEn: "Floor B2", sortOrder: 2 },
];

const REASONS = [
  { nameAr: "اجتماع عمل", nameEn: "Business meeting", sortOrder: 0 },
  { nameAr: "مقابلة", nameEn: "Interview", sortOrder: 1 },
  { nameAr: "توريد / مورد", nameEn: "Supplier", sortOrder: 2 },
  { nameAr: "صيانة", nameEn: "Maintenance", sortOrder: 3 },
  { nameAr: "زيارة رسمية", nameEn: "Official visit", sortOrder: 4 },
  { nameAr: "أخرى", nameEn: "Other", sortOrder: 5 },
];

const TEMPLATES = {
  REQUEST_RECEIVED: {
    subjectAr: "تم استلام طلب زيارتك — كفالة",
    bodyAr:
      "مرحباً {visitorName},\nتم استلام طلب زيارتك رقم {requestNo}. سنخبرك فور اعتماده.\nمتابعة الحالة: {trackUrl}\n\nبرنامج كفالة لضمان التمويل",
  },
  APPROVED: {
    subjectAr: "تمت الموافقة على زيارتك — كفالة",
    bodyAr:
      "مرحباً {visitorName},\nتمت الموافقة على زيارتك رقم {requestNo}.\nالأدوار المسموحة: {floors}\nوقت الدخول: {entryWindow}\nباركود الدخول والخروج مرفق، أبرزه على قارئ البوابة.\nالرمز: {barcode}\n\nبرنامج كفالة لضمان التمويل",
  },
  INVITATION: {
    subjectAr: "دعوة زيارة — كفالة",
    bodyAr:
      "مرحباً {visitorName},\nأنت مدعو لزيارة كفالة.\nالأدوار المسموحة: {floors}\nوقت الدخول: {entryWindow}\nباركود الدخول والخروج مرفق، أبرزه على قارئ البوابة.\nالرمز: {barcode}\n\nبرنامج كفالة لضمان التمويل",
  },
};

async function main() {
  for (const f of FLOORS) {
    await prisma.floor.upsert({ where: { key: f.key }, update: { nameAr: f.nameAr, nameEn: f.nameEn, sortOrder: f.sortOrder }, create: f });
  }

  const existingReasons = await prisma.visitReason.count();
  if (existingReasons === 0) {
    for (const r of REASONS) await prisma.visitReason.create({ data: r });
  }

  await prisma.setting.upsert({
    where: { key: "smtp" },
    update: {},
    create: { key: "smtp", value: { host: "", port: 587, secure: true, user: "", pass: "", from: "" } },
  });
  await prisma.setting.upsert({
    where: { key: "biotime" },
    update: {},
    create: { key: "biotime", value: { baseUrl: "", username: "", password: "", simulation: true } },
  });
  await prisma.setting.upsert({
    where: { key: "templates" },
    update: {},
    create: { key: "templates", value: TEMPLATES },
  });

  console.log(`Seed done: ${FLOORS.length} floors, reasons, settings.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
