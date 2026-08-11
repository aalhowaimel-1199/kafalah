import bwipjs from "bwip-js";

export async function barcodePng(value: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: "qrcode",
    text: value,
    scale: 4,
  });
}

export async function barcodeDataUrl(value: string): Promise<string> {
  const buf = await barcodePng(value);
  return `data:image/png;base64,${buf.toString("base64")}`;
}
