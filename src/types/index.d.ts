export type OllowEditorSelector = string | HTMLElement;

export interface OllowEditorOptions {
  initialHTML?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  onChange?: (html: string) => void;
  uploadImage?: (file: File) => Promise<string> | string;
  [key: string]: unknown;
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

export interface OllowEditorApi {
  registerPlugin(name: string, factory: (editor: Record<string, unknown>, options: Record<string, unknown>) => unknown): unknown;
  initAll(root?: ParentNode | Document, options?: OllowEditorOptions): Record<string, unknown>[];
  init(target: string | HTMLTextAreaElement, options?: OllowEditorOptions): Record<string, unknown> | null;
  get(target: string | HTMLTextAreaElement): Record<string, unknown> | null;
  instances(): Record<string, unknown>[];
}

export declare const OllowEditor: OllowEditorApi;
export declare const NationWireEditor: OllowEditorApi;

export default OllowEditor;
