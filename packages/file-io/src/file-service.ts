export interface FileOpenResult {
  name: string;
  content: string;
}

export interface FileService {
  openFile(): Promise<FileOpenResult | null>;
  saveFile(name: string, content: string): Promise<boolean>;
  exportImage(blob: Blob, name: string): Promise<boolean>;
}
