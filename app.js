"use strict";

const state = {
  character: "Carl",
  book: "all",
  metric: "mentions",
  chapter: null,
};

const dataIndex = {
  profilesByCharacter: new Map(),
  booksByCharacter: new Map(),
  activityByCharacter: new Map(),
  networkByCharacter: new Map(),
  mentionsByBook: new Map(),
  seriesMentions: new Map(),
  chaptersByBook: new Map(),
  characterNames: [],
  bookNumbers: [],
};

const comparison = {
  characters: [],
  style: "line",
  mode: "top10",
  scopeBook: null,
};

const comparisonColors = [
  "#ff595e",
  "#4ade80",
  "#60a5fa",
  "#fbbf24",
  "#c084fc",
  "#22d3ee",
  "#fb923c",
  "#f472b6",
  "#a3e635",
  "#e879f9",
];

const heatColors = [
  "#2558a8",
  "#278bc0",
  "#22b5bb",
  "#9edb72",
  "#ffce58",
  "#ed7850",
];

const comparisonEasterEggs = [
  {
    "characters": [
      "Donut",
      "Rezan"
    ],
    "quote": "WHY DIDN'T YOUR MOTHER DRIBBLE YOU BACK OUT ONTO THE TRUCK STOP BATHROOM FLOOR, REZAN?",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Donut",
      "Zev"
    ],
    "quote": "ZEV, AM I GETTING ANY OF THIS ILLICIT BUTTHOLE MONEY?",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Samantha",
      "Charles"
    ],
    "quote": "Fear is a powerful aphrodisiac, Carl.",
    "speaker": "Samantha"
  },
  {
    "characters": [
      "Donut",
      "Uzi Jesus"
    ],
    "quote": "Don’t gaslight me Jesus!",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Mongo",
      "Kiwi"
    ],
    "quote": "She’s too old and gross for him, Carl. I’m going to hit her with a magic missile.",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Carl",
      "Quasar"
    ],
    "quote": "Okay, buddy. We gotta be quick. You are balls deep in the wrong hole, and mom is pulling into the driveway. You get me?",
    "speaker": "Quasar"
  },
  {
    "characters": [
      "Prepotente",
      "Carl"
    ],
    "quote": "THERE WILL BE NO MORE WARM HUGS FROM ME.",
    "speaker": "Prepotente"
  },
  {
    "characters": [
      "Donut",
      "Damascus Steel"
    ],
    "quote": "I can't be held accountable for everything I've ever said to a stripper.",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Carl",
      "Tsarina Signet"
    ],
    "quote": "HE HAS AN ERECTION, MORDECAI! IT'S VERY INAPPROPRIATE! MONGO IS APPALLED!",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Carl",
      "Vrah"
    ],
    "quote": "Trust me on this. You don’t want Enthusiastic Double Gonorrhea.",
    "speaker": "System AI"
  },
  {
    "characters": [
      "Bea",
      "Donut"
    ],
    "quote": "You’re not my person anymore",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Mordecai",
      "Chaco"
    ],
    "quote": "You MOTHERFUCKER!",
    "speaker": "Mordecai"
  },
  {
    "characters": [
      "Miriam",
      "Prepotente"
    ],
    "quote": "Your a good boy, my sweet little Pony. You're a good, smart boy.",
    "speaker": "Miriam Dom"
  },
  {
    "characters": [
      "Stalwart",
      "Donut"
    ],
    "quote": "I'M SORRY, BUT YOU ARE MUCH TOO POOR TO BE TALKING TO ME LIKE THIS.",
    "speaker": "Donut"
  },
  {
    "characters": [
      "Raul",
      "Carl"
    ],
    "quote": "I need a baby seal!",
    "speaker": "Raul"
  },
  {
    characters: ["Alpha Carl", "Raul"],
    quote: "All right. You're gonna have to explain what that crab is doing.",
    speaker: "Alpha Carl"
  },
  {
  characters: ["Donut", "Katia"],
  quote: "Honestly Katia, if you need a sanitary napkin, just ask.",
  speaker: "Donut"
  },
  {
  characters: ["Donut", "Sister Ines"],
  quote: "Mongo, eat the nun!",
  speaker: "Donut"
  },
  {
    "characters": [
      "Carl",
      "Donut"
    ],
    "quote": "You know how I feel about pointless data, Carl",
    "speaker": "Not Donut"
  }
];

let comparisonPlotQueue = Promise.resolve();
let comparisonPlotVersion = 0;

const byId = (id) => document.getElementById(id);
const integer = new Intl.NumberFormat("en-US");
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function buildDataIndex(data) {
  dataIndex.profilesByCharacter = new Map(
    data.profiles.map((profile) => [profile.character, profile])
  );

  dataIndex.characterNames = [...dataIndex.profilesByCharacter.keys()]
    .sort((a, b) => a.localeCompare(b));

  dataIndex.bookNumbers = [...new Set(
    data.chapters.map((chapter) => chapter.book_number)
  )].sort((a, b) => a - b);

  dataIndex.chaptersByBook.clear();
  for (const chapter of data.chapters) {
    if (!dataIndex.chaptersByBook.has(chapter.book_number)) {
      dataIndex.chaptersByBook.set(chapter.book_number, []);
    }

    dataIndex.chaptersByBook.get(chapter.book_number).push(chapter);
  }

  dataIndex.booksByCharacter.clear();
  dataIndex.mentionsByBook.clear();
  dataIndex.seriesMentions.clear();

  for (const row of data.books) {
    if (!dataIndex.booksByCharacter.has(row.character)) {
      dataIndex.booksByCharacter.set(row.character, []);
    }

    dataIndex.booksByCharacter.get(row.character).push(row);

    if (!dataIndex.mentionsByBook.has(row.book_number)) {
      dataIndex.mentionsByBook.set(row.book_number, new Map());
    }

    dataIndex.mentionsByBook.get(row.book_number)
      .set(row.character, row.mentions);

    dataIndex.seriesMentions.set(
      row.character,
      (dataIndex.seriesMentions.get(row.character) || 0) + row.mentions);
    }

  for (const rows of dataIndex.booksByCharacter.values()) {rows.sort((a, b) => a.book_number - b.book_number);
  }

  dataIndex.activityByCharacter.clear();
  for (const row of data.activity) {
    if (!dataIndex.activityByCharacter.has(row.character)) {
      dataIndex.activityByCharacter.set(row.character, new Map());
    }

    dataIndex.activityByCharacter
      .get(row.character)
      .set(row.global_chapter, row);
  }

  dataIndex.networkByCharacter.clear();
  for (const row of data.network) {
    for (const character of [row.character_a, row.character_b]) {
      if (!dataIndex.networkByCharacter.has(character)) {
        dataIndex.networkByCharacter.set(character, []);}

      dataIndex.networkByCharacter.get(character).push(row);}}}

function chapterLabel(book, chapter, label) {
  return `Book ${book}, ${label || `chapter ${chapter}`}`;
}

function setCharacter(name, clearSearch = true) {
  state.character = name;
  state.chapter = null;

  if (clearSearch) {
    byId("character-search").value = "";
    populateCharacters();
  }

  byId("character-select").value = name;
  render();
}

function populateCharacters(query = "") {
  const select = byId("character-select");

  const matching = dataIndex.characterNames.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  select.replaceChildren();

  if (!matching.length) {
    select.add(new Option("No matching characters", ""));
    select.disabled = true;
    return matching;
  }

  select.disabled = false;

  if (!matching.includes(state.character)) {
    const placeholder = new Option(
      "Select a character…",
      ""
    );

    placeholder.disabled = true;
    placeholder.selected = true;
    select.add(placeholder);
  }

  for (const name of matching) {
    select.add(new Option(name, name));
  }

  if (matching.includes(state.character)) {
    select.value = state.character;
  }

  return matching;
}

function renderStats(profile) {
  byId("total-mentions").textContent = integer.format(profile.total_mentions);
  byId("chapters-mentioned").textContent = integer.format(profile.chapters_mentioned);
  byId("first-mention").textContent = profile.first_book == null
    ? "Not recorded" : `Book ${profile.first_book}`;
  byId("longest-gap").textContent = `${integer.format(profile.longest_absence_chapters)} chapters`;

  byId("profile-name").textContent = profile.character;
  byId("profile-first").textContent = profile.first_book == null
    ? "Not recorded"
    : `${chapterLabel(profile.first_book, profile.first_chapter, profile.first_chapter_label)} · word ${integer.format(profile.first_word + 1)}`;
  byId("profile-last").textContent = profile.last_book == null
    ? "Not recorded"
    : `${chapterLabel(profile.last_book, profile.last_chapter, profile.last_chapter_label)} · word ${integer.format(profile.last_word + 1)}`;
  byId("profile-absences").textContent = integer.format(profile.absence_periods);
  byId("profile-longest").textContent = `${integer.format(profile.longest_absence_chapters)} chapters`;
}

function renderChart() {
  const rows = dataIndex.booksByCharacter.get(state.character) ?? [];
  const metric = state.metric;
  const chart = byId("book-chart");

  Plotly.react(chart, [{
    type: "bar",
    x: rows.map((row) => `Book ${row.book_number}`),
    y: rows.map((row) => row[metric]),
    customdata: rows.map((row) => row.book_number),
    marker: {
      color: rows.map((row) => (
        state.book === "all" || Number(state.book) === row.book_number
          ? "#77decf" : "#34525b"
      )),
      line: { width: 0 },
    },
    hovertemplate: metric === "mentions"
      ? "%{x}: %{y:,} mentions<extra></extra>"
      : "%{x}: %{y:.2f} per 10,000 words<extra></extra>",
  }], {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#a1b3ba", family: "system-ui" },
    margin: { t: 12, b: 42, l: 53, r: 8 },
    bargap: 0.32,
    yaxis: {
      title: { text: metric === "mentions" ? "Mentions" : "Per 10k words" },
      gridcolor: "#293846", zeroline: false,
    },
    xaxis: { fixedrange: true },
    showlegend: false,
    hoverlabel: { bgcolor: "#1a2835", font: { color: "#e6ecee" } },
  }, {
    responsive: true,
    displayModeBar: false,
  }).then(() => {
    chart.removeAllListeners("plotly_click");
    chart.on("plotly_click", (event) => {
      const book = String(event.points[0].customdata);
      state.book = state.book === book ? "all" : book;
      state.chapter = null;
      byId("book-select").value = state.book;
      render();
    });
  });
}

function chapterStatus(profile, globalChapter, mentions) {
  if (mentions > 0) return "mentioned";
  if (profile.first_global_chapter == null) return "never mentioned";
  if (globalChapter < profile.first_global_chapter) return "before first mention";
  if (globalChapter > profile.last_global_chapter) return "after last mention";
  return "between mentions";
}

function renderHeatmap(profile) {
  const container = byId("heatmap");
  const activity = dataIndex.activityByCharacter.get(state.character) ?? new Map();
  const selectedBooks = state.book === "all"
    ? dataIndex.bookNumbers
    : [Number(state.book)];

  const chapters = selectedBooks.flatMap(
    (book) => dataIndex.chaptersByBook.get(book));
  const maxValue = Math.max(
    1,
    ...chapters.map((chapter) => activity.get(chapter.global_chapter)?.[state.metric] || 0)
  );

  container.replaceChildren();
  for (const book of selectedBooks) {
    const section = document.createElement("div");
    section.className = "heatmap-book";

    const label = document.createElement("div");
    label.className = "heatmap-book-label";
    label.textContent = `BOOK ${book}`;
    section.append(label);

    const cells = document.createElement("div");
    cells.className = "heatmap-cells";
    for (const chapter of dataIndex.chaptersByBook.get(book)) {
      const record = activity.get(chapter.global_chapter);
      const mentions = record?.mentions || 0;
      const intensity = record?.[state.metric] || 0;
      const status = chapterStatus(profile, chapter.global_chapter, mentions);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chapter-cell${mentions ? " active" : ""}${state.chapter === chapter.global_chapter ? " selected" : ""}`;

      if (mentions) {

        const relativeIntensity =
          Math.log1p(intensity) / Math.log1p(maxValue);

        const colorIndex = Math.min(
          heatColors.length - 1,
          Math.floor(relativeIntensity * heatColors.length)
        );

        button.style.setProperty(
          "--heat-color",
          heatColors[colorIndex]
        );
      }

      const description = `${chapterLabel(chapter.book_number, chapter.chapter_index, chapter.chapter_label)}: ${integer.format(mentions)} mentions (${status})`;
      button.title = description;
      button.setAttribute("aria-label", description);
      button.setAttribute("aria-pressed", String(state.chapter === chapter.global_chapter));
      button.addEventListener("click", () => {
        state.chapter = chapter.global_chapter;
        renderHeatmap(profile);
        byId("chapter-detail").textContent = `${description}; ${decimal.format(record?.per_10000_words || 0)} per 10,000 words.`;
      });
      cells.append(button);
    }
    section.append(cells);
    container.append(section);
  }
  if (state.chapter == null) {
    byId("chapter-detail").textContent = "Select a chapter square for details.";
  }
}

function addTextCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = String(text);
  row.append(cell);
}


function renderRankings() {
  const totals = mentionCounts();

  const ranked = [...totals]
    .filter(([, count]) => count > 0)
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    );

  const ranks = new Map();
  let previousCount = null;
  let currentRank = 0;

  ranked.forEach(([name, count], index) => {
    if (count !== previousCount) {
      currentRank = index + 1;
      previousCount = count;
    }

    ranks.set(name, currentRank);
  });

  byId("ranking-title").textContent =
    state.book === "all"
      ? "Series leaderboard"
      : `Book ${state.book} leaderboard`;

  const body = byId("ranking-body");
  body.replaceChildren();

  const topCharacters = ranked.slice(0, 12);

  function addRankingRow(name, count, rank, extra = false) {
    const row = document.createElement("tr");
    row.dataset.character = name;

    if (name === state.character) {
      row.classList.add("selected");
    }

    if (extra) {
      row.classList.add("ranking-extra");
      row.title = "Your selected character";
    }

    addTextCell(row, rank ?? "N/A");
    addTextCell(row, name);
    addTextCell(row, integer.format(count));

    row.addEventListener(
      "click",
      () => setCharacter(name)
    );

    body.append(row);
  }

  for (const [name, count] of topCharacters) {
    addRankingRow(name, count, ranks.get(name));
  }

  const selectedIsVisible = topCharacters.some(
    ([name]) => name === state.character
  );

  if (!selectedIsVisible) {
    addRankingRow(
      state.character,
      totals.get(state.character) || 0,
      ranks.get(state.character) ?? null,
      true
    );
  }
}


function renderNetwork() {
  const connections = new Map();
  const characterNetwork = dataIndex.networkByCharacter.get(state.character) ?? [];

  for (const row of characterNetwork) {
    if (state.book !== "all" && row.book_number !== Number(state.book)) { continue; }

    const other = row.character_a === state.character
      ? row.character_b
      : row.character_a;

    if (!connections.has(other)) {
      connections.set(other, {
        total: 0,
        sameBlock: 0,
      });
    }

    const connection = connections.get(other);
    connection.total += row.connections;
    connection.sameBlock += row.same_block_connections;
  }

  const sorted = [...connections].sort(
    (a, b) =>
      b[1].total - a[1].total ||
      a[0].localeCompare(b[0])
  );

  const body = byId("network-body");
  body.replaceChildren();

  for (const [name, values] of sorted.slice(0, 12)) {
    const row = document.createElement("tr");
    row.dataset.character = name;

    addTextCell(row, name);
    addTextCell(row, integer.format(values.total));
    addTextCell(row, integer.format(values.sameBlock));

    row.addEventListener("click", () => setCharacter(name));
    body.append(row);
  }

  if (!sorted.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 3;
    cell.textContent = "No nearby names recorded for this selection.";

    row.append(cell);
    body.append(row);
  }
}


function render() {
  const profile = dataIndex.profilesByCharacter.get(state.character);
  if (!profile) return;

  renderStats(profile);
  renderChart();
  renderHeatmap(profile);
  renderRankings();
  renderNetwork();
  renderComparison();
}

function mentionCounts() {
  if (state.book === "all") return dataIndex.seriesMentions;
  return dataIndex.mentionsByBook.get(Number(state.book));
}


function topComparisonCharacters() {
  return [...mentionCounts()]
    .filter(([, mentions]) => mentions > 0)
    .sort(
      (a, b) =>
        b[1] - a[1] || a[0].localeCompare(b[0])
    )
    .slice(0, 10)
    .map(([name]) => name);
}



function renderComparisonOptions() {
  const container = byId("comparison-options");
  const query = byId("comparison-search").value
    .trim()
    .toLowerCase();

  const counts = mentionCounts();

  const matching = dataIndex.characterNames
    .filter((name) => name.toLowerCase().includes(query))
    .sort(
      (a, b) =>
        (counts.get(b) || 0) - (counts.get(a) || 0) ||
        a.localeCompare(b)
    );

  const visible = matching.slice(0, query ? 30 : 15);

  container.replaceChildren();

  const resultCount = document.createElement("p");
  resultCount.className = "comparison-results";

  resultCount.textContent = query
    ? `${matching.length} matching characters` +
      (matching.length > 30 ? " · showing first 30" : "")
    : "Most mentioned characters · search to find others";

  container.append(resultCount);

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "comparison-empty";
    empty.textContent = "No matching characters.";
    container.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "comparison-option-list";

  for (const name of visible) {
    const label = document.createElement("label");
    label.className = "comparison-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = comparison.characters.includes(name);

    const title = document.createElement("span");
    title.className = "comparison-option-name";
    title.textContent = name;

    const count = document.createElement("span");
    count.className = "comparison-option-count";
    count.textContent = integer.format(counts.get(name) || 0);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (comparison.characters.length >= 20) {
          checkbox.checked = false;
          byId("comparison-message").textContent =
            "You can compare up to 20 characters.";
          return;
        }

        if (!comparison.characters.includes(name)) {
          comparison.characters.push(name);
        }
      } else {
        comparison.characters = comparison.characters.filter(
          (character) => character !== name
        );
      }

      comparison.mode = "manual";
      byId("comparison-message").textContent = "";
      renderComparison();
    });

    label.append(checkbox, title, count);
    list.append(label);
  }

  container.append(list);
}



function renderComparisonEasterEggs() {
  const container = byId("comparison-easter-eggs");
  container.replaceChildren();

  if (comparison.mode !== "manual" || comparison.characters.length !== 2) {
    container.hidden = true;
    return;
  }

  const selected = new Set(comparison.characters);
  const matches = comparisonEasterEggs.filter((egg) =>
    egg.characters.every((name) => selected.has(name))
  );
  container.hidden = matches.length === 0;

  for (const egg of matches) {
    const card = document.createElement("figure");
    card.className = "comparison-quote";

    const heading = document.createElement("div");
    heading.className = "comparison-quote-heading";
    heading.textContent = "You've found an easter egg!";

    const quote = document.createElement("blockquote");
    quote.textContent = `“${egg.quote}”`;
    card.append(heading, quote);

    if (egg.speaker) {
      const attribution = document.createElement("figcaption");
      attribution.textContent = `— ${egg.speaker}`;
      card.append(attribution);
    }
    container.append(card);
  }
}


function renderComparison() {
  if (
    comparison.mode === "top10" &&
    comparison.scopeBook !== state.book
  ) {
    comparison.characters = topComparisonCharacters();
    comparison.scopeBook = state.book;
  }

  const selected = byId("comparison-selected");
  selected.replaceChildren();

  comparison.characters.forEach((name, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "comparison-chip";
    button.style.setProperty(
      "--comparison-color",
      comparisonColors[index % comparisonColors.length]
    );

    button.textContent = `${name} ×`;
    button.title = `Remove ${name}`;

    button.addEventListener("click", () => {
      comparison.characters = comparison.characters.filter(
        (character) => character !== name
      );

      comparison.mode = "manual";
      renderComparison();
    });

    selected.append(button);
  });

  const scope = state.book === "all"
    ? "All eight books"
    : `Book ${state.book}`;

  byId("comparison-summary").textContent =
    `${comparison.characters.length} of ` +
    `${dataIndex.characterNames.length} characters selected · ` +
    `${scope}` +
    (comparison.mode === "top10" ? " · Top 10" : "");

  byId("comparison-top10").setAttribute(
    "aria-pressed",
    String(comparison.mode === "top10")
  );

  byId("comparison-none").setAttribute(
    "aria-pressed",
    String(comparison.characters.length === 0)
  );

  renderComparisonOptions();
  renderComparisonEasterEggs();

  const countChart = byId("comparison-count-chart");
  const percentChart = byId("comparison-percent-chart");


  if (!comparison.characters.length) {
    const version = ++comparisonPlotVersion;

    comparisonPlotQueue = comparisonPlotQueue
      .catch(console.error)
      .then(() => {
        if (version !== comparisonPlotVersion) return;

        Plotly.purge(countChart);
        Plotly.purge(percentChart);

        countChart.replaceChildren();
        percentChart.replaceChildren();
      });

    byId("comparison-message").textContent =
      "Select characters above to display their comparisons.";

    return;
  }


  const books = state.book === "all"
    ? dataIndex.bookNumbers
    : [Number(state.book)];

  const singleBook = books.length === 1;

  const chartStyle = byId("comparison-style");

  chartStyle.disabled = singleBook;
  chartStyle.value = singleBook ? "bar" : comparison.style;

  const totals = new Map(
    books.map((book) => {
      const mentions = dataIndex.mentionsByBook.get(book);

      return [
        book,
        comparison.characters.reduce((sum, name) => sum + (mentions.get(name) || 0),0),];}));

  const makeTraces = (percentage) =>
    comparison.characters.map((name, index) => {
      const values = books.map((book) => {
        const mentions = dataIndex.mentionsByBook.get(book).get(name) || 0;

        if (!percentage) {
          return mentions;
        }

        const total = totals.get(book);
        return total ? mentions / total * 100 : 0;
      });

      const color =
        comparisonColors[index % comparisonColors.length];

      return {
        type: comparison.style === "line" && !singleBook
          ? "scatter"
          : "bar",
        mode: comparison.style === "line" && !singleBook
          ? "lines+markers"
          : undefined,
        name,
        x: books.map((book) => `Book ${book}`),
        y: values,
        line: {
          color,
          width: 2.2,
        },
        marker: {
          color,
          size: 6,
        },
        hovertemplate: percentage
          ? `${name}<br>%{x}: %{y:.1f}%<extra></extra>`
          : `${name}<br>%{x}: %{y:,} mentions<extra></extra>`,
      };
    });

  function chartLayout(element, percentage) {
    return {
      autosize: true,
      height: Math.max(350, element.clientHeight),
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        color: "#a1b3ba",
        family: "system-ui",
      },
      margin: {
        t: 20,
        b: 100,
        l: 65,
        r: 20,
      },
      xaxis: {
        gridcolor: "#293846",
        automargin: true,
      },
      yaxis: percentage
        ? {
            title: "Share (%)",
            gridcolor: "#293846",
            range: [0, 100],
          }
        : {
            title: "Mentions",
            gridcolor: "#293846",
            rangemode: "tozero",
          },
      legend: {
        orientation: "h",
        y: -0.18,
      },
      showlegend: true,
      hovermode: "x unified",
      barmode: "group",
    };
  }

  const countTraces = makeTraces(false);
  const percentTraces = makeTraces(true);
  const version = ++comparisonPlotVersion;

  const chartConfig = {
    responsive: true,
    displayModeBar: false,
  };

  comparisonPlotQueue = comparisonPlotQueue
    .catch(console.error)
    .then(async () => {
      if (version !== comparisonPlotVersion) return;

      await Plotly.react(
        countChart,
        countTraces,
        chartLayout(countChart, false),
        chartConfig
      );

      if (version !== comparisonPlotVersion) return;

      await Plotly.react(
        percentChart,
        percentTraces,
        chartLayout(percentChart, true),
        chartConfig
      );
    })
    .catch(console.error);
  }


function initializeComparison() {
  byId("comparison-top10").addEventListener("click", () => {
    comparison.mode = "top10";
    comparison.scopeBook = null;
    byId("comparison-message").textContent = "";
    renderComparison();
  });

  byId("comparison-none").addEventListener("click", () => {
    comparison.mode = "manual";
    comparison.characters = [];
    renderComparison();
  });

  byId("comparison-search").addEventListener(
    "input",
    renderComparisonOptions
  );

  byId("comparison-style").addEventListener(
    "change",
    (event) => {
      comparison.style = event.target.value;
      renderComparison();
    }
  );
}

async function initialize() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error(`Could not load data.json (${response.status})`);
    const data = await response.json();
    buildDataIndex(data);
    const requestedCharacter = new URLSearchParams(window.location.search).get("character");
    if (requestedCharacter && dataIndex.profilesByCharacter.has(requestedCharacter)) {
      state.character = requestedCharacter;
    }

    if (!dataIndex.profilesByCharacter.has(state.character)) {
      state.character = dataIndex.characterNames[0];
    }

    populateCharacters();
    for (const number of dataIndex.bookNumbers) {
    byId("book-select").add(new Option(`Book ${number}`, String(number)));}

    byId("character-search").addEventListener("input", (event) => {
      const matching = populateCharacters(
        event.target.value.trim()
      );

      if (matching.length === 1) {
        setCharacter(matching[0], false);
      }
    });
    byId("character-select").addEventListener("change", (event) => {
      if (event.target.value) setCharacter(event.target.value);
    });
    byId("book-select").addEventListener("change", (event) => {
      state.book = event.target.value;
      state.chapter = null;
      render();
    });
    byId("metric-select").addEventListener("change", (event) => {
      state.metric = event.target.value;
      render();
    });
    if (typeof Plotly === "undefined") throw new Error("The local Plotly library did not load");
    initializeComparison();
    render();
  } catch (error) {
    const message = byId("load-error");
    message.hidden = false;
    message.textContent = `Dashboard failed to load: ${error.message}.`;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", initialize);
