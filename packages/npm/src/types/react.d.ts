import type { ComponentType } from "react";
import type { OllowEditorUploadImage } from "./index";

export interface OllowEditorReactProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  uploadImage?: OllowEditorUploadImage;
  readOnly?: boolean;
  className?: string;
}

export declare const OllowEditor: ComponentType<OllowEditorReactProps>;
export default OllowEditor;
