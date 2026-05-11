declare module "gif-encoder-2" {
  class GIFEncoder {
    constructor(width: number, height: number, algorithm?: string);
    setDelay(ms: number): void;
    setRepeat(count: number): void;
    setQuality(quality: number): void;
    start(): void;
    addFrame(data: any): void;
    finish(): void;
    out: { getData(): Buffer };
  }
  export default GIFEncoder;
}
