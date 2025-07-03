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

### Installation Options (by Browser/Platform)

### 📱 **Mobile**

#### **Android (Chrome, Edge, Brave, Samsung Internet)**
- Visit the app in your browser.
- A banner or custom toast appears (“Install” or “Add to Home Screen”).
- Or, tap browser menu `⋮` → “Add to Home screen”.
- Follow system prompts to install.  
- The app launches from your home screen like a native app.

#### **iOS (Safari)**
- Open the app in **Safari** (PWA install not supported from Chrome on iOS).
- Tap the “Share” button → “Add to Home Screen”.
- Follow the prompt; icon appears on your home screen.
- Note: No install banner or toast (Apple restriction).

---

### 💻 **Desktop**

#### **Chrome / Edge / Brave (Windows, macOS, Linux)**
- Open the app in your browser.
- You may see a browser install icon (usually in the URL bar or as a “+”).
- Or, a custom “Install” toast appears—click **Install**.
- Or, open browser menu `⋮` → “Install App…” or “Add to Home Screen”.
- The app launches in its own window, like a native desktop app.

#### **Firefox / LibreWolf (All Platforms)**
- **PWA install is *not supported* on desktop Firefox or LibreWolf.**
- No install banner or toast will appear.
- You can bookmark the site or pin the tab for easier access.
- **Mobile Firefox on Android**: “Add to Home screen” is available via browser menu.

#### **Safari (macOS)**
- Open the app in Safari.
- Go to File → “Add to Dock…” (macOS Sonoma and later).
- Not available in older macOS Safari versions.

---

### 📝 **Summary Table**

| Browser / Platform               | Mobile Install                | Desktop Install                | Prompt/Toast      |
|----------------------------------|-------------------------------|-------------------------------|-------------------|
| **Chrome (Android)**             | Yes                           | Yes (Chromebook)              | Yes               |
| **Chrome (Windows/Mac/Linux)**   | N/A                           | Yes                           | Yes               |
| **Edge (Android)**               | Yes                           | Yes (Windows/macOS/Linux)     | Yes               |
| **Edge (Windows/Mac/Linux)**     | N/A                           | Yes                           | Yes               |
| **Brave (Android)**              | Yes                           | Yes                           | Yes               |
| **Brave (Windows/Mac/Linux)**    | N/A                           | Yes                           | Yes               |
| **Opera (Android)**              | Yes                           | Yes (GX/desktop)              | Yes               |
| **Opera (Windows/Mac/Linux)**    | N/A                           | Yes                           | Yes               |
| **Vivaldi (Android)**            | Yes                           | Yes                           | Yes               |
| **Vivaldi (Windows/Mac/Linux)**  | N/A                           | Yes                           | Yes               |
| **Samsung Internet (Android)**   | Yes                           | N/A                           | Yes               |
| **Safari (iOS)**                 | Yes (Share menu)              | N/A                           | No (manual only)  |
| **Safari (macOS Sonoma+)**       | N/A                           | Yes ("Add to Dock")           | No (manual only)  |
| **Safari (older macOS)**         | N/A                           | No                            | No                |
| **Firefox (Android)**            | Yes (via menu)                | No                            | No                |
| **Firefox (Windows/Mac/Linux)**  | No                            | No                            | No                |
| **LibreWolf (All Platforms)**    | No                            | No                            | No                |
| **ChromeOS**                     | Yes (via Chrome)              | Yes                           | Yes               |
| **Bromite (Android)**            | Yes                           | N/A                           | Yes               |
| **Other Android Browsers**       | Sometimes (manual)            | No                            | Sometimes         |

#### **Legend:**
- **Yes** = Full install PWA support (prompt JS + browser menu)
- **No** = No PWA install support
- **N/A** = Browser not available on that platform
- **(manual only)** = Only via OS or browser menu, no JS prompt
- **Prompt/Toast** = Shows either native banner or custom JS toast if implemented

**Note:**  
- *Safari iOS*: Only "Share > Add to Home Screen" (no JS prompt).  
- *Safari macOS Sonoma*: "Add to Dock" is manual, no JS prompt.  
- *Firefox/LibreWolf*: No PWA install on desktop.  
- *Samsung Internet, Bromite*: Full support like Chrome Android.

---

**Tip:**  
- You can always use the app in your browser with full offline support, even without installation.

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
