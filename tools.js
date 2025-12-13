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

// --------------------
// LOAD jsPDF
// --------------------
function loadJsPdf() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}
