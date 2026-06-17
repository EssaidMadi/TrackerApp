declare module 'adm-zip' {
  interface IZipEntry {
    isDirectory: boolean;
    entryName: string;
    getData(): Buffer;
  }

  export default class AdmZip {
    constructor(buffer?: Buffer | string);
    getEntries(): IZipEntry[];
    addFile(entryPath: string, data: Buffer): void;
    toBuffer(): Buffer;
  }
}
