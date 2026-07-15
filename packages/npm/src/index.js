import "./styles/ollow-editor.css";
import { OllowEditorCore } from "./core/ollow-editor.js";

export function createOllowEditor(selector, options = {}) {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!element) {
    throw new Error("OllowEditor target element not found.");
  }

  return new OllowEditorCore(element, options);
}

export { OllowEditorCore };
export default createOllowEditor;
