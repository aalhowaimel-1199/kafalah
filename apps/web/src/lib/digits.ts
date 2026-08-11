// يحوّل الأرقام العربية (٠-٩) والفارسية (۰-۹) إلى إنجليزية، ويُبقي الأرقام فقط.
// يُستخدم لحقول الجوال والهوية حتى لو كانت لوحة المفاتيح عربية، تفادياً للأخطاء.
export function toLatinDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function digitsOnly(input: string): string {
  return toLatinDigits(input).replace(/[^\d]/g, "");
}
