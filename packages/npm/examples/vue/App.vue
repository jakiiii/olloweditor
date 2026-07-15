<script setup>
import createOllowEditor from "@codefortify/olloweditor";
import "@codefortify/olloweditor/style.css";
import { onMounted } from "vue";

onMounted(() => {
  createOllowEditor("#editor", {
    placeholder: "Start writing...",
  });
});
</script>

<template>
  <textarea id="editor" name="body" data-nw-editor />
</template>
