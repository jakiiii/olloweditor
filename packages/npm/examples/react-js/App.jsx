import { useState } from "react";
import { OllowEditor } from "@codefortify/olloweditor/react";
import "@codefortify/olloweditor/style.css";

export default function App() {
  const [content, setContent] = useState("");

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/uploads/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
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
