/* Clutch Extension — popup.js */

// ─── Config ──────────────────────────────────────────────
// Change this to your deployed Clutch URL when live
const CLUTCH_URL = "https://clutch-grab-what-you-like.netlify.app";

// ─── State ───────────────────────────────────────────────
let pageUrl   = "";
let pageTitle = "";
let source    = "";
let intent    = "Read later";

// ─── DOM refs ────────────────────────────────────────────
const titleInput    = document.getElementById("title-input");
const noteInput     = document.getElementById("note-input");
const previewCover  = document.getElementById("preview-cover");
const previewSource = document.getElementById("preview-source");
const previewTitle  = document.getElementById("preview-title");
const saveBtn       = document.getElementById("save-btn");
const successState  = document.getElementById("success-state");
const successSub    = document.getElementById("success-sub");
const openLink      = document.getElementById("open-clutch");

// ─── Intent selector ─────────────────────────────────────
document.getElementById("intent-row").addEventListener("click", e => {
  const btn = e.target.closest(".intent-btn");
  if (!btn) return;
  document.querySelectorAll(".intent-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  intent = btn.dataset.intent;
});

// ─── Color palette (matches web app) ─────────────────────
function buildCover(src) {
  const palette = [
    ["#DBE9FA", "#8BB5DF"],
    ["#F8E6DB", "#E0B07F"],
    ["#E0F2E9", "#8CC8AE"],
    ["#EFE3F8", "#B69CDB"],
    ["#FDE8E8", "#F3A0A0"],
    ["#FEFCE8", "#F0D070"],
  ];
  const [start, end] = palette[src.length % palette.length];
  return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
}

// ─── Get current tab info ─────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tab = tabs[0];
  if (!tab) return;

  pageUrl   = tab.url   || "";
  pageTitle = tab.title || "";

  try {
    const hostname = new URL(pageUrl).hostname.replace("www.", "");
    source = hostname.split(".")[0];
    // capitalize
    source = source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    source = "Web";
  }

  // Update UI
  titleInput.value      = pageTitle;
  previewTitle.textContent  = pageTitle.length > 55 ? pageTitle.slice(0, 55) + "…" : pageTitle;
  previewSource.textContent = source;
  previewCover.style.background = buildCover(source);

  // Try to get better metadata from content script
  chrome.tabs.sendMessage(tab.id, { type: "GET_META" }, response => {
    if (chrome.runtime.lastError) return;
    if (!response) return;
    if (response.description) {
      noteInput.placeholder = response.description.slice(0, 120);
    }
    if (response.canonicalTitle && !titleInput.value) {
      titleInput.value = response.canonicalTitle;
      previewTitle.textContent = response.canonicalTitle.length > 55 ? response.canonicalTitle.slice(0, 55) + "…" : response.canonicalTitle;
    }
    if (response.siteName) {
      source = response.siteName;
      previewSource.textContent = source;
      previewCover.style.background = buildCover(source);
    }
    if (response.image) {
      // Show image in preview
      previewCover.style.backgroundImage = `url(${response.image})`;
      previewCover.style.backgroundSize  = "cover";
      previewCover.style.backgroundPosition = "center";
      // Store for save
      previewCover.dataset.ogImage = response.image;
    }
  });
});

// Update preview as user types title
titleInput.addEventListener("input", () => {
  const val = titleInput.value;
  previewTitle.textContent = val.length > 55 ? val.slice(0, 55) + "…" : val || "Untitled save";
});

// ─── Open Clutch link ────────────────────────────────────
openLink.addEventListener("click", e => {
  e.preventDefault();
  chrome.tabs.create({ url: CLUTCH_URL + "/app" });
  window.close();
});

// ─── Save button ─────────────────────────────────────────
saveBtn.addEventListener("click", () => {
  const title = titleInput.value.trim() || pageTitle || "Untitled save";
  const note  = noteInput.value.trim();

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  const ogImage = previewCover.dataset.ogImage || "";
  // Build the redirect URL so Clutch can import the save
  const params = new URLSearchParams({
    url:    pageUrl,
    title:  title,
    source: source,
    intent: intent,
    ...(ogImage ? { image: ogImage } : {}),
  });
  const redirectUrl = `${CLUTCH_URL}/app?${params.toString()}`;

  // Store pending capture in chrome.storage.local for the web app to read
  chrome.storage.local.set({
    clutch_pending: JSON.stringify({
      url:    pageUrl,
      title:  title,
      source: source,
      intent: intent,
      note:   note,
    })
  }, () => {
    // Show success then open Clutch
    saveBtn.style.display = "none";
    successState.style.display = "flex";
    successSub.textContent = "Opening Clutch…";

    setTimeout(() => {
      chrome.tabs.create({ url: redirectUrl });
      window.close();
    }, 800);
  });
});
