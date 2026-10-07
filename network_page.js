"use strict";

const byId = (id) => document.getElementById(id);
const formatNumber = new Intl.NumberFormat("en-US");

const COMMUNITY_COLORS = [
  "#77decf", "#8da7f0", "#f0bf75", "#cf9ee6",
  "#8cd9a6", "#e39ca6", "#88bfe3", "#c4cf89",
  "#c2a0e8", "#e5cb8a", "#a1d9d5", "#b6a9ed",
];
const networkState = {
  book: "all",
  measure: "connections",
  minimum: 5,
  showIsolated: false,
  showLabels: false,
  selected: null,
  graph: null,
};

const networkIndex = {
  mentionsByScope: new Map(),
  edgesByScope: new Map(),
  bookNumbers: [],
  characterNames: [],
  layouts: {},
};

function buildNetworkIndex(data) {

  networkIndex.bookNumbers = [...new Set(data.books.map((row) => row.book_number))].sort((a, b) => a - b);

  networkIndex.characterNames = data.profiles
    .map((profile) => profile.character)
    .sort((a, b) => a.localeCompare(b));

  networkIndex.layouts = data.network_layouts;
  networkIndex.mentionsByScope.clear();
  networkIndex.edgesByScope.clear();

  networkIndex.mentionsByScope.set("all", new Map());
  networkIndex.edgesByScope.set("all", new Map());

  for (const row of data.books) {
    const book = String(row.book_number);

    if (!networkIndex.mentionsByScope.has(book)) {
      networkIndex.mentionsByScope.set(book, new Map());
    }

    networkIndex.mentionsByScope.get(book).set(row.character, row.mentions);

    const allMentions = networkIndex.mentionsByScope.get("all");
    allMentions.set(
      row.character,
      (allMentions.get(row.character) || 0) + row.mentions
    );
  }

  for (const row of data.network) {
    const book = String(row.book_number);
    const key = `${row.character_a}\u0000${row.character_b}`;

    if (!networkIndex.edgesByScope.has(book)) {
      networkIndex.edgesByScope.set(book, new Map());
    }

    for (const scope of [book, "all"]) {
      const edges = networkIndex.edgesByScope.get(scope);

      if (!edges.has(key)) {
        edges.set(key, {
          a: row.character_a,
          b: row.character_b,
          connections: 0,
          same_block_connections: 0,
        });
      }

      const edge = edges.get(key);
      edge.connections += row.connections;
      edge.same_block_connections += row.same_block_connections;
    }
  }
}

function collectGraph() {
  const mentioned = networkIndex.mentionsByScope.get(networkState.book);
  const totals = networkIndex.edgesByScope.get(networkState.book);

  const edges = [...totals.values()].filter(
    (edge) => edge[networkState.measure] >= networkState.minimum);

  const connected = new Set(
    edges.flatMap((edge) => [edge.a, edge.b]));

  const names = [...mentioned]
    .filter(
      ([name, count]) =>
        count > 0 &&
        (networkState.showIsolated || connected.has(name)))
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));

  const namesSet = new Set(names);

  return {nodes: names.map((name) => ({
    name,
    mentions: mentioned.get(name),
    degree: 0,
    strength: 0,
  })),
    edges: edges.filter(
      (edge) =>
        namesSet.has(edge.a) &&
        namesSet.has(edge.b)),
  };
}


function refreshDetails() {
  const selected = networkState.selected;
  const graph = networkState.graph;
  const nameElement = byId("detail-name");
  const description = byId("detail-description");
  const profileLink = byId("open-profile");
  const clearButton = byId("clear-selection");
  const neighborsElement = byId("detail-neighbors");
  neighborsElement.replaceChildren();
  const node = graph.nodes.find((item) => item.name === selected);
  if (!selected || !node) {
    nameElement.textContent = "All characters";
    description.textContent =
      "Select a node or search for a character to highlight its links.";
    profileLink.hidden = true;
    clearButton.hidden = true;
    neighborsElement.textContent =
      "Choose a character to see their strongest links.";
    return;
  }

  const connections = graph.edges.filter((edge) => edge.a === selected || edge.b === selected)
    .map((edge) => ({ name: edge.a === selected ? edge.b : edge.a, strength: edge[networkState.measure] }))
    .sort((a, b) => b.strength - a.strength || a.name.localeCompare(b.name));
  nameElement.textContent = selected;
  description.textContent = `${formatNumber.format(node.mentions)} mentions in this selection · ${connections.length} visible connections`;
  profileLink.hidden = false;
  clearButton.hidden = false;
  profileLink.href = `./index.html?character=${encodeURIComponent(selected)}`;

  if (!connections.length) {
    neighborsElement.textContent = "No connections meet the current threshold.";
    return;
  }
  for (const connection of connections.slice(0, 25)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "detail-neighbor";
    const name = document.createElement("span");
    const count = document.createElement("strong");
    name.textContent = connection.name;
    count.textContent = formatNumber.format(connection.strength);
    button.append(name, count);
    button.addEventListener("click", () => selectCharacter(connection.name));
    neighborsElement.append(button);
  }
}

function drawGraph() {
  const graph = networkState.graph;
  const plot = byId("full-network-plot");
  const positions = graph.positions;

  const allPositions = [...positions.values()];
  const xExtent = Math.max(300,
    ...allPositions.map((point) => Math.abs(point.x)));

  const yExtent = Math.max(300,
    ...allPositions.map((point) => Math.abs(point.y)));

  const selected = networkState.selected;
  const selectedNeighbors = new Set([selected]);
  for (const edge of graph.edges) {
    if (edge.a === selected) selectedNeighbors.add(edge.b);
    if (edge.b === selected) selectedNeighbors.add(edge.a);
  }
  const largest = Math.max(1, ...graph.edges.map((edge) => edge[networkState.measure]));
  const edgeGroups = [
    { x: [], y: [] }, { x: [], y: [] }, { x: [], y: [] },
  ];
  const selectedEdges = { x: [], y: [] };
  for (const edge of graph.edges) {
    const a = positions.get(edge.a);
    const b = positions.get(edge.b);
    const fraction = edge[networkState.measure] / largest;
    const group = fraction >= 0.25 ? 2 : fraction >= 0.055 ? 1 : 0;
    const target = selected && (edge.a === selected || edge.b === selected)
      ? selectedEdges : edgeGroups[group];
    target.x.push(a.x, b.x, null);
    target.y.push(a.y, b.y, null);
  }
  const traces = [];
  for (let group = 0; group < 3; group += 1) {
    const packed = edgeGroups[group];
    traces.push({
      type: "scatter", mode: "lines",
      x: packed.x, y: packed.y,
      line: {
        color: selected
          ? [
              "rgba(70, 95, 110, 0.04)",
              "rgba(70, 95, 110, 0.08)",
              "rgba(70, 95, 110, 0.13)",
            ][group]
          : [
              "rgba(100, 145, 160, 0.08)",
              "rgba(110, 175, 180, 0.16)",
              "rgba(119, 222, 207, 0.35)",
            ][group],
        width: [0.55, 1.0, 1.7][group],
      },
      hoverinfo: "skip", showlegend: false,
    });
  }
  if (selectedEdges.x.length) {
    traces.push({
      type: "scatter", mode: "lines",
      x: selectedEdges.x, y: selectedEdges.y,
      line: { color: "rgba(119, 222, 207, 0.78)", width: 1.15 }, hoverinfo: "skip", showlegend: false,
    });
  }

  const maxMentions = Math.max(1, ...graph.nodes.map((node) => node.mentions));
  const labelSet = new Set(
    [...graph.nodes].sort((a, b) => b.strength - a.strength).slice(0, 8).map((node) => node.name)
  );
  const markerTrace = {
    type: "scattergl", mode: "markers+text", showlegend: false,
    x: graph.nodes.map((node) => positions.get(node.name).x),
    y: graph.nodes.map((node) => positions.get(node.name).y),
    text: graph.nodes.map((node) =>
      node.name !== selected &&
      (networkState.showLabels || labelSet.has(node.name))
        ? node.name
        : ""
    ),
    textposition: "top center",
    textfont: { color: "#cddfe3", size: 10 },
    marker: {
      size: graph.nodes.map((node) => 7 + 20 * Math.sqrt(node.mentions / maxMentions)),
      color: graph.nodes.map((node) =>
        selected === node.name
          ? "#efab72"
          : selected && selectedNeighbors.has(node.name)
            ? "#b8c7ff"
            : selected
              ? "#475662"
              : node.degree > 0
                ? COMMUNITY_COLORS[node.community % COMMUNITY_COLORS.length]
                : "#788b96"
      ),
      line: { color: "#1b333d", width: 1 },
    },
    customdata: graph.nodes.map((node) => node.name),
    hovertext: graph.nodes.map((node) =>
      `${node.name}<br>${formatNumber.format(node.mentions)} mentions<br>` +
      `${node.degree} visible neighbors · ${formatNumber.format(node.strength)} nearby-name pairs`
    ),
    hovertemplate: "%{hovertext}<extra></extra>",
  };
  traces.push(markerTrace);

  Plotly.react(plot, traces, {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#cddfe3", family: "system-ui" },
    margin: { t: 25, b: 25, l: 25, r: 25 },
    annotations: selected && positions.has(selected)
      ? [{
          x: positions.get(selected).x,
          y: positions.get(selected).y,
          xref: "x",
          yref: "y",
          text: `<b>${selected}</b>`,
          showarrow: false,
          xanchor: "center",
          yanchor: "bottom",
          yshift: 24,
          font: {
            color: "#ffffff",
            size: 15,
          },
          bgcolor: "#101a26",
          bordercolor: "#efab72",
          borderwidth: 1,
          borderpad: 6,
          opacity: 1,
        }]
      : [],

    xaxis: { visible: false, range: [-xExtent * 1.15, xExtent * 1.15], zeroline: false, },
    yaxis: { visible: false, range: [-yExtent * 1.15, yExtent * 1.15], scaleanchor: "x", scaleratio: 1, zeroline: false, },
    showlegend: false, hovermode: "closest", dragmode: "pan", uirevision: `network-${networkState.book}-${networkState.measure}-${networkState.minimum}-${networkState.showIsolated}`,
    hoverlabel: { bgcolor: "#1a2835", font: { color: "#e6ecee" } },
  }, {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
  }).then(() => {
    plot.removeAllListeners("plotly_click");
    plot.on("plotly_click", (event) => {
      const name = event.points?.[0]?.customdata;
      if (typeof name === "string") selectCharacter(name);
    });
  });
}

function selectCharacter(name) {
  if (!networkState.graph.nodes.some((node) => node.name === name)) return;
  networkState.selected = name;
  byId("full-search").value = name;
  refreshDetails();
  drawGraph();
}

function refreshGraph() {
  const graph = collectGraph();
  for (const node of graph.nodes) {
    node.degree = 0;
    node.strength = 0;
  }
  const lookup = new Map(graph.nodes.map((node) => [node.name, node]));
  for (const edge of graph.edges) {
    for (const name of [edge.a, edge.b]) {
      const node = lookup.get(name);
      node.degree += 1;
      node.strength += edge[networkState.measure];
    }
  }

  const layout = networkIndex.layouts[networkState.book];
  if (!layout) {
    throw new Error("Network layout missing. Rebuild with python -m src.build_dashboard");
  }
  graph.positions = new Map();
  for (const node of graph.nodes) {
    const coordinates = layout.positions[node.name];
    if (!coordinates) {
      throw new Error(`No precomputed position for ${node.name}`);
    }
    graph.positions.set(node.name, {
      x: coordinates[0], y: coordinates[1],
    });
    node.community = layout.communities[node.name] ?? -1;
  }
  networkState.graph = graph;
  if (!lookup.has(networkState.selected)) {
    networkState.selected = null;
    byId("full-search").value = "";
  }
  const bookText = networkState.book === "all" ? "All eight books" : `Book ${networkState.book}`;
  byId("network-summary").textContent =
    `${bookText} · ${graph.nodes.length} characters · ${formatNumber.format(graph.edges.length)} links ` +
    `· minimum ${networkState.minimum} ${networkState.measure === "connections" ? "20-word" : "same-block"} pairs` +
    ` · ${layout.community_count} proximity groups`;
  refreshDetails();
  drawGraph();
}

async function initializeNetwork() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error(`Could not load data.json (${response.status})`);
    const data = await response.json();
    buildNetworkIndex(data);
    if (typeof Plotly === "undefined") throw new Error("The bundled Plotly library did not load");
    for (const book of networkIndex.bookNumbers) {
      byId("full-book").add(new Option(`Book ${book}`, String(book)));
    }
    for (const character of networkIndex.characterNames) {
      const option = document.createElement("option");
      option.value = character;
      byId("network-characters").append(option);}
    byId("full-book").addEventListener("change", (event) => {
      networkState.book = event.target.value;
      refreshGraph();
    });
    byId("full-measure").addEventListener("change", (event) => {
      networkState.measure = event.target.value;
      refreshGraph();
    });
    byId("full-minimum").addEventListener("change", (event) => {
      const value = Number(event.target.value);

      if (!Number.isSafeInteger(value) || value < 1) {
        event.target.value = networkState.minimum;
        return;
      }

      networkState.minimum = value;
      refreshGraph();
    });
    byId("show-isolated").addEventListener("change", (event) => {
      networkState.showIsolated = event.target.checked;
      refreshGraph();
    });
    byId("show-labels").addEventListener("change", (event) => {
      networkState.showLabels = event.target.checked;
      drawGraph();
    });
    const search = byId("full-search");
    const commitSearch = () => {
      const name = search.value.trim();
      const exact = networkState.graph.nodes.find((node) => node.name.toLowerCase() === name.toLowerCase());
      if (exact) selectCharacter(exact.name);
    };
    search.addEventListener("change", commitSearch);
    search.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); commitSearch(); }
    });
    byId("clear-selection").addEventListener("click", () => {
      networkState.selected = null;
      search.value = "";
      refreshDetails();
      drawGraph();
    });
    refreshGraph();
  } catch (error) {
    const message = byId("network-error");
    message.hidden = false;
    message.textContent = `Network failed to load: ${error.message}`;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", initializeNetwork);
