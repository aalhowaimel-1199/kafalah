declare module "bwip-js" {
  interface ToBufferOptions {
    bcid: string;
    text: string;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    textyalign?: string;
    [key: string]: unknown;
  }
  const bwipjs: {
    toBuffer(options: ToBufferOptions): Promise<Buffer>;
  };
  export default bwipjs;
}
