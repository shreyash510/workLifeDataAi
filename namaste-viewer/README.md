# Namaste Work.Life Viewer

A local React + Vite reader for the `namaste-worklife` tutorial. It reads the Blogger
post fragments straight from disk and renders them with the same look as
`blogger-template` (fonts, colours, tables, code blocks, night mode).

```bash
npm install
npm run dev          # opens http://localhost:5180
```

- **Left nav**: seasons and chapters, parsed from `index.html`. Orange dot = linked
  in the index but the file is not written yet; `NEW` = a file on disk that the index
  doesn't link to yet.
- **Lab data**: every `.csv` in the folder opens as a sortable, filterable table.
- **Live**: save, add or delete any file in the tutorial folder and the page refreshes.
- **Open in VS Code** link on every page jumps to the source file.

The tutorial folder defaults to `../namaste-worklife`. To point it somewhere else:

```bash
CONTENT_DIR=C:/path/to/folder npm run dev                     # bash
$env:CONTENT_DIR="C:\path\to\folder"; npm run dev             # PowerShell
```

This is a dev-time tool: `npm run preview` also serves the folder, but a static
`npm run build` does not bundle the tutorial content.
