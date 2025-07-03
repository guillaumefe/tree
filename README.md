# Interactive Decision Tree

A Progressive Web App (PWA) for authoring, editing and simulating decision trees—fully offline-capable and installable on desktop & mobile.

---

## Table of Contents

1. Features  
2. Demo & Installation  
3. Usage  
4. PWA & Offline  
5. Architecture & Files  
6. License  

---

## Features

- **Interactive Tree Builder**: Create, right-click to edit, context-menu support.  
- **Simulation Mode**: Navigate with “Back”/“Go” controls.  
- **Excel Import/Export**: Round-trip via `.xlsx`, preserving hierarchy in blocks.  
- **Responsive Design**: Touch-friendly, mobile-first layout.  
- **Installable**: “Add to Home Screen” support.  

---

## Demo & Installation

1. Clone the repo:  
   ```bash
   git clone https://github.com/yourorg/decision-tree-pwa.git
   cd decision-tree-pwa
   ```  
2. Serve locally:  
   ```bash
   npx http-server -c-1
   ```  
3. Open `http://localhost:8080/index.html`.

---

## Usage

1. **Add Node**: Select a node, click **Add Node**, type label, **Add**.  
2. **Edit Node**: Right-click a node to rename.  
3. **Reset Tree**: Clears all nodes (confirmation prompt).  
4. **Simulation**: Click **Start Simulation**, make choices, **Back**/**Go**, **Stop Simulation**.  
5. **Import/Export**:  
   - **Export**: Downloads `decision-tree.xlsx`.  
   - **Import**: Select your `.xlsx` to rebuild the tree under “Start”.  
6. **Tutorial**: Click **Tutorial** to launch a guided, animated tour demonstrating how to add, nest, and simulate steps.

---

## PWA & Offline

- **Web Manifest**: Defines name, icons, start URL, theme & background colors.  
- **Service Worker**:  
  ```js
  // sw.js
  self.addEventListener('install', evt => { /* cache assets */ });
  self.addEventListener('activate', evt => { /* cleanup */ });
  self.addEventListener('fetch', evt => { /* serve cache or network */ });
  ```  
- **Offline**: Cached app shell allows full offline usage.
- **Install Prompt**:  
  `install-toast.js` displays a custom toast (not native banner) offering to install the app if eligible.  
  Prompts the user and calls `beforeinstallprompt.prompt()` when they click **Install**.

---

## Architecture & Files

```
/
├─ index.html
├─ styles.css
├─ main.js
├─ install-toast.js
├─ manifest.json
├─ sw.js
├─ icons/
│   ├─ icon-192.png
│   └─ icon-512.png
```

---

## License

This project is licensed under the **[GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)**.
See `LICENSE` for full text.
