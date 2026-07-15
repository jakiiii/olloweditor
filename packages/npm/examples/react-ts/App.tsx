import { useState } from "react";
import {
  OllowEditor,
  type OllowEditorReactProps,
} from "@codefortify/olloweditor/react";
import "@codefortify/olloweditor/style.css";

export default function App() {
  const [content, setContent] = useState<string>("");

  const uploadImage: OllowEditorReactProps["uploadImage"] = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/uploads/image", {
      method: "POST",
      body: formData,
    });

    const data: { url: string } = await response.json();
    return data.url;
  };

  return (
    <OllowEditor
      value={content}
      onChange={setContent}
      placeholder="Write your article..."
      uploadImage={uploadImage}
    />
  );
}
