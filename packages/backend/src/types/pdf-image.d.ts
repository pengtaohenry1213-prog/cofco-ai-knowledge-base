declare module 'pdf-image' {
  class PDFImage {
    constructor(pdfPathOrBuffer: string | Buffer, options?: {
      convertOptions?: Record<string, string>;
      outputDirectory?: string;
      pdfFileBaseName?: string;
    });

    convertFile(): Promise<string[]>;
    setOutputDirectory(outputDirectory: string): void;
  }

  export { PDFImage };
}
