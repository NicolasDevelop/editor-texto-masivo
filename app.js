const presets = {
  "sql-single": {
    splitBy: "lines",
    quote: "single",
    joinWith: "comma",
    prefix: "IN (",
    suffix: ")",
    trimItems: true,
    removeEmpty: true,
    dedupe: false,
    escapeQuotes: true,
    caseMode: "keep",
  },
  "sql-double": {
    splitBy: "lines",
    quote: "double",
    joinWith: "comma",
    prefix: "IN (",
    suffix: ")",
    trimItems: true,
    removeEmpty: true,
    dedupe: false,
    escapeQuotes: true,
    caseMode: "keep",
  },
  "sql-number": {
    splitBy: "lines",
    quote: "none",
    joinWith: "comma",
    prefix: "IN (",
    suffix: ")",
    trimItems: true,
    removeEmpty: true,
    dedupe: false,
    escapeQuotes: false,
    caseMode: "keep",
  },
};

const nodes = {
  themeToggle: document.querySelector("#themeToggle"),
  input: document.querySelector("#inputText"),
  output: document.querySelector("#outputText"),
  counter: document.querySelector("#counter"),
  copyBtn: document.querySelector("#copyBtn"),
  pasteBtn: document.querySelector("#pasteBtn"),
  findText: document.querySelector("#findText"),
  findCaseSensitive: document.querySelector("#findCaseSensitive"),
  selectAllMatchesBtn: document.querySelector("#selectAllMatchesBtn"),
  clearCursorsBtn: document.querySelector("#clearCursorsBtn"),
  matchCounter: document.querySelector("#matchCounter"),
  prefix: document.querySelector("#prefix"),
  suffix: document.querySelector("#suffix"),
  trimItems: document.querySelector("#trimItems"),
  removeEmpty: document.querySelector("#removeEmpty"),
  dedupe: document.querySelector("#dedupe"),
  escapeQuotes: document.querySelector("#escapeQuotes"),
  deleteInput: document.querySelector("#deleteInput"),
  deletePatterns: document.querySelector("#deletePatterns"),
  deleteOutput: document.querySelector("#deleteOutput"),
  deleteMode: document.querySelector("#deleteMode"),
  deleteCaseSensitive: document.querySelector("#deleteCaseSensitive"),
  deleteCounter: document.querySelector("#deleteCounter"),
  deleteLinesSampleBtn: document.querySelector("#deleteLinesSampleBtn"),
  deleteTextSampleBtn: document.querySelector("#deleteTextSampleBtn"),
  copyDeleteBtn: document.querySelector("#copyDeleteBtn"),
  backslashInput: document.querySelector("#backslashInput"),
  backslashOutput: document.querySelector("#backslashOutput"),
  backslashCounter: document.querySelector("#backslashCounter"),
  backslashSampleBtn: document.querySelector("#backslashSampleBtn"),
  copyBackslashBtn: document.querySelector("#copyBackslashBtn"),
  rankingInput: document.querySelector("#rankingInput"),
  rankingOutput: document.querySelector("#rankingOutput"),
  rankingSplitBy: document.querySelector("#rankingSplitBy"),
  rankingTop: document.querySelector("#rankingTop"),
  rankingTrim: document.querySelector("#rankingTrim"),
  rankingIgnoreCase: document.querySelector("#rankingIgnoreCase"),
  rankingCounter: document.querySelector("#rankingCounter"),
  rankingSampleBtn: document.querySelector("#rankingSampleBtn"),
  rankingDedupeBtn: document.querySelector("#rankingDedupeBtn"),
  copyRankingBtn: document.querySelector("#copyRankingBtn"),
};

let mainEditor = null;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  nodes.themeToggle.textContent = theme === "dark" ? "Modo claro" : "Modo oscuro";
  nodes.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  localStorage.setItem("text-tool-theme", theme);
  window.setTimeout(() => mainEditor?.refresh(), 0);
}

function initTheme() {
  const savedTheme = localStorage.getItem("text-tool-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function initMainEditor() {
  mainEditor = CodeMirror.fromTextArea(nodes.input, {
    lineNumbers: true,
    lineWrapping: false,
    keyMap: "sublime",
    viewportMargin: 20,
    showCursorWhenSelecting: true,
    screenReaderLabel: "Entrada de texto",
    configureMouse: (_editor, _repeat, event) => {
      if (!event.altKey) return null;
      return { unit: "rectangle", extend: false, addNew: false };
    },
  });

  mainEditor.on("change", () => {
    transform();
    updateMatchCounter();
  });
}

function mainInputValue() {
  return mainEditor ? mainEditor.getValue() : nodes.input.value;
}

function setMainInput(value, focus = false) {
  if (mainEditor) {
    mainEditor.setValue(value);
    if (focus) mainEditor.focus();
    return;
  }

  nodes.input.value = value;
  transform();
}

function selected(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function setRadio(name, value) {
  document.querySelector(`input[name="${name}"][value="${value}"]`).checked = true;
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;

  setRadio("splitBy", preset.splitBy);
  setRadio("quote", preset.quote);
  setRadio("joinWith", preset.joinWith);
  setRadio("caseMode", preset.caseMode);
  nodes.prefix.value = preset.prefix;
  nodes.suffix.value = preset.suffix;
  nodes.trimItems.checked = preset.trimItems;
  nodes.removeEmpty.checked = preset.removeEmpty;
  nodes.dedupe.checked = preset.dedupe;
  nodes.escapeQuotes.checked = preset.escapeQuotes;

  document.querySelectorAll(".preset").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === name);
  });
  transform();
}

function splitInput(text, mode) {
  if (mode === "commas") return text.split(",");
  if (mode === "spaces") return text.split(/\s+/);
  return text.split(/\r?\n/);
}

function applyCase(value, mode) {
  if (mode === "upper") return value.toUpperCase();
  if (mode === "lower") return value.toLowerCase();
  return value;
}

function escapeForQuote(value, quoteMode) {
  if (!nodes.escapeQuotes.checked) return value;
  if (quoteMode === "single") return value.replaceAll("'", "''");
  if (quoteMode === "double") return value.replaceAll('"', '""');
  return value;
}

function wrapValue(value, quoteMode) {
  if (quoteMode === "single") return `'${escapeForQuote(value, quoteMode)}'`;
  if (quoteMode === "double") return `"${escapeForQuote(value, quoteMode)}"`;
  return value;
}

function joiner(mode) {
  if (mode === "comma") return ",";
  if (mode === "comma-space") return ", ";
  if (mode === "line") return "\n";
  return " ";
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternList(text, caseSensitive) {
  const patterns = text
    .split(/\r?\n/)
    .map((pattern) => pattern.trim())
    .filter(Boolean);

  if (caseSensitive) return patterns;
  return patterns.map((pattern) => pattern.toLowerCase());
}

function containsPattern(value, patterns, caseSensitive) {
  const haystack = caseSensitive ? value : value.toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern));
}

function removeTextPatterns(value, patterns, caseSensitive) {
  return patterns.reduce((current, pattern) => {
    const flags = caseSensitive ? "g" : "gi";
    return current.replaceAll(new RegExp(escapeRegExp(pattern), flags), "");
  }, value);
}

function cleanValues() {
  let values = splitInput(mainInputValue(), selected("splitBy"));

  if (nodes.trimItems.checked) values = values.map((value) => value.trim());
  if (nodes.removeEmpty.checked) values = values.filter(Boolean);

  values = values.map((value) => applyCase(value, selected("caseMode")));

  if (nodes.trimItems.checked) values = values.map((value) => value.trim());
  if (nodes.removeEmpty.checked) values = values.filter(Boolean);

  return values;
}

function transform() {
  const quoteMode = selected("quote");
  let values = cleanValues();

  if (nodes.dedupe.checked) values = uniqueValues(values);

  const body = values.map((value) => wrapValue(value, quoteMode)).join(joiner(selected("joinWith")));
  nodes.output.value = `${nodes.prefix.value}${body}${nodes.suffix.value}`;
  nodes.counter.textContent = `${values.length} ${values.length === 1 ? "valor" : "valores"}`;
}

function searchQuery() {
  const typed = nodes.findText.value;
  if (typed) return typed;
  if (!mainEditor) return "";

  const selection = mainEditor.getSelection();
  if (!selection || selection.includes("\n")) return "";
  nodes.findText.value = selection;
  return selection;
}

function findMatchRanges(query) {
  if (!mainEditor || !query) return [];

  const cursor = mainEditor.getSearchCursor(query, CodeMirror.Pos(0, 0), {
    caseFold: !nodes.findCaseSensitive.checked,
    multiline: true,
  });
  const ranges = [];

  while (cursor.findNext()) {
    ranges.push({ anchor: cursor.from(), head: cursor.to() });
  }

  return ranges;
}

function updateMatchCounter() {
  const query = nodes.findText.value;
  const total = query ? findMatchRanges(query).length : 0;
  nodes.matchCounter.textContent = `${total} ${total === 1 ? "coincidencia" : "coincidencias"}`;
}

function selectAllMatches() {
  const query = searchQuery();
  const ranges = findMatchRanges(query);

  if (!ranges.length) {
    updateMatchCounter();
    nodes.findText.focus();
    return;
  }

  mainEditor.setSelections(ranges, 0);
  mainEditor.scrollIntoView(ranges[0]);
  mainEditor.focus();
  nodes.matchCounter.textContent = `${ranges.length} ${ranges.length === 1 ? "coincidencia" : "coincidencias"}`;
}

function clearExtraCursors() {
  const cursor = mainEditor.getCursor("head");
  mainEditor.setCursor(cursor);
  mainEditor.focus();
}

async function copyOutput() {
  await copyTextFrom(nodes.output, nodes.copyBtn, "Copiar IN");
}

async function pasteInput() {
  setMainInput(await navigator.clipboard.readText(), true);
}

async function copyTextFrom(node, button, originalText = button.textContent) {
  await navigator.clipboard.writeText(node.value);
  button.textContent = "Copiado";
  button.classList.add("copied");
  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("copied");
  }, 1000);
}

function transformBackslashes() {
  const input = nodes.backslashInput.value;
  const removed = (input.match(/\\/g) || []).length;
  nodes.backslashOutput.value = input.replaceAll("\\", "");
  nodes.backslashCounter.textContent = `${removed} ${removed === 1 ? "backslash removido" : "backslash removidos"}`;
}

function transformDelete() {
  const lines = nodes.deleteInput.value.split(/\r?\n/);
  const caseSensitive = nodes.deleteCaseSensitive.checked;
  const patterns = patternList(nodes.deletePatterns.value, caseSensitive);

  if (!patterns.length) {
    nodes.deleteOutput.value = nodes.deleteInput.value;
    nodes.deleteCounter.textContent = "0 cambios";
    return;
  }

  if (nodes.deleteMode.value === "line") {
    const kept = lines.filter((line) => !containsPattern(line, patterns, caseSensitive));
    const removed = lines.length - kept.length;
    nodes.deleteOutput.value = kept.join("\n");
    nodes.deleteCounter.textContent = `${removed} ${removed === 1 ? "fila borrada" : "filas borradas"}`;
    return;
  }

  let changes = 0;
  const output = lines.map((line) => {
    const next = removeTextPatterns(line, patterns, caseSensitive);
    if (next !== line) changes += 1;
    return next;
  });

  nodes.deleteOutput.value = output.join("\n");
  nodes.deleteCounter.textContent = `${changes} ${changes === 1 ? "fila modificada" : "filas modificadas"}`;
}

function rankingValues() {
  let values = splitInput(nodes.rankingInput.value, nodes.rankingSplitBy.value);

  if (nodes.rankingTrim.checked) values = values.map((value) => value.trim());
  values = values.filter(Boolean);
  if (nodes.rankingIgnoreCase.checked) values = values.map((value) => value.toLowerCase());

  return values;
}

function joinRankingValues(values) {
  if (nodes.rankingSplitBy.value === "commas") return values.join(",");
  if (nodes.rankingSplitBy.value === "spaces") return values.join(" ");
  return values.join("\n");
}

function dedupeRankingInput() {
  const seen = new Set();
  const unique = [];

  rankingValues().forEach((value) => {
    const key = nodes.rankingIgnoreCase.checked ? value.toLowerCase() : value;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(value);
  });

  nodes.rankingInput.value = joinRankingValues(unique);
  transformRanking();
}

function transformRanking() {
  const top = Math.max(1, Number.parseInt(nodes.rankingTop.value, 10) || 10);
  const counts = new Map();

  rankingValues().forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([value, count]) => `${value} | ${count}`);

  nodes.rankingOutput.value = rows.join("\n");
  nodes.rankingCounter.textContent = `${counts.size} ${counts.size === 1 ? "texto unico" : "textos unicos"}`;
}

function runQuickAction(action) {
  if (action === "clear") setMainInput("", true);
  if (action === "swap") setMainInput(nodes.output.value, true);
  if (action === "sample") {
    setMainInput("Santiago\nValparaiso\nConcepcion\nSantiago\n  La Serena  ", true);
    applyPreset("sql-single");
  }
}

document.querySelectorAll(".advanced-options input").forEach((element) => {
  element.addEventListener("input", transform);
  element.addEventListener("change", transform);
});

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => runQuickAction(button.dataset.action));
});

nodes.copyBtn.addEventListener("click", copyOutput);
nodes.themeToggle.addEventListener("click", toggleTheme);
nodes.pasteBtn.addEventListener("click", pasteInput);
nodes.findText.addEventListener("input", updateMatchCounter);
nodes.findText.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  selectAllMatches();
});
nodes.findCaseSensitive.addEventListener("change", updateMatchCounter);
nodes.selectAllMatchesBtn.addEventListener("click", selectAllMatches);
nodes.clearCursorsBtn.addEventListener("click", clearExtraCursors);

nodes.deleteInput.addEventListener("input", transformDelete);
nodes.deletePatterns.addEventListener("input", transformDelete);
nodes.deleteMode.addEventListener("change", transformDelete);
nodes.deleteCaseSensitive.addEventListener("change", transformDelete);
nodes.deleteLinesSampleBtn.addEventListener("click", () => {
  nodes.deleteInput.value = "cliente_activo\ncliente_test\ncliente_demo\ncliente_final\nbackup_cliente";
  nodes.deletePatterns.value = "test\ndemo\nbackup";
  nodes.deleteMode.value = "line";
  transformDelete();
});
nodes.deleteTextSampleBtn.addEventListener("click", () => {
  nodes.deleteInput.value = "ID: 1001\nID: 1002\nID: 1003";
  nodes.deletePatterns.value = "ID:";
  nodes.deleteMode.value = "text";
  transformDelete();
});
nodes.copyDeleteBtn.addEventListener("click", () => copyTextFrom(nodes.deleteOutput, nodes.copyDeleteBtn));

nodes.backslashInput.addEventListener("input", transformBackslashes);
nodes.backslashSampleBtn.addEventListener("click", () => {
  nodes.backslashInput.value = '{\\"id\\":123,\\"estado\\":\\"OK\\"}\n{\\"id\\":124,\\"estado\\":\\"ERROR\\"}';
  transformBackslashes();
});
nodes.copyBackslashBtn.addEventListener("click", () => copyTextFrom(nodes.backslashOutput, nodes.copyBackslashBtn));

nodes.rankingInput.addEventListener("input", transformRanking);
nodes.rankingSplitBy.addEventListener("change", transformRanking);
nodes.rankingTop.addEventListener("input", transformRanking);
nodes.rankingTrim.addEventListener("change", transformRanking);
nodes.rankingIgnoreCase.addEventListener("change", transformRanking);
nodes.rankingSampleBtn.addEventListener("click", () => {
  nodes.rankingInput.value = "ERROR_TIMEOUT\nOK\nERROR_TIMEOUT\nERROR_AUTH\nOK\nOK\nERROR_AUTH";
  nodes.rankingTop.value = "3";
  transformRanking();
});
nodes.rankingDedupeBtn.addEventListener("click", dedupeRankingInput);
nodes.copyRankingBtn.addEventListener("click", () => copyTextFrom(nodes.rankingOutput, nodes.copyRankingBtn));

initTheme();
initMainEditor();
setMainInput("abc\nxyz\n  prueba  ");
applyPreset("sql-single");
transformDelete();
transformBackslashes();
transformRanking();
