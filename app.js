const presets = {
  "sql-single": {
    splitBy: "lines",
    quote: "single",
    joinWith: "comma",
    prefix: "IN (",
    suffix: ")",
    trimItems: true,
    removeEmpty: true,
    removeBackslashes: false,
    dedupe: false,
    escapeQuotes: true,
    removePatterns: "",
    removeMode: "none",
    caseSensitiveRemove: false,
    outputMode: "transform",
    rankingTop: 10,
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
    removeBackslashes: false,
    dedupe: false,
    escapeQuotes: true,
    removePatterns: "",
    removeMode: "none",
    caseSensitiveRemove: false,
    outputMode: "transform",
    rankingTop: 10,
    caseMode: "keep",
  },
  "plain-comma": {
    splitBy: "lines",
    quote: "none",
    joinWith: "comma",
    prefix: "",
    suffix: "",
    trimItems: true,
    removeEmpty: true,
    removeBackslashes: false,
    dedupe: false,
    escapeQuotes: false,
    removePatterns: "",
    removeMode: "none",
    caseSensitiveRemove: false,
    outputMode: "transform",
    rankingTop: 10,
    caseMode: "keep",
  },
  "one-line": {
    splitBy: "lines",
    quote: "none",
    joinWith: "space",
    prefix: "",
    suffix: "",
    trimItems: true,
    removeEmpty: true,
    removeBackslashes: false,
    dedupe: false,
    escapeQuotes: false,
    removePatterns: "",
    removeMode: "none",
    caseSensitiveRemove: false,
    outputMode: "transform",
    rankingTop: 10,
    caseMode: "keep",
  },
  "clean-lines": {
    splitBy: "lines",
    quote: "none",
    joinWith: "line",
    prefix: "",
    suffix: "",
    trimItems: true,
    removeEmpty: true,
    removeBackslashes: false,
    dedupe: true,
    escapeQuotes: false,
    removePatterns: "",
    removeMode: "none",
    caseSensitiveRemove: false,
    outputMode: "transform",
    rankingTop: 10,
    caseMode: "keep",
  },
};

const nodes = {
  input: document.querySelector("#inputText"),
  output: document.querySelector("#outputText"),
  counter: document.querySelector("#counter"),
  copyBtn: document.querySelector("#copyBtn"),
  pasteBtn: document.querySelector("#pasteBtn"),
  prefix: document.querySelector("#prefix"),
  suffix: document.querySelector("#suffix"),
  trimItems: document.querySelector("#trimItems"),
  removeEmpty: document.querySelector("#removeEmpty"),
  removeBackslashes: document.querySelector("#removeBackslashes"),
  dedupe: document.querySelector("#dedupe"),
  escapeQuotes: document.querySelector("#escapeQuotes"),
  removePatterns: document.querySelector("#removePatterns"),
  caseSensitiveRemove: document.querySelector("#caseSensitiveRemove"),
  rankingTop: document.querySelector("#rankingTop"),
};

function selected(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function setRadio(name, value) {
  document.querySelector(`input[name="${name}"][value="${value}"]`).checked = true;
}

function applyPreset(name) {
  const preset = presets[name];
  setRadio("splitBy", preset.splitBy);
  setRadio("quote", preset.quote);
  setRadio("joinWith", preset.joinWith);
  setRadio("caseMode", preset.caseMode);
  setRadio("removeMode", preset.removeMode);
  setRadio("outputMode", preset.outputMode);
  nodes.prefix.value = preset.prefix;
  nodes.suffix.value = preset.suffix;
  nodes.trimItems.checked = preset.trimItems;
  nodes.removeEmpty.checked = preset.removeEmpty;
  nodes.removeBackslashes.checked = preset.removeBackslashes;
  nodes.dedupe.checked = preset.dedupe;
  nodes.escapeQuotes.checked = preset.escapeQuotes;
  nodes.removePatterns.value = preset.removePatterns;
  nodes.caseSensitiveRemove.checked = preset.caseSensitiveRemove;
  nodes.rankingTop.value = preset.rankingTop;

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

function removePatterns() {
  const patterns = nodes.removePatterns.value
    .split(/\r?\n/)
    .map((pattern) => pattern.trim())
    .filter(Boolean);

  if (nodes.caseSensitiveRemove.checked) return patterns;
  return patterns.map((pattern) => pattern.toLowerCase());
}

function containsPattern(value, patterns) {
  const haystack = nodes.caseSensitiveRemove.checked ? value : value.toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern));
}

function removeTextPatterns(value, patterns) {
  return patterns.reduce((current, pattern) => {
    const flags = nodes.caseSensitiveRemove.checked ? "g" : "gi";
    return current.replaceAll(new RegExp(escapeRegExp(pattern), flags), "");
  }, value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanValues() {
  let values = splitInput(nodes.input.value, selected("splitBy"));

  if (nodes.trimItems.checked) {
    values = values.map((value) => value.trim());
  }

  if (nodes.removeEmpty.checked) {
    values = values.filter(Boolean);
  }

  if (nodes.removeBackslashes.checked) {
    values = values.map((value) => value.replaceAll("\\", ""));
  }

  const patterns = removePatterns();
  const removeMode = selected("removeMode");

  if (patterns.length && removeMode === "line") {
    values = values.filter((value) => !containsPattern(value, patterns));
  }

  if (patterns.length && removeMode === "text") {
    values = values.map((value) => removeTextPatterns(value, patterns));
  }

  values = values.map((value) => applyCase(value, selected("caseMode")));

  if (nodes.trimItems.checked) {
    values = values.map((value) => value.trim());
  }

  if (nodes.removeEmpty.checked) {
    values = values.filter(Boolean);
  }

  return values;
}

function rankingOutput(values) {
  const top = Math.max(1, Number.parseInt(nodes.rankingTop.value, 10) || 10);
  const counts = new Map();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([value, count], index) => `${index + 1}. ${value} | ${count}`);

  nodes.output.value = rows.join("\n");
  nodes.counter.textContent = `${counts.size} ${counts.size === 1 ? "texto unico" : "textos unicos"}`;
}

function transform() {
  const quoteMode = selected("quote");
  let values = cleanValues();

  if (selected("outputMode") === "ranking") {
    rankingOutput(values);
    return;
  }

  if (nodes.dedupe.checked) {
    values = uniqueValues(values);
  }

  const body = values.map((value) => wrapValue(value, quoteMode)).join(joiner(selected("joinWith")));
  nodes.output.value = `${nodes.prefix.value}${body}${nodes.suffix.value}`;
  nodes.counter.textContent = `${values.length} ${values.length === 1 ? "valor" : "valores"}`;
}

async function copyOutput() {
  await navigator.clipboard.writeText(nodes.output.value);
  nodes.copyBtn.textContent = "Copiado";
  nodes.copyBtn.classList.add("copied");
  window.setTimeout(() => {
    nodes.copyBtn.textContent = "Copiar";
    nodes.copyBtn.classList.remove("copied");
  }, 1000);
}

async function pasteInput() {
  nodes.input.value = await navigator.clipboard.readText();
  transform();
}

function runQuickAction(action) {
  if (action === "clear") {
    nodes.input.value = "";
    transform();
    nodes.input.focus();
  }

  if (action === "swap") {
    nodes.input.value = nodes.output.value;
    transform();
  }

  if (action === "sample") {
    nodes.input.value = "Santiago\nValparaiso\nConcepcion\nSantiago\n  La Serena  ";
    applyPreset("sql-single");
  }

  if (action === "sample-remove-lines") {
    nodes.input.value = "cliente_activo\ncliente_test\ncliente_demo\ncliente_final\nbackup_cliente";
    applyPreset("clean-lines");
    nodes.removePatterns.value = "test\ndemo\nbackup";
    setRadio("removeMode", "line");
    transform();
  }

  if (action === "sample-remove-text") {
    nodes.input.value = "ID: 1001\nID: 1002\nID: 1003";
    applyPreset("plain-comma");
    nodes.removePatterns.value = "ID:";
    setRadio("removeMode", "text");
    transform();
  }

  if (action === "sample-backslashes") {
    nodes.input.value = '{\\"id\\":123,\\"estado\\":\\"OK\\"}\n{\\"id\\":124,\\"estado\\":\\"ERROR\\"}';
    applyPreset("clean-lines");
    nodes.removeBackslashes.checked = true;
    transform();
  }

  if (action === "sample-ranking") {
    nodes.input.value = "ERROR_TIMEOUT\nOK\nERROR_TIMEOUT\nERROR_AUTH\nOK\nOK\nERROR_AUTH";
    applyPreset("clean-lines");
    setRadio("outputMode", "ranking");
    nodes.rankingTop.value = "3";
    transform();
  }
}

document.querySelectorAll("input, textarea").forEach((element) => {
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
nodes.pasteBtn.addEventListener("click", pasteInput);

nodes.input.value = "abc\nxyz\n  prueba  ";
applyPreset("sql-single");
