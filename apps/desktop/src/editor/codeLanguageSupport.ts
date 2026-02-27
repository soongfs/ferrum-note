import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { LanguageDescription } from "@codemirror/language";

export const CODE_LANGUAGE_SUPPORTS = [
  LanguageDescription.of({
    name: "python",
    alias: ["py", "python3"],
    support: python()
  }),
  LanguageDescription.of({
    name: "c",
    support: cpp()
  }),
  LanguageDescription.of({
    name: "cpp",
    alias: ["c++", "cxx"],
    support: cpp()
  }),
  LanguageDescription.of({
    name: "javascript",
    alias: ["js"],
    support: javascript()
  }),
  LanguageDescription.of({
    name: "typescript",
    alias: ["ts"],
    support: javascript({ typescript: true })
  }),
  LanguageDescription.of({
    name: "rust",
    support: rust()
  }),
  LanguageDescription.of({
    name: "json",
    support: json()
  })
];
