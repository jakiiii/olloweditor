export interface OllowEditorOptions {
  initialHTML?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  onChange?: ((html: string) => void) | undefined;
  uploadImage?: ((file: File) => Promise<string> | string) | undefined;
}

export interface OllowEditorCore {
  getHTML(): string;
  setHTML(html: string): void;
  focus(): void;
  destroy(): void;
}

export declare function createOllowEditor(
  selector: string | HTMLElement,
  options?: OllowEditorOptions,
): OllowEditorCore;

export default createOllowEditor;
