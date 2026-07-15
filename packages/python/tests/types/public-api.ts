import {
  createOllowEditor,
  OllowEditorCore,
  OllowEditorOptions
} from "@codefortify/olloweditor";

const target = document.createElement("textarea");

const options: OllowEditorOptions = {
  placeholder: "Start writing",
  readOnly: false,
  onChange(html: string) {
    html.toUpperCase();
  }
};

const editor: OllowEditorCore = createOllowEditor(target, options);

editor.focus();
editor.setHTML("<p>Hello</p>");
editor.getHTML();
editor.destroy();
