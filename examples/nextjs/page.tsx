"use client";

import { useState } from "react";
import { OllowEditor } from "@codefortify/olloweditor/react";
import "@codefortify/olloweditor/style.css";

export default function Page() {
  const [content, setContent] = useState<string>("");

  return (
    <OllowEditor
      value={content}
      onChange={setContent}
      placeholder="Write your article..."
    />
  );
}
