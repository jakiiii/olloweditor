import {
  createOllowEditor,
  type OllowEditorOptions,
} from "@codefortify/olloweditor";
import "@codefortify/olloweditor/style.css";

const options: OllowEditorOptions = {
  initialHTML: "<p>Hello TypeScript</p>",
  placeholder: "Write something...",
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/uploads/image", {
      method: "POST",
      body: formData,
    });

    const data: { url: string } = await response.json();
    return data.url;
  },
  onChange: (html: string) => {
    console.log(html);
  },
};

createOllowEditor("#editor", options);
