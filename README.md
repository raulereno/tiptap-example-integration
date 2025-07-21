# Tiptap DOCX Placeholder Demo

A **minimal, fully‑commented example** showing how to use **Tiptap 3** in a Next.js 14 (App Router) + TypeScript project to **import DOCX templates, highlight dynamic placeholders, edit content, autosave drafts, and export the result as a fresh DOCX file**.

> **Goal**: provide a ready‑to‑fork playground you can read line‑by‑line to understand how every piece works.

---

## ✨ Key Features

| Capability                                               | Where to look                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| Import `.docx` from URL or file picker                   | `components/TiptapEditor/TiptapEditor.tsx` (Imports section)  |
| Detect & highlight placeholders (`{{name}}`, `[amount]`) | `VariableHighlightExtension.ts` (custom ProseMirror plugin)   |
| Sidebar navigation for placeholders                      | `pages/edit-document.tsx` (state `placeholders` + sidebar UI) |
| Autosave draft every 6 s                                 | `hooks/useDebounce.ts` + `services/cases.ts`                  |
| Export edited HTML → DOCX                                | `utils/exportToDocx.ts` (browser‑only using `html-docx-js`)   |

---

## 🏗️ Tech Stack

* **Next.js 14** (App Router, React 18, TypeScript)
* **Tiptap 3** + Pro *Import DOCX* extension
* **Tailwind CSS** for styling
* **MUI icons** for toolbar buttons
* **html-docx-js** + **FileSaver.js** for client‑side DOCX re‑generation

---

## 📂 Folder Structure (trimmed)

```
├─ components/
│  ├─ TiptapEditor/
│  │   ├─ TiptapEditor.tsx
│  │   ├─ VariableHighlightExtension.ts
│  │   └─ styles.css
│  └─ Toolbar/
│      └─ TiptapToolbar.tsx
├─ pages/
│  └─ edit-document.tsx
├─ hooks/
│  └─ useDebounce.ts
├─ services/
│  └─ cases.ts        # mocked API helpers
├─ utils/
│  └─ exportToDocx.ts # HTML → DOCX helper
└─ README.md          # you are here
```

---

## 🚀 Getting Started

### 1  Prerequisites

* **Node ≥ 18**
* **pnpm / npm / yarn** latest
* A **Tiptap Cloud** account (free *Start* plan) to obtain a **Pro token** for the Import DOCX extension.

### 2  Clone & Install

```bash
git clone https://github.com/your-handle/tiptap-docx-demo.git
cd tiptap-docx-demo
pnpm install   # or npm i / yarn
```

### 3  Environment variables

Create a `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_TIPTAP_APP_ID=your‑tiptap‑app‑id
TIPTAP_PRO_TOKEN=your‑pro‑token
```

> **Why two vars?** `TIPTAP_PRO_TOKEN` is fetched server‑side (API route) and never shipped to the client; `NEXT_PUBLIC_TIPTAP_APP_ID` *is* public and required by Tiptap Pro.

### 4  Run the dev server

```bash
pnpm dev   # http://localhost:3000
```

Open **`/edit-document?doc=http://example.com/letter.docx`** in the browser, or use the file picker on the page.

### 5  Build for production

```bash
pnpm build && pnpm start
```

---

## 🔍 How It Works (High Level)

1. **`TiptapEditor`** loads core + extra extensions, and conditionally adds *Import DOCX* when the token is valid.
2. If a `docUrl` ending in `.docx` is provided, the editor fetches the file, wraps it in a `File` object and invokes `editor.chain().importDocx()`.
3. A custom **ProseMirror plugin** scans every text node for `/{{.*?}}|\[.*?]/g`, adds `Decoration.inline(...)` to highlight, and emits an array for the sidebar.
4. `edit-document` keeps that array in React state, rendering a clickable list that calls `editor.navigateToPlaceholder(pos)`.
5. A `useDebounce` hook triggers `saveDraft(html)` every 6 seconds.
6. When the user clicks **Download DOCX**, the current HTML is passed to `html-docx-js`, converted, and downloaded with `FileSaver`.

---

## 📝 Scripts

| Command      | Purpose                            |
| ------------ | ---------------------------------- |
| `pnpm dev`   | Start dev server with hot reload   |
| `pnpm build` | Next.js production build           |
| `pnpm start` | Start compiled app (needs `build`) |
| `pnpm lint`  | ESLint + TypeScript checks         |

---

## 🤖 Customization Tips

* **Change placeholder regex** → edit `VariableHighlightExtension.ts`.
* **Add more toolbar items** → extend `components/Toolbar/TiptapToolbar.tsx`.
* **Server‑side DOCX export** → swap `html-docx-js` for a call to LibreOffice / Microsoft Graph in `api/export-docx.ts`.

---

## 📜 License

MIT — use it, fork it, star it. Enjoy! 🚀
