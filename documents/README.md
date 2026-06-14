# Documents Folder

This folder stores the metadata for downloadable project files displayed on the **Documents** page of the Automated Cricket Ground Control System website.

## How to Add New Files

### Step 1: Place the file in the public documents folder
Copy your file into:
```
/public/documents/
```

For example:
```
/public/documents/my-report.pdf
```

### Step 2: Update the metadata
Open `files.json` in this folder and add a new entry to the `files` array:

```json
{
  "name": "My Report",
  "filename": "my-report.pdf",
  "type": "PDF",
  "path": "/documents/my-report.pdf",
  "size": "3.2 MB",
  "description": "Brief description of the file."
}
```

### Supported File Types
- **PDF** — use `"type": "PDF"`
- **DOCX** — use `"type": "DOCX"`
- **PPTX** — use `"type": "PPTX"`

### Step 3: Rebuild and deploy
Run `bun run build` (or `npm run build`) to update the site.

---

## Current Files
See `files.json` for the current list of available downloads.
