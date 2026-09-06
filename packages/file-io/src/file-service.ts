export interface FileOpenResult {
  name: string;
  content: string;
  path?: string;
}

export interface FileSaveResult {
  name: string;
  path?: string;
}

export interface FileService {
  openFile(): Promise<FileOpenResult | null>;
  saveFile(name: string, content: string, path?: string): Promise<FileSaveResult | null>;
  exportImage(blob: Blob, name: string): Promise<boolean>;
}
