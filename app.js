const DEFAULT_HOME = "https://example.com";
const SEARCH_ENDPOINT = "https://duckduckgo.com/?q=";
const BOOKMARKS_KEY = "mrrise-browser-bookmarks";

const state = {
  history: [],
  index: -1,
  bookmarks: loadBookmarks(),
};

const ui = {
  addressForm: document.getElementById("addressForm"),
  addressInput: document.getElementById("addressInput"),
  webview: document.getElementById("webview"),
  statusBar: document.getElementById("statusBar"),
  backBtn: document.getElementById("backBtn"),
  forwardBtn: document.getElementById("forwardBtn"),
  reloadBtn: document.getElementById("reloadBtn"),
  homeBtn: document.getElementById("homeBtn"),
  goBtn: document.getElementById("goBtn"),
  bookmarkBtn: document.getElementById("bookmarkBtn"),
  showBookmarksBtn: document.getElementById("showBookmarksBtn"),
  clearBookmarksBtn: document.getElementById("clearBookmarksBtn"),
  bookmarksPanel: document.getElementById("bookmarksPanel"),
  bookmarksList: document.getElementById("bookmarksList"),
  bookmarkItemTemplate: document.getElementById("bookmarkItemTemplate"),
};

init();

function init() {
  bindEvents();
  renderBookmarks();
  navigate(DEFAULT_HOME);
}

function bindEvents() {
  ui.addressForm.addEventListener("submit", (event) => {
    event.preventDefault();
    navigate(ui.addressInput.value);
  });

  ui.goBtn.addEventListener("click", () => navigate(ui.addressInput.value));
  ui.backBtn.addEventListener("click", goBack);
  ui.forwardBtn.addEventListener("click", goForward);
  ui.reloadBtn.addEventListener("click", reloadCurrent);
  ui.homeBtn.addEventListener("click", () => navigate(DEFAULT_HOME));
  ui.bookmarkBtn.addEventListener("click", addBookmark);

  ui.showBookmarksBtn.addEventListener("click", () => {
    ui.bookmarksPanel.classList.toggle("hidden");
  });

  ui.clearBookmarksBtn.addEventListener("click", () => {
    state.bookmarks = [];
    persistBookmarks();
    renderBookmarks();
    setStatus("Bookmarks cleared.");
  });

  ui.webview.addEventListener("load", () => {
    setStatus(`Loaded: ${ui.webview.src}`);
  });

  ui.webview.addEventListener("error", () => {
    setStatus("Could not load this page (possibly blocked by frame policies).", true);
  });
}

function normalizeInput(raw) {
  const value = raw.trim();

  if (!value) return DEFAULT_HOME;

  const hasScheme = /^https?:\/\//i.test(value);
  const looksLikeDomain = /^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(value);

  if (hasScheme) return value;
  if (looksLikeDomain) return `https://${value}`;

  return `${SEARCH_ENDPOINT}${encodeURIComponent(value)}`;
}

function navigate(input, { preserveForward = false } = {}) {
  const url = normalizeInput(input);

  if (!preserveForward && state.index < state.history.length - 1) {
    state.history = state.history.slice(0, state.index + 1);
  }

  const previous = state.history[state.index];
  if (url !== previous) {
    state.history.push(url);
    state.index = state.history.length - 1;
  }

  ui.addressInput.value = url;
  ui.webview.src = url;
  setStatus(`Loading: ${url}`);
  updateNavButtons();
}

function goBack() {
  if (state.index <= 0) return;
  state.index -= 1;
  loadFromHistory();
}

function goForward() {
  if (state.index >= state.history.length - 1) return;
  state.index += 1;
  loadFromHistory();
}

function reloadCurrent() {
  if (state.index < 0) return;
  ui.webview.src = state.history[state.index];
  setStatus(`Reloading: ${ui.webview.src}`);
}

function loadFromHistory() {
  const url = state.history[state.index];
  ui.addressInput.value = url;
  ui.webview.src = url;
  setStatus(`Loading: ${url}`);
  updateNavButtons();
}

function updateNavButtons() {
  ui.backBtn.disabled = state.index <= 0;
  ui.forwardBtn.disabled = state.index >= state.history.length - 1;
}

function addBookmark() {
  const url = state.history[state.index] || normalizeInput(ui.addressInput.value);
  if (!url) return;

  if (state.bookmarks.includes(url)) {
    setStatus("This page is already bookmarked.");
    return;
  }

  state.bookmarks.unshift(url);
  persistBookmarks();
  renderBookmarks();
  setStatus(`Bookmarked: ${url}`);
}

function renderBookmarks() {
  ui.bookmarksList.innerHTML = "";

  for (const url of state.bookmarks) {
    const fragment = ui.bookmarkItemTemplate.content.cloneNode(true);
    const listItem = fragment.querySelector("li");
    const linkBtn = fragment.querySelector(".bookmark-link");
    const deleteBtn = fragment.querySelector(".bookmark-delete");

    linkBtn.textContent = url;
    linkBtn.title = url;
    linkBtn.addEventListener("click", () => navigate(url));

    deleteBtn.addEventListener("click", () => {
      state.bookmarks = state.bookmarks.filter((item) => item !== url);
      persistBookmarks();
      renderBookmarks();
      setStatus(`Removed bookmark: ${url}`);
    });

    ui.bookmarksList.appendChild(listItem);
  }
}

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) => typeof entry === "string");
  } catch {
    return [];
  }
}

function persistBookmarks() {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(state.bookmarks));
}

function setStatus(message, isError = false) {
  ui.statusBar.textContent = message;
  ui.statusBar.style.color = isError ? "var(--danger)" : "var(--muted)";
}
