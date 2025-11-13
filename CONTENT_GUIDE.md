# Content Management Guide

> ⚠️ Licensing reminder: all assets fall under the [Lum.bio Personal Source License](./LICENSE.md). Images, copy, and JSON data are for running this site only—do not redistribute or commercialise them.

## 🚀 Quick Start

1. **Add files to the content tree**
   - Images → `public/content/homepage/` (or any subfolder)
   - Text (`.txt`/`.md`) → `public/content/homepage/`
   - New folders → create them directly under `public/content/homepage/`
2. **Sync files into structured JSON**
   ```bash
   npm run cms
   ```
3. **Done!**  
   If `npm run dev` is running, Vite will pick up the regenerated data automatically—no server restart required.

---

## 📁 Directory Layout

```
public/content/homepage/
├── About.txt              # Standalone page
├── Contact.txt            # Standalone page
├── featured/              # Folder displayed on the site
│   ├── metadata.json      # Optional folder configuration
│   └── image1.jpg         # Artwork file
└── sketches/
    ├── 2025/              # Nested folders are supported
    │   └── sketch.png
    └── metadata.json
```

---

## 🎨 Configuring `metadata.json`

Place a `metadata.json` file inside any folder to customise its label and items:

```json
{
  "folder": {
    "name": "Featured Works",
    "description": "Pieces I’m excited about",
    "order": 1
  },
  "items": {
    "image1.jpg": {
      "title": "Character Design",
      "description": "Original character exploration",
      "date": "2025-01-15",
      "tags": ["character", "original"],
      "order": 1
    }
  }
}
```

### Field reference

**folder**
- `name` – Display name (defaults to folder name)
- `description` – Short blurb shown in the UI
- `order` – Sorting weight (lower numbers appear first)

**items**
- `title` – Artwork/page title (defaults to filename)
- `description` – Optional caption
- `date` – ISO date (`YYYY-MM-DD`)
- `tags` – Array of strings
- `order` – Per-folder ordering weight

---

## 📝 Supported File Types

- Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`
- Text: `.txt` (rendered as text files), `.md` (converted to plain text)

---

## 🔄 Frequently Used Commands

| Command | Purpose |
| --- | --- |
| `npm run cms` | Scan `public/content/`, rebuild JSON, aggregate data |
| `npm run sync` | Alias of `npm run cms` |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build (automatically runs the CMS pipeline) |

---

## 💡 Tips & Best Practices

1. **Automatic sorting**
   - Folders default to reverse alphabetical order (Z→A) so newer folders appear first.
   - Images default to newest-first based on `date`.
   - Text items fall back to alphabetical order.

2. **Meaningful filenames**
   - Filenames become fallback titles. Prefer descriptive names like `2025-01-15-character-design.jpg` or `About.txt`.

3. **Flexible hierarchy**
   - Nest folders as deeply as you need. Every level will be indexed automatically.
   - You can mix folders, text files, and images at any depth.

4. **Dev workflow**
   ```bash
   npm run dev         # Start Vite
   # Add or edit files under public/content/homepage
   npm run cms         # Regenerate JSON + aggregated data
   # Browser reloads with the new content
   ```

---

## 🐛 Troubleshooting

| Symptom | Fix |
| --- | --- |
| Content not showing up | Run `npm run cms` after adding files. |
| Image missing | Ensure it lives under `public/content/homepage/`, uses a supported extension, and rerun `npm run cms`. |
| Removing content | Delete the file/folder from `public/content/homepage/` **and** rerun `npm run cms`. |
| Live reload not updating | Manual `npm run cms` is still required, but Vite watches `_aggregated.json` so the browser refreshes once it changes. |

---

## 📦 How the Pipeline Works

```
public/content/homepage/
    ↓ npm run cms
src/content/folders|pages|images/*.json   (generated)
    ↓ automatic step
src/content/_aggregated.json              (single payload)
    ↓ Vite import
React UI renders the data
```

Generated files:
- `src/content/folders/*.json` – Folder metadata
- `src/content/images/*.json` – Image/work entries
- `src/content/pages/*.json` – Standalone text pages
- `src/content/_aggregated.json` – Combined dataset used at runtime

---

## 🎯 Example: Add a new commission folder

```bash
# 1. Create a folder
mkdir -p public/content/homepage/commissions-2025

# 2. Drop in artwork
cp ~/Downloads/artwork1.jpg public/content/homepage/commissions-2025/

# 3. (Optional) add metadata
cat > public/content/homepage/commissions-2025/metadata.json <<'EOF'
{
  "folder": {
    "name": "2025 Commissions",
    "order": 1
  },
  "items": {
    "artwork1.jpg": {
      "title": "Character Commission",
      "date": "2025-01-10",
      "tags": ["commission", "character"]
    }
  }
}
EOF

# 4. Regenerate structured data
npm run cms
```

Open `http://localhost:5173` and the new folder will appear immediately.

Need more details? Check the implementation in [`scripts/cms.js`](./scripts/cms.js) or inspect the existing JSON under `src/content/`.
