// --------------------
// UNIVERSAL DEPENDENCY LOADER (JS + CSS)
// - Loads in order
// - Dedupes (won't load same URL twice)
// - Supports global check (so you can skip if already present)
// --------------------
const DepLoader = (() => {
  const loaded = new Map(); // url -> Promise

  function loadScript(url, { async = false, defer = true, check } = {}) {
    // If a "check" function says it's already available, skip.
    if (typeof check === "function" && check()) return Promise.resolve();

    // Deduplicate by URL
    if (loaded.has(url)) return loaded.get(url);

    const p = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.async = async; // keep false to preserve order
      s.defer = defer;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(s);
    });

    loaded.set(url, p);
    return p;
  }

  function loadCss(url) {
    if (loaded.has(url)) return loaded.get(url);

    const p = new Promise((resolve, reject) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = url;
      l.onload = () => resolve();
      l.onerror = () => reject(new Error(`Failed to load css: ${url}`));
      document.head.appendChild(l);
    });

    loaded.set(url, p);
    return p;
  }

  async function loadAll(manifest = []) {
    // Load strictly in sequence (dependency-safe)
    for (const item of manifest) {
      if (!item) continue;

      if (typeof item === "string") {
        await loadScript(item);
        continue;
      }

      if (item.type === "css") {
        await loadCss(item.url);
      } else {
        await loadScript(item.url, item);
      }
    }
  }

  return { loadScript, loadCss, loadAll };
})();


// --------------------
// YOUR UNIVERSAL "load everything" function
// (add whatever dependencies you want here)
// --------------------
async function loadUniversalDeps() {
  await DepLoader.loadAll([
    // jsPDF
    {
      url: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      check: () => !!(window.jspdf && window.jspdf.jsPDF),
    },

    // PDF.js
    // {
    //   url: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.js",
    //   check: () => !!window.pdfjsLib,
    // },

    // PDF.js worker config (must be set AFTER pdfjsLib loads)
    {
      url: "data:text/javascript," + encodeURIComponent(`
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js";
      `),
      check: () =>
        !!(window.pdfjsLib &&
           window.pdfjsLib.GlobalWorkerOptions &&
           window.pdfjsLib.GlobalWorkerOptions.workerSrc),
    },

    // SortableJS
    {
      url: "https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js",
      check: () => !!window.Sortable,
    },

    // pdf-lib
    {
      url: "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js",
      check: () => !!window.PDFLib,
    },
  ]);
}


// --------------------
// Example usage:
// when universal deps loaded, then run your tool init
// --------------------
async function bootApp() {
  try {
    await loadUniversalDeps();

    // Now ALL dependencies exist:
    // window.jspdf.jsPDF, window.pdfjsLib, window.Sortable, window.PDFLib

    // call whichever tool you want
    // loadPdfPageOrganizerTool();
    // loadHandwrittenTool();
    // etc.

    console.log("All dependencies loaded ✅");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Run on page load
window.addEventListener("DOMContentLoaded", bootApp);






function loadHandwrittenTool() {
  const container = document.getElementById("toolContainer");

  container.innerHTML = `
    <div class="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-6 space-y-5">

      <h1 class="text-2xl font-bold text-gray-800 text-center">
        📘 Handwritten Study Notes Prompt Generator
      </h1>

      <!-- Topic Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">
          Topic Name
        </label>
        <input
          type="text"
          id="topic"
          placeholder="e.g. Digital Logic – Boolean Algebra"
          class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Generate Button -->
      <button
        onclick="generatePrompt()"
        class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Generate Prompt
      </button>

      <!-- Output -->
      <div>
        <label class="block text-sm font-semibold text-gray-600 mb-1">
          Generated Prompt (Copy & Paste)
        </label>
        <textarea
          id="output"
          rows="12"
          class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        ></textarea>
      </div>

    </div>
  `;
}

function generatePrompt() {
  const topic = document.getElementById("topic").value || "[Topic]";

const prompt = `
Create handwritten study notes about "${topic}" on a single A4 size paper in PORTRAIT orientation (vertical layout).

Use a neat student-style handwriting font on ruled (lined) paper.
The notes should look like they are written with a blue pen.
Maintain proper top, bottom, left, and right margins like a real notebook page.

Highlight important keywords and definitions using a yellow neon marker for quick revision.
Draw red circles around important dates, formulas, or key values wherever applicable.

Add small hand-drawn doodles, diagrams, arrows, and symbols to visually explain concepts better.
Ensure content flows from top to bottom, not sideways.
Keep the layout clean, well-spaced, and exam-oriented, suitable for student revision notes.

The overall appearance should feel realistic, like real handwritten class notes photographed or scanned from an A4 portrait page.
`.trim();


  document.getElementById("output").value = prompt;
}


// --------------------
// GLOBAL IMAGE STORE
// --------------------
let images = [];

// --------------------
// LOAD TOOL UI
// --------------------
function loadImageToPdfTool() {
  const container = document.getElementById("toolContainer");

  images = []; // reset when tool loads

  container.innerHTML = `
    <div class="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-6 space-y-6">

      <h1 class="text-2xl font-bold text-center text-gray-800">
        📄 A4 Images to Single PDF
      </h1>

      <p class="text-sm text-gray-600 text-center">
        Drag & drop multiple A4 portrait images, arrange them, and generate one PDF.
      </p>

      <!-- Drag & Drop Area -->
      <div
        id="dropZone"
        class="w-full border-2 border-dashed border-gray-400 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
      >
        <p class="text-gray-600 font-semibold">
          Drag & drop A4 images here or click to upload
        </p>
        <p class="text-xs text-gray-500 mt-1">
          (Portrait A4 images recommended)
        </p>

        <input
          type="file"
          id="imageInput"
          accept="image/*"
          multiple
          class="hidden"
        />
      </div>

      <!-- Preview Area -->
      <div
        id="preview"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      ></div>

      <button
        onclick="generatePdfFromImages()"
        class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
      >
        Generate PDF
      </button>

    </div>
  `;

  setupDragAndDrop();
}

// --------------------
// DRAG & DROP SETUP
// --------------------
function setupDragAndDrop() {
  const dropZone = document.getElementById("dropZone");
  const input = document.getElementById("imageInput");

  dropZone.addEventListener("click", () => input.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-blue-500", "bg-blue-50");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-blue-500", "bg-blue-50");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-500", "bg-blue-50");
    handleFiles(e.dataTransfer.files);
  });

  input.addEventListener("change", (e) => {
    handleFiles(e.target.files);
  });
}

// --------------------
// HANDLE FILES
// --------------------
function handleFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const reader = new FileReader();
    reader.onload = () => {
      images.push(reader.result);
      renderPreviews();
    };
    reader.readAsDataURL(file);
  }
}

// --------------------
// PREVIEW + REORDER
// --------------------
function renderPreviews() {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";

  images.forEach((img, index) => {
    preview.innerHTML += `
      <div class="border rounded-lg p-2 shadow-sm bg-white">
        <img
          src="${img}"
          class="w-full h-64 object-contain border rounded"
        />

        <div class="flex justify-between mt-2 text-sm">
          <button
            onclick="moveUp(${index})"
            class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ⬆ Up
          </button>

          <button
            onclick="removeImage(${index})"
            class="px-2 py-1 bg-red-200 rounded hover:bg-red-300"
          >
            ❌ Remove
          </button>

          <button
            onclick="moveDown(${index})"
            class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ⬇ Down
          </button>
        </div>
      </div>
    `;
  });
}

// --------------------
// REORDER FUNCTIONS
// --------------------
function moveUp(index) {
  if (index === 0) return;
  [images[index - 1], images[index]] = [images[index], images[index - 1]];
  renderPreviews();
}

function moveDown(index) {
  if (index === images.length - 1) return;
  [images[index + 1], images[index]] = [images[index], images[index + 1]];
  renderPreviews();
}

function removeImage(index) {
  images.splice(index, 1);
  renderPreviews();
}

// --------------------
// PDF GENERATION
// --------------------
async function generatePdfFromImages() {
  if (!images.length) {
    alert("Please upload at least one image.");
    return;
  }

  if (!window.jspdf) {
    await loadJsPdf();
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  for (let i = 0; i < images.length; i++) {
    if (i !== 0) pdf.addPage();
    pdf.addImage(images[i], "JPEG", 0, 0, 210, 297);
  }

  pdf.save("merged-a4-notes.pdf");
}

// // --------------------
// // LOAD jsPDF
// // --------------------
// function loadJsPdf() {
//   return new Promise((resolve) => {
//     const script = document.createElement("script");
//     script.src =
//       "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
//     script.onload = resolve;
//     document.body.appendChild(script);
//   });
// }



/**
 * Tool #3: PDF Page Organizer (Upload -> Preview all pages -> Reorder -> Export/Print)
 */
function loadPdfPageOrganizerTool() {
  const root = document.getElementById("toolRoot");
  root.innerHTML = `
    <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
      <input id="pdfInput" type="file" accept="application/pdf" />
      <button id="exportBtn" disabled>Export Reordered PDF</button>
      <button id="printBtn" disabled>Print Reordered PDF</button>
      <span id="status" style="opacity:0.8;"></span>
    </div>

    <div style="margin-top:14px;">
      <div id="thumbGrid"
           style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                  gap:12px; align-items:start;">
      </div>
    </div>
  `;

  const pdfInput = document.getElementById("pdfInput");
  const exportBtn = document.getElementById("exportBtn");
  const printBtn = document.getElementById("printBtn");
  const status = document.getElementById("status");
  const thumbGrid = document.getElementById("thumbGrid");

  let originalPdfBytes = null;
  let pageCount = 0;

  // Enable drag reorder
  const sortable = new Sortable(thumbGrid, {
    animation: 150,
    ghostClass: "ghost",
  });

  pdfInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    status.textContent = "Loading PDF...";
    exportBtn.disabled = true;
    printBtn.disabled = true;
    thumbGrid.innerHTML = "";

    originalPdfBytes = await file.arrayBuffer();

    // Render thumbnails with PDF.js
    const pdf = await pdfjsLib.getDocument({ data: originalPdfBytes }).promise;
    pageCount = pdf.numPages;

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);

      // thumbnail scale
      const viewport = page.getViewport({ scale: 0.35 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");

      await page.render({ canvasContext: ctx, viewport }).promise;

      const card = document.createElement("div");
      card.style.cssText = `
        border:1px solid #ddd; border-radius:10px; padding:10px; background:#fff;
        display:flex; flex-direction:column; gap:8px; cursor:grab;
      `;
      card.dataset.pageIndex = String(i - 1); // 0-based for pdf-lib

      const label = document.createElement("div");
      label.textContent = `Page ${i}`;
      label.style.cssText = "font-weight:600; font-size:13px;";

      card.appendChild(label);
      card.appendChild(canvas);
      thumbGrid.appendChild(card);
    }

    status.textContent = `Loaded ${pageCount} pages. Drag to reorder.`;
    exportBtn.disabled = false;
    printBtn.disabled = false;
  });

  exportBtn.addEventListener("click", async () => {
    if (!originalPdfBytes) return;

    status.textContent = "Building reordered PDF...";
    const reorderedBytes = await buildReorderedPdf(originalPdfBytes, thumbGrid);

    const blob = new Blob([reorderedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "reordered.pdf";
    a.click();

    status.textContent = "Exported reordered.pdf";
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  });

  printBtn.addEventListener("click", async () => {
    if (!originalPdfBytes) return;

    status.textContent = "Preparing print PDF...";
    const reorderedBytes = await buildReorderedPdf(originalPdfBytes, thumbGrid);

    // Print via hidden iframe
    const blob = new Blob([reorderedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // cleanup later
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 30_000);
      status.textContent = "Print dialog opened.";
    };
  });

  async function buildReorderedPdf(pdfBytes, gridEl) {
    const { PDFDocument } = PDFLib;

    const srcDoc = await PDFDocument.load(pdfBytes);
    const outDoc = await PDFDocument.create();

    // Read new order from DOM
    const cards = Array.from(gridEl.querySelectorAll("div[data-page-index]"));
    const order = cards.map((c) => parseInt(c.dataset.pageIndex, 10));

    // Copy pages in that order
    const copiedPages = await outDoc.copyPages(srcDoc, order);
    copiedPages.forEach((p) => outDoc.addPage(p));

    return await outDoc.save();
  }
}




