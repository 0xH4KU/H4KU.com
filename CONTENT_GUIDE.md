# Content Management Guide

_How to add or update assets under `public/content` without breaking licensing or integrity._

> Licensing reminder: all assets fall under the [Lum.bio Personal Source License](./LICENSE.md). Images, copy, and JSON data are for running this site only—do not redistribute or commercialise them.

## Quick Start

1. **Add files to `public/content/`**
   - Images go anywhere under this root (e.g. `public/content/gallery/...`).
   - Text pages (`.txt`/`.md`) live alongside the images or in their own folders.
2. **Sync files into structured JSON**
   ```bash
   npm run cms
   npm run build:data  # bundles everything into src/content/_aggregated.json
   ```
3. **Done.** Vite reloads when `_aggregated.json` changes; no dev server restart needed.

## Directory Layout

```
public/content/
├── About.txt              # Standalone page
├── Contact.txt            # Standalone page
├── gallery/
│   ├── character-designs/
│   │   ├── metadata.json
│   │   └── lumina-aeon-full.svg
│   └── fan-arts/
│       └── stellar-echo-full.svg
└── metadata.json          # Optional top-level overrides
```

## Configuring `metadata.json`

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

## Supported File Types

- Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.gif`, `.svg`
- Text: `.txt` (rendered as text files), `.md` (converted to plain text)

## Optimised Image Formats (WebP / AVIF)

All gallery items now support multiple source formats so modern browsers can load AVIF/WebP while older ones fall back to PNG/JPEG. The CMS will attempt to generate both formats automatically (using [Sharp](https://sharp.pixelplumbing.com/)) any time it finds a PNG/JPEG/JPG source without matching `.avif`/`.webp` siblings. The generated files are dropped under `.cache/cms-optimized` and referenced transparently—nothing new needs to be committed.

You can still provide your own optimised assets for art-directed crops or specialised pipelines:

1. **Drop sibling files** – place `artwork.jpg` next to `artwork.avif` and/or `artwork.webp`. The CMS pairs them so only one gallery entry is created.
2. **Explicit metadata overrides** – add custom filenames under the matching entry:

```json
{
  "items": {
    "artwork.jpg": {
      "title": "Character Design",
      "avif": "artwork-custom.avif",
      "webp": "optimised/artwork.webp",
      "sources": [
        {
          "type": "image/avif",
          "srcSet": "artwork@2x.avif",
          "media": "(min-width: 1024px)"
        }
      ]
    }
  }
}
```

`avif`, `webp`, and every `sources[].srcSet` entry accepts paths relative to the folder (`optimised/artwork.webp`), `/content/...` URLs, or fully-qualified HTTPS URLs. Local files referenced this way will not be duplicated as separate works. Remember to rerun `npm run cms && npm run build:data` after adding new formats. To opt out of auto-generation for a given asset, drop a `metadata` entry with `"generateAlternates": false`.

## Frequently Used Commands

| Command              | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `npm run cms`        | Scan `public/content/` → regenerate `src/content/{folders,images,pages,socials}` |
| `npm run sync`       | Alias of `npm run cms`                                                           |
| `npm run build:data` | Bundle `src/content/**` into `_aggregated.json` with hashes                      |
| `npm run dev`        | Start the Vite dev server                                                        |
| `npm run build`      | Production build (CMS + fingerprint + Vite; does **not** run build:data)         |

## Integrity Tag

- The bundled snapshot stores `_integrity` (FNV-1a), `_integritySHA256`, and `_buildTime`. Regenerate them with `npm run build:data` after content changes.
- `mockData` recomputes both hashes at runtime; the UI surfaces the status. Avoid hand-editing `_aggregated.json`.
- `npm run integrity:check` (or `-- --write` for intentional edits) verifies these hashes without rebuilding content. See [`docs/INTEGRITY.md`](docs/INTEGRITY.md) for details.

## Tips and Best Practices

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

## Troubleshooting

| Symptom                  | Fix                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Content not showing up   | Run `npm run cms` after adding files.                                                                                 |
| Image missing            | Ensure it lives under `public/content/homepage/`, uses a supported extension, and rerun `npm run cms`.                |
| Removing content         | Delete the file/folder from `public/content/homepage/` **and** rerun `npm run cms`.                                   |
| Live reload not updating | Manual `npm run cms` is still required, but Vite watches `_aggregated.json` so the browser refreshes once it changes. |

## How the Pipeline Works

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

## Example: Add a New Commission Folder

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
