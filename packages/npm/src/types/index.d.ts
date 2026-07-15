export type OllowEditorSelector = string | HTMLElement;
export type OllowEditorUploadImage = (file: File) => Promise<string> | string;

export interface OllowEditorOptions {
  initialHTML?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  onChange?: (html: string) => void;
  uploadImage?: OllowEditorUploadImage;
}

export declare class OllowEditorCore {
  constructor(element: HTMLElement, options?: OllowEditorOptions);

  getHTML(): string;
  setHTML(html: string): void;
  focus(): void;
  destroy(): void;
}

export declare function createOllowEditor(
  selector: OllowEditorSelector,
  options?: OllowEditorOptions
): OllowEditorCore;
