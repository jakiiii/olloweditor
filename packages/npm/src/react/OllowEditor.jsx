import { useEffect, useRef } from "react";
import { createOllowEditor } from "../index.js";

export function OllowEditor({
  value = "",
  onChange,
  placeholder,
  uploadImage,
  readOnly = false,
  className,
}) {
  const elementRef = useRef(null);
  const editorRef = useRef(null);
  const lastHtmlRef = useRef(typeof value === "string" ? value : "");
  const isSyncingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!elementRef.current) {
      return undefined;
    }

    const editor = createOllowEditor(elementRef.current, {
      initialHTML: typeof value === "string" ? value : "",
      placeholder,
      readOnly,
      className,
      uploadImage,
      onChange(html) {
        lastHtmlRef.current = html;
        if (isSyncingRef.current) {
          return;
        }
        if (typeof onChangeRef.current === "function") {
          onChangeRef.current(html);
        }
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const nextValue = typeof value === "string" ? value : "";
    if (!editor || nextValue === lastHtmlRef.current) {
      return;
    }

    isSyncingRef.current = true;
    editor.setHTML(nextValue);
    lastHtmlRef.current = editor.getHTML();
    isSyncingRef.current = false;
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.options = Object.assign({}, editor.options, {
      placeholder,
      readOnly,
      className,
      uploadImage,
    });
  }, [placeholder, readOnly, className, uploadImage]);

  return <div ref={elementRef} className={className} />;
}

export default OllowEditor;
