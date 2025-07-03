/**
 * IndexedDB handle and application state variables
 */
let database,
    nextNodeId = 1,
    rootTreeNode,
    simulationHistory = [],
    simulationFuture = [],
    selectedSimulationNode = null,
    nodeUnderEdit = null,
    isTutorialActive = false,
    tutorialBackupState = {},
    tutorialTimers = [],
    tutorialStepIndex = 0;

// Element references for ease of use
const treeContainerElement        = document.getElementById('tree'),
      simulationTextElement       = document.getElementById('simulation-text'),
      simulationOptionsContainer = document.getElementById('simulation-options'),
      simulationSectionElement   = document.getElementById('simulation'),
      breadcrumbContainer        = document.getElementById('breadcrumb'),
      nodeDialogModal            = document.getElementById('nodeDialogModal'),
      nodeTextInput              = document.getElementById('nodeTextInput'),
      modalConfirmButton         = document.getElementById('modalConfirmButton'),
      tutorialCursorElement      = document.getElementById('tutorial-cursor'),
      simulationBackButton       = document.getElementById('simulation-back-button'),
      simulationGoButton         = document.getElementById('simulation-go-button');

/**
 * Tutorial definitions: messages, selectors, and action callbacks
 */
const tutorialInstructions = [
  "Click 'Add Node' to add a child to the Start node.",
  "Type 'First Step' and click Add to confirm.",
  "Select the 'First Step' node by clicking it.",
  "Click 'Add Node' again to create a sub-step under 'First Step'.",
  "Type 'Sub-step A' and click Add to confirm the sub-step.",
  "Click 'Start Simulation' to enter simulation mode.",
  "Select 'Sub-step A' and then click 'Go' to navigate forward.",
  "Click 'Stop Simulation' to exit simulation mode.",
  "Tutorial complete."
];

const tutorialHighlightSelectors = [
  '#controls button',
  '#modalConfirmButton',
  '#tree > .node > .children > .node:last-child',
  '#controls button',
  '#modalConfirmButton',
  '.header-actions button[onclick="enterSimulationMode()"]',
  '.simulation-choice',
  '#startSimButton',
  '#tutorialButton'
];

const tutorialActionFunctions = [
  () => { animateTutorialClick('#controls button');    tutorialTimers.push(setTimeout(advanceTutorialStep,2000)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           nodeTextInput.value='First Step';
           animateTutorialClick('#modalConfirmButton');
         },1500));
         tutorialTimers.push(setTimeout(advanceTutorialStep,4000)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           animateTutorialClick('#tree > .node > .children > .node:last-child');
         },2000));
         tutorialTimers.push(setTimeout(advanceTutorialStep,4000)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           animateTutorialClick('#controls button');
         },1500));
         tutorialTimers.push(setTimeout(advanceTutorialStep,3500)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           nodeTextInput.value='Sub-step A';
           animateTutorialClick('#modalConfirmButton');
         },1500));
         tutorialTimers.push(setTimeout(advanceTutorialStep,4000)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           animateTutorialClick('.header-actions button[onclick="enterSimulationMode()"]');
         },1500));
         tutorialTimers.push(setTimeout(advanceTutorialStep,3500)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           animateTutorialClick('.simulation-choice');
           tutorialTimers.push(setTimeout(()=>animateTutorialClick('#simulation-go-button'),1500));
         },1500));
         tutorialTimers.push(setTimeout(advanceTutorialStep,4000)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           animateTutorialClick('#startSimButton');
         },1500));
         tutorialTimers.push(setTimeout(advanceTutorialStep,3500)); },
  () => { tutorialTimers.push(setTimeout(()=>{
           animateTutorialClick('#tutorialButton');
         },1500)); }
];

/* ============================================================================
   Onload: register service worker, open DB, load existing tree
============================================================================ */
window.onload = () => {
  openDatabase().then(loadTree);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .catch(err => console.error('Service Worker registration failed:', err));
  }
};

/**
 * Open (or create) the IndexedDB database and object store
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TreeDB",1);
    request.onupgradeneeded = e => {
      e.target.result.createObjectStore("treeStore",{ keyPath:"id" });
    };
    request.onsuccess = () => {
      database = request.result;
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist current tree and nextNodeId, unless tutorial is active
 */
function persistTree() {
  if (isTutorialActive) return;
  const tx = database.transaction("treeStore","readwrite"),
        store = tx.objectStore("treeStore");
  store.put({
    id: "tree",
    data: serializeTree(rootTreeNode),
    counter: nextNodeId
  });
}

/**
 * Load tree structure from database (or initialize new)
 */
function loadTree() {
  const tx = database.transaction("treeStore","readonly"),
        store = tx.objectStore("treeStore");
  store.get("tree").onsuccess = e => {
    const rec = e.target.result;
    if (rec) {
      nextNodeId = rec.counter||1;
      rootTreeNode = deserializeTree(rec.data);
    } else {
      rootTreeNode = createNode("Start");
    }
    treeContainerElement.innerHTML = "";
    treeContainerElement.appendChild(rootTreeNode.element);
    document.querySelectorAll('.node.selected').forEach(el=>el.classList.remove('selected'));
    rootTreeNode.element.classList.add('selected');
  };
}

/**
 * Normalize and capitalize node labels
 */
function normalizeLabel(txt) {
  const t = txt.trim();
  return t ? t.charAt(0).toUpperCase()+t.slice(1) : '';
}

/**
 * Create a new tree node element with click/contextmenu handlers
 * Accessible: node is a button, focusable by keyboard, context menu via keyboard
 */
function createNode(text) {
  const label = normalizeLabel(text),
        node = {
          id: nextNodeId++,
          label,
          children: [],
          parent: null,
          element: document.createElement("button")
        };
  node.element.className = "node";
  node.element.type = "button";
  node.element.textContent = label;
  node.element.setAttribute("tabindex", "0");
  node.element.setAttribute("aria-label", label);
  node.element.setAttribute("role", "treeitem");
  node.element.setAttribute("aria-expanded", "false");
  // Select on click or keyboard (Enter/Space)
  function selectNode(e) {
    if (e.type === "click" ||
        (e.type === "keydown" && (e.key === "Enter" || e.key === " "))) {
      e.stopPropagation();
      document.querySelectorAll('.node.selected').forEach(el=>el.classList.remove('selected'));
      node.element.classList.add('selected');
      node.element.nodeRef = node;
      node.element.focus();
    }
  }
  node.element.onclick = selectNode;
  node.element.onkeydown = selectNode;
  // Edit on right-click or Shift+F10/ContextMenu key
  node.element.oncontextmenu = e => {
    e.preventDefault();
    showEditNodeDialog(node);
  };
  node.element.addEventListener('keydown', e => {
    if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
      e.preventDefault();
      showEditNodeDialog(node);
    }
  });
  node.childrenContainer = document.createElement("div");
  node.childrenContainer.className = "children";
  node.childrenContainer.setAttribute("role", "group");
  node.element.appendChild(node.childrenContainer);
  return node;
}

/**
 * Show dialog to add a new child under selected or to edit existing
 * Accessible: trap focus, close on Escape, announce via aria-live
 */
function showAddNodeDialog() {
  nodeUnderEdit = null;
  nodeDialogModal.style.display = "flex";
  document.getElementById('modalTitle').textContent = "Add node";
  modalConfirmButton.textContent = "Add";
  nodeTextInput.value = "";
  nodeDialogModal.setAttribute("aria-hidden", "false");
  nodeDialogModal.focus();
  setTimeout(() => nodeTextInput.focus(), 0);

  // Trap focus inside modal
  trapModalFocus(nodeDialogModal);

  // Announce opening modal
  announce("Dialog opened: Add node");
}
function hideAddNodeDialog() {
  nodeDialogModal.style.display = "none";
  nodeDialogModal.setAttribute("aria-hidden", "true");
  nodeTextInput.value = "";
  removeModalFocusTrap(nodeDialogModal);
  announce("Dialog closed.");
}

/**
 * Show dialog to edit an existing node (same a11y as add)
 */
function showEditNodeDialog(node) {
  nodeUnderEdit = node;
  nodeDialogModal.style.display = "flex";
  document.getElementById('modalTitle').textContent = "Edit node";
  modalConfirmButton.textContent = "Save";
  nodeTextInput.value = node.label;
  nodeDialogModal.setAttribute("aria-hidden", "false");
  nodeDialogModal.focus();
  setTimeout(() => nodeTextInput.focus(), 0);
  trapModalFocus(nodeDialogModal);
  announce(`Dialog opened: Edit node ${node.label}`);
}

// Trap focus inside modal (tab loop)
function trapModalFocus(modal) {
  function focusTrap(e) {
    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = modal.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    } else if (e.key === "Escape") {
      hideAddNodeDialog();
    }
  }
  modal.addEventListener("keydown", focusTrap);
  modal._focusTrap = focusTrap;
}
// Remove focus trap on modal close
function removeModalFocusTrap(modal) {
  if (modal._focusTrap) {
    modal.removeEventListener("keydown", modal._focusTrap);
    delete modal._focusTrap;
  }
}

// Announce messages for screen readers
function announce(message) {
  let live = document.getElementById('a11y-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'a11y-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('role', 'status');
    live.style.position = 'absolute';
    live.style.left = '-9999px';
    document.body.appendChild(live);
  }
  live.textContent = message;
}

/**
 * Confirm add/edit from modal
 */
modalConfirmButton.onclick = () => {
  const txt = nodeTextInput.value.trim();
  if (!txt) return;
  if (nodeUnderEdit) {
    // Edit existing
    nodeUnderEdit.label = normalizeLabel(txt);
    nodeUnderEdit.element.childNodes[0].nodeValue = nodeUnderEdit.label;
    persistTree();
    displayToast(`Updated "${nodeUnderEdit.label}"`);
  } else {
    // Add new child under selected or root
    const parent = document.querySelector(".node.selected")?.nodeRef || rootTreeNode;
    const newNode = createNode(txt);
    newNode.parent = parent;
    parent.children.push(newNode);
    parent.childrenContainer.appendChild(newNode.element);
    persistTree();
    displayToast(`Added "${newNode.label}"`);
  }
  hideAddNodeDialog();
};

/**
 * Confirm and perform full tree reset
 */
function confirmTreeReset() {
  if (!confirm("Are you sure you want to reset the tree? This will delete all nodes and cannot be undone.")) return;
  treeContainerElement.innerHTML = "";
  nextNodeId = 1;
  rootTreeNode = createNode("Start");
  treeContainerElement.appendChild(rootTreeNode.element);
  document.querySelectorAll('.node.selected').forEach(el=>el.classList.remove('selected'));
  rootTreeNode.element.classList.add('selected');
  persistTree();
  exitSimulationMode();
}

/**
 * Enter simulation mode from the currently selected node
 */
function enterSimulationMode() {
  const sel = document.querySelector(".node.selected"),
        startNode = sel?.nodeRef || rootTreeNode;
  simulationHistory = [startNode];
  simulationFuture = [];
  document.querySelector('#controls').style.display = "none";
  treeContainerElement.style.display = "none";
  simulationSectionElement.style.display = "block";
  renderSimulationView(startNode);
  displayToast(`Starting at "${startNode.label}"`);
  const btn = document.getElementById('startSimButton');
  btn.textContent = 'Stop Simulation';
  btn.onclick = exitSimulationMode;
}

/**
 * Exit simulation and return to edit mode
 */
function exitSimulationMode() {
  simulationSectionElement.style.display = "none";
  treeContainerElement.style.display = "flex";
  document.querySelector('#controls').style.display = "flex";
  simulationOptionsContainer.innerHTML = "";
  breadcrumbContainer.innerHTML = "";
  const btn = document.getElementById('startSimButton');
  btn.textContent = 'Start Simulation';
  btn.onclick = enterSimulationMode;
}

/**
 * Render simulation UI: breadcrumb, choices, default first select
 * Accessible: focus management, choices focusable and selectable by keyboard
 */
function renderSimulationView(node) {
  breadcrumbContainer.innerHTML = "";
  simulationHistory.forEach((n, i) => {
    const item = document.createElement('div'),
          span = document.createElement('span'),
          btn  = document.createElement('button');
    item.className = 'breadcrumb-item';
    span.textContent = n.label;
    btn.textContent = 'Go';
    btn.onclick = () => {
      simulationHistory = simulationHistory.slice(0, i + 1);
      simulationFuture = [];
      renderSimulationView(n);
      displayToast(`Moved to "${n.label}"`);
    };
    btn.setAttribute("aria-label", `Go to ${n.label}`);
    item.append(span, btn);
    breadcrumbContainer.appendChild(item);
  });

  simulationTextElement.textContent = `You have arrived at: "${node.label}"`;
  announce(`You have arrived at: ${node.label}`);
  simulationOptionsContainer.innerHTML = "";
  selectedSimulationNode = null;

  if (node.children.length) {
    node.children.forEach((child, idx) => {
      const choice = document.createElement("button");
      choice.textContent = child.label;
      choice.className = "simulation-choice";
      choice.setAttribute("tabindex", "0");
      choice.setAttribute("role", "option");
      choice.setAttribute("aria-label", child.label);
      choice.onclick = () => {
        document.querySelectorAll(".simulation-choice.selected").forEach(el => el.classList.remove("selected"));
        choice.classList.add("selected");
        selectedSimulationNode = child;
        choice.focus();
        announce(`${child.label} selected`);
      };
      choice.onkeydown = e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choice.click();
        } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          if (choice.nextElementSibling) choice.nextElementSibling.focus();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          if (choice.previousElementSibling) choice.previousElementSibling.focus();
        }
      };
      if (idx === 0) {
        // Default to first choice
        choice.classList.add('selected');
        selectedSimulationNode = node.children[0];
        setTimeout(() => choice.focus(), 0);
      }
      simulationOptionsContainer.appendChild(choice);
    });
  }

  simulationBackButton.style.display = simulationHistory.length <= 1 ? 'none' : '';
  simulationGoButton.style.display = node.children.length ? '' : 'none';
}

/**
 * Navigate backward in simulation history
 */
function navigateBack() {
  if (simulationHistory.length>1) {
    const last = simulationHistory.pop();
    simulationFuture.unshift(last);
    const curr = simulationHistory[simulationHistory.length-1];
    renderSimulationView(curr);
    displayToast(`Moved back to "${curr.label}"`);
  }
}

/**
 * Navigate forward to the selected simulation choice
 */
function navigateForwardSelection() {
  if (!selectedSimulationNode) {
    alert("Please select a choice");
    return;
  }
  simulationHistory.push(selectedSimulationNode);
  simulationFuture = [];
  renderSimulationView(selectedSimulationNode);
  displayToast(`Moved to "${selectedSimulationNode.label}"`);
}

/**
 * Serialize tree structure into plain object
 */
function serializeTree(node) {
  return {
    id: node.id,
    label: node.label,
    children: node.children.map(serializeTree)
  };
}

/**
 * Rebuild tree from serialized data
 */
function deserializeTree(data, parent=null) {
  const node = createNode(data.label);
  node.id = data.id;
  node.parent = parent;
  data.children.forEach(c=>{
    const ch = deserializeTree(c, node);
    node.children.push(ch);
    node.childrenContainer.appendChild(ch.element);
  });
  return node;
}

/**
 * Display a transient toast message at bottom
 */
function displayToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>document.body.removeChild(t),3000);
}

/* ----------------------------------------------------------------------------
   Tutorial helper functions (click animations, highlighting)
----------------------------------------------------------------------------- */
function animateTutorialClick(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  tutorialCursorElement.style.display = 'block';
  tutorialCursorElement.style.left = (rect.left+rect.width/2)+'px';
  tutorialCursorElement.style.top = (rect.top+rect.height/2)+'px';
  setTimeout(()=>{
    el.classList.add('tutorial-click-animation');
    el.click();
    setTimeout(()=>el.classList.remove('tutorial-click-animation'),300);
  },1000);
}
function displayTutorialMessage(msg) {
  document.getElementById('tutorialToast')?.remove();
  const to = document.createElement('div');
  to.id = 'tutorialToast';
  to.className = 'tutorial-toast';
  to.textContent = msg;
  document.body.appendChild(to);
}
function highlightTutorialStep() {
  document.querySelectorAll('.tutorial-highlight').forEach(el=>el.classList.remove('tutorial-highlight'));
  const sel = tutorialHighlightSelectors[tutorialStepIndex];
  if (sel) {
    const el = document.querySelector(sel);
    if (el) {
      el.classList.add('tutorial-highlight');
      el.scrollIntoView({behavior:'smooth',block:'center'});
    }
  }
  tutorialActionFunctions[tutorialStepIndex]?.();
  displayTutorialMessage(tutorialInstructions[tutorialStepIndex]);
}
function advanceTutorialStep() {
  tutorialStepIndex++;
  if (tutorialStepIndex < tutorialInstructions.length) highlightTutorialStep();
  else endTutorial();
}

/**
 * Start the interactive tutorial
 * - Backup current state
 * - Switch to fresh start
 * - Step through tutorialInstructions
 */
function beginTutorial() {
  exitSimulationMode();
  tutorialTimers.forEach(id=>clearTimeout(id));
  tutorialTimers=[];
  const sel = document.querySelector('.node.selected');
  tutorialBackupState = {
    data: serializeTree(rootTreeNode),
    counter: nextNodeId,
    selectedId: sel?.nodeRef?.id ?? null
  };
  isTutorialActive = true;
  document.body.classList.add('tutorial-active');
  treeContainerElement.innerHTML = '';
  nextNodeId = 1;
  rootTreeNode = createNode("Start");
  treeContainerElement.appendChild(rootTreeNode.element);
  document.querySelectorAll('.node.selected').forEach(el=>el.classList.remove('selected'));
  rootTreeNode.element.classList.add('selected');
  tutorialStepIndex = 0;
  document.getElementById('tutorialButton').textContent = 'Stop Tutorial';
  document.getElementById('tutorialButton').onclick = endTutorial;
  highlightTutorialStep();
}

/**
 * End tutorial and restore pre-tutorial state
 */
function endTutorial() {
  tutorialTimers.forEach(id=>clearTimeout(id));
  tutorialTimers=[];
  hideAddNodeDialog();
  isTutorialActive=false;
  document.querySelectorAll('.tutorial-highlight').forEach(el=>el.classList.remove('tutorial-highlight'));
  document.getElementById('tutorialToast')?.remove();
  document.body.classList.remove('tutorial-active');
  tutorialCursorElement.style.display='none';
  const btn = document.getElementById('tutorialButton');
  btn.textContent='Tutorial';
  btn.onclick=beginTutorial;
  exitSimulationMode();
  const { data, counter, selectedId } = tutorialBackupState;
  nextNodeId = counter;
  rootTreeNode = deserializeTree(data);
  treeContainerElement.innerHTML = '';
  treeContainerElement.appendChild(rootTreeNode.element);
  // Restore selection
  function restoreById(n,id){ if(n.id===id) return n; for(const c of n.children){ const r=restoreById(c,id); if(r) return r;} return null;}
  const restored = restoreById(rootTreeNode, selectedId);
  if (restored) restored.element.classList.add('selected');
  else rootTreeNode.element.classList.add('selected');
  persistTree();
}

/**
 * Export the current tree to Excel.
 * Each top‐level child and its leaves form a block,
 * and blocks are separated by an empty row.
 */
function exportTreeToExcel() {
  const blocks = [];

  // Compute how deep a node sits in the tree
  function getDepth(node) {
    let depth = 0;
    let current = node;
    while (current.parent) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  // Build one block per direct child of the root
  rootTreeNode.children.forEach(child => {
    const depth = getDepth(child);
    const blockRows = [];

    // First row: the parent itself
    const parentRow = [];
    parentRow[depth] = child.label;
    blockRows.push(parentRow);

    // Gather all leaf nodes under this child
    const leaves = [];
    (function collectLeaves(n) {
      if (n.children.length === 0) leaves.push(n);
      else n.children.forEach(collectLeaves);
    })(child);

    // For each leaf, build a path row
    leaves.forEach(leaf => {
      const row = [];
      row[depth] = child.label;
      const path = [];
      let cursor = leaf;
      while (cursor !== child) {
        path.unshift(cursor.label);
        cursor = cursor.parent;
      }
      path.forEach((lbl, i) => {
        row[depth + i + 1] = lbl;
      });
      blockRows.push(row);
    });

    blocks.push(blockRows);
  });

  // Flatten blocks into one big table, with an empty row between blocks
  const table = [];
  blocks.forEach((block, i) => {
    block.forEach(r => table.push(r));
    if (i < blocks.length - 1) table.push([]);
  });

  // Use SheetJS to write and trigger download
  const ws = XLSX.utils.aoa_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DecisionTree");
  XLSX.writeFile(wb, "decision-tree.xlsx");
}

/**
 * Trigger the hidden file input to let the user pick an Excel file.
 */
function promptFileImport() {
  document.getElementById('importFile').click();
}

/**
 * Handle the file‐selection event, read the workbook,
 * convert to rows, and rebuild the tree.
 */
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: 'binary' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    buildTreeFromRows(rows);
  };
  reader.readAsBinaryString(file);
}

/**
 * Given an array of rows (from Excel import),
 * rebuilds the tree “block by block” exactly as it was exported.
 */
function buildTreeFromRows(rows) {
  // 1) Clear and recreate root
  treeContainerElement.innerHTML = '';
  rootTreeNode = createNode("Start");
  treeContainerElement.appendChild(rootTreeNode.element);
  rootTreeNode.children = [];

  // 2) Utility: Normalize and lowercase for reliable comparisons
  function norm(label) {
    return normalizeLabel(String(label || '').trim()).toLowerCase();
  }

  // 3) For every row, follow the path creating or reusing nodes
  rows.forEach(row => {
    if (!row || row.every(cell => cell == null || cell === '')) return;
    let parent = rootTreeNode;
    for (let d = 0; d < row.length; ++d) {
      let raw = row[d];
      if (raw == null || raw === '') continue;
      let label = normalizeLabel(String(raw).trim());
      let searchNorm = norm(label);

      // Try to find the existing child
      let child = parent.children.find(n => norm(n.label) === searchNorm);
      if (!child) {
        child = createNode(label);
        child.parent = parent;
        parent.children.push(child);
        parent.childrenContainer.appendChild(child.element);
      }
      parent = child;
    }
  });

  persistTree();
  document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
  rootTreeNode.element.classList.add('selected');
  displayToast("Tree imported");
}
