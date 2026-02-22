(function () {
  "use strict";

  const STORAGE_KEY = "normativity-market-state-v4";
  const LEGACY_STORAGE_KEYS = ["normativity-market-state-v3"];
  const THEME_STORAGE_KEY = "normativity-theme";
  const WEEKLY_COINS = 100;
  const BASELINE_LIQUIDITY = 240;
  const FEED_LIMIT = 12;
  const HISTORY_LIMIT = 10;
  const TREND_POINT_LIMIT = 280;
  const TREND_GRID_LEVELS = [75, 50, 25, 0];
  const DEFAULT_CAST_COINS = 25;
  const DEFAULT_MULTI_OPTION_COINS = 12;
  const OPTION_COLORS = ["#7db5ff", "#40c9a2", "#87a4ff", "#f3a06c", "#b299ff", "#f2d35d", "#74d4ff"];

  const MARKETS = [
    createBinaryMarket({
      id: "abortion-ok",
      question: "Is abortion morally OK?",
      category: "Bioethics",
      volume: 14200,
      baselineYes: 57,
      context:
        "This market tracks moral permissibility judgments about abortion across pregnancy, balancing bodily autonomy, fetal moral status, and social consequences under uncertainty.",
      yesCase:
        "A YES vote treats abortion as morally permissible in at least a substantial range of cases, often emphasizing bodily autonomy, anti-domination, and pluralism about contested moral status.",
      noCase:
        "A NO vote treats abortion as morally impermissible in most or all cases, often emphasizing fetal rights, duties not to kill, or moral caution under uncertainty about personhood.",
    }),
    createBinaryMarket({
      id: "factory-farm-meat",
      question: "Is it morally wrong to buy factory-farmed meat?",
      category: "Animals",
      volume: 12300,
      baselineYes: 63,
      context:
        "This proposition concerns individual consumer responsibility for institutional animal suffering, expected harm multiplication through demand, and practical substitution costs.",
      yesCase:
        "A YES vote treats ordinary purchases as participating in a harmful system and assigns consumers meaningful responsibility to avoid financing severe and avoidable suffering.",
      noCase:
        "A NO vote treats single purchases as morally permissible due to limited causal impact, constrained options, or countervailing duties to affordability, culture, or nutrition.",
    }),
    createBinaryMarket({
      id: "hate-speech-ban",
      question: "Should offensive but non-violent speech be morally censored?",
      category: "Speech",
      volume: 9800,
      baselineYes: 42,
      context:
        "This market evaluates whether moral limits on expression should include speech that is offensive but not directly violent, balancing harm prevention against epistemic and civic freedom.",
      yesCase:
        "A YES vote prioritizes protection from foreseeable social harms, status degradation, and exclusionary environments produced by persistent abusive expression.",
      noCase:
        "A NO vote prioritizes viewpoint freedom, error-correction through open discourse, and institutional restraint against overbroad speech policing.",
    }),
    createBinaryMarket({
      id: "wealth-redistribution",
      question: "Are people morally obligated to donate significant wealth?",
      category: "Duties",
      volume: 7600,
      baselineYes: 61,
      context:
        "This proposition tests demandingness in moral duty: whether individuals with discretionary resources owe substantial transfers to reduce severe preventable suffering.",
      yesCase:
        "A YES vote treats significant giving as a serious moral requirement where marginal resources can produce large welfare gains for others at low personal cost.",
      noCase:
        "A NO vote treats large donations as supererogatory or role-limited, emphasizing special obligations, personal projects, and limits on how demanding morality can be.",
    }),
    createBinaryMarket({
      id: "death-penalty",
      question: "Is the death penalty morally permissible?",
      category: "Justice",
      volume: 10500,
      baselineYes: 35,
      context:
        "This market concerns punishment ethics under fallibility: retribution, deterrence, moral equality before law, and the irreversibility of execution error.",
      yesCase:
        "A YES vote treats capital punishment as morally permissible in at least some grave cases, often citing proportional desert or extreme public-protection rationale.",
      noCase:
        "A NO vote treats capital punishment as morally impermissible due to dignity concerns, wrongful-conviction risk, discriminatory application, and non-lethal alternatives.",
    }),
    createBinaryMarket({
      id: "civil-disobedience",
      question: "Is civil disobedience morally justified against unjust laws?",
      category: "Politics",
      volume: 9100,
      baselineYes: 71,
      context:
        "This proposition evaluates when citizens may publicly breach law for principled protest, balancing rule-of-law stability with resistance to systemic injustice.",
      yesCase:
        "A YES vote treats nonviolent law-breaking as morally justified when legal channels fail and disobedience helps expose or correct serious injustice.",
      noCase:
        "A NO vote treats compliance and institutional reform as morally required, warning that law-breaking can erode legitimacy and produce unstable selective obedience.",
    }),
    createBinaryMarket({
      id: "ai-surveillance",
      question: "Is mass AI surveillance morally acceptable for public safety?",
      category: "Technology",
      volume: 8300,
      baselineYes: 28,
      context:
        "This market weighs collective-security benefits from pervasive AI monitoring against privacy rights, chilling effects, power asymmetries, and abuse risk.",
      yesCase:
        "A YES vote treats broad surveillance as morally acceptable when governed by strict safeguards and when expected safety benefits are substantial.",
      noCase:
        "A NO vote treats mass surveillance as morally unacceptable because structural abuse and liberty erosion outweigh claimed security gains.",
    }),
    createBinaryMarket({
      id: "gene-editing",
      question: "Is germline gene editing morally acceptable when safe?",
      category: "Bioethics",
      volume: 6900,
      baselineYes: 48,
      context:
        "This proposition concerns heritable genetic intervention under safety assumptions, including intergenerational consent, justice in access, and human-enhancement boundaries.",
      yesCase:
        "A YES vote treats germline editing as morally acceptable when safety and governance conditions are met, especially to prevent serious disease burdens.",
      noCase:
        "A NO vote treats germline editing as morally problematic even if safe, citing dignity, eugenic social pressure, and unresolved legitimacy concerns.",
    }),
    createBinaryMarket({
      id: "fast-fashion",
      question: "Purchasing fast fashion: morally permissible?",
      category: "Consumption",
      volume: 8700,
      baselineYes: 39,
      context:
        "This market tracks consumer complicity in labor exploitation and environmental harm linked to low-cost rapid-turnover apparel supply chains.",
      yesCase:
        "A YES vote treats fast-fashion purchases as morally permissible in ordinary contexts, often emphasizing affordability constraints and diffuse causal responsibility.",
      noCase:
        "A NO vote treats routine fast-fashion consumption as morally impermissible due to avoidable exploitation, waste externalities, and demand-driven harms.",
    }),
    {
      id: "murder-wrongness",
      type: "multi",
      question: "What primarily makes murder morally wrong?",
      category: "Foundations",
      volume: 15400,
      context:
        "This multi-choice market compares leading explanations of why murder is wrong: welfare loss, rights violation, agency violation, future deprivation, and character corruption.",
      options: [
        {
          id: "future-deprivation",
          letter: "A",
          label: "It deprives the victim of their future.",
          shortLabel: "Future deprivation",
          baseline: 22,
          theory:
            "Deprivation account: murder is seriously wrong because it removes the victim's valuable future experiences, projects, relationships, and goods they otherwise would have had.",
          sources: [
            {
              label: "SEP - Death (Deprivation Account)",
              url: "https://plato.stanford.edu/entries/death/#DeprAcco",
            },
            {
              label: "Don Marquis (1989), The Journal of Philosophy, doi:10.2307/2026961",
              url: "https://doi.org/10.2307/2026961",
            },
          ],
        },
        {
          id: "utility-drop",
          letter: "B",
          label: "It causes a major drop in total utility.",
          shortLabel: "Utility loss",
          baseline: 19,
          theory:
            "Consequentialist account: murder is wrong when it predictably makes outcomes worse overall, including severe suffering, grief, fear, social instability, and foreclosed welfare.",
          sources: [
            {
              label: "SEP - Consequentialism",
              url: "https://plato.stanford.edu/entries/consequentialism/",
            },
            {
              label: "J.J.C. Smart (1956), The Philosophical Quarterly, doi:10.2307/2216786",
              url: "https://doi.org/10.2307/2216786",
            },
          ],
        },
        {
          id: "autonomy-rationality",
          letter: "C",
          label: "It violates the victim's autonomy and rational agency.",
          shortLabel: "Autonomy violation",
          baseline: 20,
          theory:
            "Kantian account: murder is wrong because it annihilates the conditions for autonomous agency and treats a rational person as a mere object rather than an end in themselves.",
          sources: [
            {
              label: "SEP - Kant's Moral Philosophy",
              url: "https://plato.stanford.edu/entries/kant-moral/",
            },
            {
              label: "Christine Korsgaard (1986), Mind, doi:10.1093/mind/XCV.374.183",
              url: "https://doi.org/10.1093/mind/XCV.374.183",
            },
          ],
        },
        {
          id: "right-to-life",
          letter: "D",
          label: "It violates the victim's right to life.",
          shortLabel: "Rights violation",
          baseline: 23,
          theory:
            "Rights-based account: murder is wrong because it infringes a stringent claim-right not to be killed, independent of whether aggregate outcomes would otherwise improve.",
          sources: [
            {
              label: "SEP - Rights",
              url: "https://plato.stanford.edu/entries/rights/",
            },
            {
              label: "Judith Jarvis Thomson (1971), Philosophy & Public Affairs (JSTOR)",
              url: "https://www.jstor.org/stable/2265091",
            },
          ],
        },
        {
          id: "vice-cultivation",
          letter: "E",
          label: "Killing requires or cultivates extreme vices.",
          shortLabel: "Vice cultivation",
          baseline: 16,
          theory:
            "Virtue-ethical account: murder is wrong because it expresses and entrenches grave defects of character such as cruelty, injustice, callousness, and disregard for practical wisdom.",
          sources: [
            {
              label: "SEP - Virtue Ethics",
              url: "https://plato.stanford.edu/entries/ethics-virtue/",
            },
            {
              label: "Rosalind Hursthouse (1991), Philosophy & Public Affairs",
              url: "https://philpapers.org/rec/HURVTA",
            },
          ],
        },
      ],
    },
  ];

  const marketById = new Map(
    MARKETS.map(function (market) {
      return [market.id, market];
    })
  );

  const optionByMarketAndId = new Map(
    MARKETS.map(function (market) {
      return [
        market.id,
        new Map(
          market.options.map(function (option) {
            return [option.id, option];
          })
        ),
      ];
    })
  );

  const compactNumber = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  let activeCategory = "all";
  let selectedMarketId = null;
  let selectedSide = "yes";
  const binaryCoinDraftByKey = Object.create(null);
  const multiDraftByMarket = Object.create(null);
  const expandedTheoryByMarket = Object.create(null);

  const weekContext = getWeekContext(new Date());
  let state = loadState(weekContext);
  ensureCurrentWeek();
  const routeSelection = parseRouteSelection();
  const detailRouteMarketId =
    routeSelection.marketId && marketById.has(routeSelection.marketId) ? routeSelection.marketId : "";
  const isDetailRoute = Boolean(detailRouteMarketId);

  const el = {
    themeToggle: document.getElementById("themeToggle"),
    heroSection: document.getElementById("heroSection"),
    boardSection: document.getElementById("boardSection"),
    boardControls: document.getElementById("boardControls"),
    marketCount: document.getElementById("marketCount"),
    castCount: document.getElementById("castCount"),
    positionCount: document.getElementById("positionCount"),
    searchInput: document.getElementById("searchInput"),
    categoryFilters: document.getElementById("categoryFilters"),
    marketGrid: document.getElementById("marketGrid"),
    marketDetailMain: document.getElementById("marketDetailMain"),
    detailMarketType: document.getElementById("detailMarketType"),
    detailCategory: document.getElementById("detailCategory"),
    detailVolume: document.getElementById("detailVolume"),
    detailQuestion: document.getElementById("detailQuestion"),
    detailConsensusLine: document.getElementById("detailConsensusLine"),
    detailWeekLine: document.getElementById("detailWeekLine"),
    detailContext: document.getElementById("detailContext"),
    detailOutcomeContext: document.getElementById("detailOutcomeContext"),
    detailTheoryContext: document.getElementById("detailTheoryContext"),
    detailActivityList: document.getElementById("detailActivityList"),
    detailTrendMeta: document.getElementById("detailTrendMeta"),
    detailTrendChart: document.getElementById("detailTrendChart"),
    detailTrendLegend: document.getElementById("detailTrendLegend"),
    ticketColumn: document.getElementById("ticketColumn"),
    ticketPanel: document.getElementById("ticketPanel"),
    ticketPrompt: document.getElementById("ticketPrompt"),
    ticketContent: document.getElementById("ticketContent"),
    ticketQuestion: document.getElementById("ticketQuestion"),
    ticketConsensus: document.getElementById("ticketConsensus"),
    weekWindow: document.getElementById("weekWindow"),
    trendPanel: document.getElementById("trendPanel"),
    trendMeta: document.getElementById("trendMeta"),
    trendChart: document.getElementById("trendChart"),
    trendLegend: document.getElementById("trendLegend"),
    ticketControls: document.getElementById("ticketControls"),
    remainingLine: document.getElementById("remainingLine"),
    ticketPreview: document.getElementById("ticketPreview"),
    castBtn: document.getElementById("castBtn"),
    clearBtn: document.getElementById("clearBtn"),
    ticketStatus: document.getElementById("ticketStatus"),
    feedPanel: document.getElementById("feedPanel"),
    feedList: document.getElementById("feedList"),
    positionsPanel: document.getElementById("positionsPanel"),
    positionsList: document.getElementById("positionsList"),
    resolutionSection: document.getElementById("resolutionSection"),
    resolutionSummary: document.getElementById("resolutionSummary"),
  };

  init();

  function init() {
    initTheme();
    if (isDetailRoute) {
      selectedMarketId = detailRouteMarketId;
      if (routeSelection.side === "yes" || routeSelection.side === "no") {
        selectedSide = routeSelection.side;
      }
    }
    bindEvents();
    renderFilters();
    renderAll();
    bindRevealAnimation();
    bindLiveTrendTicker();
  }

  function initTheme() {
    if (!el.themeToggle) return;

    const mediaQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const savedTheme = readStoredTheme();
    const initialTheme = savedTheme || (mediaQuery && mediaQuery.matches ? "dark" : "light");
    applyTheme(initialTheme, false);

    el.themeToggle.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme");
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });

    if (!savedTheme && mediaQuery) {
      const onThemeChange = function (event) {
        if (readStoredTheme()) return;
        applyTheme(event.matches ? "dark" : "light", false);
      };

      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", onThemeChange);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(onThemeChange);
      }
    }
  }

  function readStoredTheme() {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      return theme === "dark" || theme === "light" ? theme : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme, persist) {
    const normalized = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", normalized);
    updateThemeToggle(normalized);

    if (!persist) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch (error) {
      // Ignore localStorage failures in restricted browsing modes.
    }
  }

  function updateThemeToggle(theme) {
    if (!el.themeToggle) return;
    const darkActive = theme === "dark";
    el.themeToggle.textContent = darkActive ? "Light mode" : "Dark mode";
    el.themeToggle.setAttribute("aria-pressed", String(darkActive));
    el.themeToggle.setAttribute("aria-label", darkActive ? "Switch to light mode" : "Switch to dark mode");
  }

  function bindEvents() {
    el.searchInput.addEventListener("input", function () {
      renderMarketGrid();
    });

    el.categoryFilters.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      const nextCategory = button.getAttribute("data-category");
      if (!nextCategory || nextCategory === activeCategory) return;
      activeCategory = nextCategory;
      updateFilterStyles();
      renderMarketGrid();
    });

    el.marketGrid.addEventListener("click", function (event) {
      const quoteButton = event.target.closest("button[data-market-id][data-option-id]");
      if (quoteButton) {
        const marketId = quoteButton.getAttribute("data-market-id");
        const optionId = quoteButton.getAttribute("data-option-id");
        if (marketId && optionId) {
          selectMarket(marketId, optionId);
        }
        return;
      }

      const openBallotBtn = event.target.closest("button[data-open-market]");
      if (openBallotBtn) {
        const marketId = openBallotBtn.getAttribute("data-open-market");
        if (marketId) {
          selectMarket(marketId);
        }
        return;
      }

      const card = event.target.closest("article[data-market-id]");
      if (!card) return;
      const marketId = card.getAttribute("data-market-id");
      if (!marketId) return;
      selectMarket(marketId);
    });

    el.ticketPanel.addEventListener("click", function (event) {
      const expandButton = event.target.closest("button[data-multi-expand]");
      if (expandButton) {
        const optionId = expandButton.getAttribute("data-multi-expand");
        const market = getSelectedMarket();
        if (market && market.type === "multi" && optionId) {
          toggleTheoryExpanded(market.id, optionId);
          renderTicket();
          if (isDetailRoute) {
            renderMarketDetailMain();
          }
        }
        return;
      }

      const sideButton = event.target.closest("button.side-btn[data-side]");
      if (!sideButton) return;
      const side = sideButton.getAttribute("data-side");
      if (!side || side === selectedSide) return;
      selectedSide = side;
      renderTicket();
      if (isDetailRoute) {
        renderMarketDetailMain();
      }
    });

    if (el.marketDetailMain) {
      el.marketDetailMain.addEventListener("click", function (event) {
        const sideButton = event.target.closest("button[data-detail-side]");
        if (sideButton) {
          const side = sideButton.getAttribute("data-detail-side");
          if (side === "yes" || side === "no") {
            selectedSide = side;
            renderMarketDetailMain();
            renderTicket();
          }
          return;
        }

        const expandButton = event.target.closest("button[data-detail-expand]");
        if (!expandButton) return;
        const optionId = expandButton.getAttribute("data-detail-expand");
        const market = getSelectedMarket();
        if (!market || market.type !== "multi" || !optionId) return;
        toggleTheoryExpanded(market.id, optionId);
        renderMarketDetailMain();
      });
    }

    el.ticketPanel.addEventListener("input", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.id === "binaryCoinsRange") {
        const input = target;
        const coins = clamp(Math.round(Number(input.value || DEFAULT_CAST_COINS)), 1, WEEKLY_COINS);
        input.value = String(coins);
        const label = el.ticketPanel.querySelector("#binaryCoinsLabel");
        if (label) label.textContent = String(coins);
        const market = getSelectedMarket();
        if (market && market.type === "binary") {
          binaryCoinDraftByKey[getBinaryDraftKey(market.id, selectedSide)] = coins;
        }
        updateTicketPreview();
        return;
      }

      if (target.matches("input[data-multi-coins]")) {
        const input = target;
        const optionId = input.getAttribute("data-multi-coins");
        const market = getSelectedMarket();
        if (!market || market.type !== "multi" || !optionId) return;
        const draft = ensureMultiDraft(market);
        const coins = clamp(Math.round(Number(input.value || DEFAULT_MULTI_OPTION_COINS)), 1, WEEKLY_COINS);
        input.value = String(coins);

        if (!draft[optionId]) {
          draft[optionId] = { selected: true, coins: coins };
        } else {
          draft[optionId].coins = coins;
        }

        const row = input.closest(".choice-item");
        const label = row ? row.querySelector("[data-multi-label]") : null;
        if (label) label.textContent = String(coins);

        updateTicketPreview();
      }
    });

    el.ticketPanel.addEventListener("change", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.matches("input[data-multi-check]")) {
        const checkbox = target;
        const optionId = checkbox.getAttribute("data-multi-check");
        const market = getSelectedMarket();
        if (!market || market.type !== "multi" || !optionId) return;

        const draft = ensureMultiDraft(market);
        if (!draft[optionId]) {
          draft[optionId] = {
            selected: checkbox.checked,
            coins: DEFAULT_MULTI_OPTION_COINS,
          };
        } else {
          draft[optionId].selected = checkbox.checked;
        }

        const row = checkbox.closest(".choice-item");
        if (row) {
          row.classList.toggle("is-selected", checkbox.checked);
          const slider = row.querySelector("input[data-multi-coins]");
          if (slider) {
            slider.disabled = !checkbox.checked;
          }
        }

        updateTicketPreview();
      }
    });

    el.castBtn.addEventListener("click", onCastCoins);
    el.clearBtn.addEventListener("click", onClearMarket);
  }

  function renderAll() {
    ensureCurrentWeek();
    seedAllMarketTrends();
    renderStats();
    renderRouteLayout();
    if (isDetailRoute) {
      renderMarketDetailMain();
    } else {
      renderMarketGrid();
    }
    renderTicket();
    renderFeed();
    renderPositions();
    renderResolutionSummary();
  }

  function renderRouteLayout() {
    const inDetail = isDetailRoute && Boolean(getSelectedMarket());

    if (el.heroSection) {
      el.heroSection.hidden = inDetail;
    }
    if (el.boardControls) {
      el.boardControls.hidden = inDetail;
    }
    if (el.marketGrid) {
      el.marketGrid.hidden = inDetail;
    }
    if (el.marketDetailMain) {
      el.marketDetailMain.hidden = !inDetail;
      el.marketDetailMain.classList.toggle("hidden", !inDetail);
    }
    if (el.trendPanel) {
      el.trendPanel.hidden = inDetail;
    }
    if (el.feedPanel) {
      el.feedPanel.hidden = inDetail;
    }
    if (el.positionsPanel) {
      el.positionsPanel.hidden = inDetail;
    }
    if (el.resolutionSection) {
      el.resolutionSection.hidden = inDetail;
    }
    if (el.ticketColumn) {
      el.ticketColumn.classList.toggle("ticket-column-detail", inDetail);
    }
  }

  function renderStats() {
    el.marketCount.textContent = String(MARKETS.length);
    el.castCount.textContent = String(state.activity.length);
    el.positionCount.textContent = String(getCoinsRemaining());
  }

  function renderFilters() {
    const categories = ["all"].concat(
      Array.from(
        new Set(
          MARKETS.map(function (market) {
            return market.category;
          })
        )
      )
    );

    el.categoryFilters.innerHTML = categories
      .map(function (category) {
        const label = category === "all" ? "All markets" : category;
        return (
          '<button type="button" class="chip-filter" data-category="' +
          escapeHtml(category) +
          '">' +
          escapeHtml(label) +
          "</button>"
        );
      })
      .join("");

    updateFilterStyles();
  }

  function updateFilterStyles() {
    const buttons = el.categoryFilters.querySelectorAll("button[data-category]");
    buttons.forEach(function (button) {
      const isActive = button.getAttribute("data-category") === activeCategory;
      button.classList.toggle("active", isActive);
    });
  }

  function renderMarketGrid() {
    const query = String(el.searchInput.value || "")
      .trim()
      .toLowerCase();

    const filtered = MARKETS.filter(function (market) {
      const categoryMatch = activeCategory === "all" || market.category === activeCategory;
      const searchMatch =
        query.length === 0 ||
        market.question.toLowerCase().includes(query) ||
        market.category.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });

    if (filtered.length === 0) {
      el.marketGrid.innerHTML =
        '<article class="empty-item"><p>No markets match your search/filter.</p></article>';
      return;
    }

    el.marketGrid.innerHTML = filtered
      .map(function (market) {
        const snapshot = getMarketSnapshot(market);
        const positions = getPositionsForMarket(market.id);
        const isActive = selectedMarketId === market.id;

        const marketSpecificBody =
          market.type === "binary"
            ? renderBinaryCardBody(market, snapshot, isActive)
            : renderMultiCardBody(market, snapshot);

        const positionNote = renderCardPositionNote(market, positions);

        return (
          '<article class="market-card' +
          (isActive ? " active" : "") +
          '" data-market-id="' +
          escapeHtml(market.id) +
          '">' +
          '<div class="card-top">' +
          '<span class="category-tag">' +
          escapeHtml(market.category) +
          "</span>" +
          '<span class="volume-tag">' +
          escapeHtml(formatVolume(market.volume)) +
          " signals</span>" +
          "</div>" +
          '<h3 class="card-question">' +
          escapeHtml(market.question) +
          "</h3>" +
          marketSpecificBody +
          positionNote +
          "</article>"
        );
      })
      .join("");
  }

  function renderMarketDetailMain() {
    if (!el.marketDetailMain) return;
    const market = getSelectedMarket();
    if (!market) {
      el.marketDetailMain.hidden = true;
      el.marketDetailMain.classList.add("hidden");
      return;
    }

    const snapshot = getMarketSnapshot(market);
    const weekStart = new Date(state.weekStart);
    const weekEnd = new Date(state.weekEnd);

    if (el.detailMarketType) {
      el.detailMarketType.textContent = market.type === "binary" ? "Binary Market" : "Multi-choice Market";
    }
    if (el.detailCategory) {
      el.detailCategory.textContent = market.category;
    }
    if (el.detailVolume) {
      el.detailVolume.textContent = formatVolume(market.volume) + " signals";
    }
    if (el.detailQuestion) {
      el.detailQuestion.textContent = market.question;
    }
    if (el.detailConsensusLine) {
      el.detailConsensusLine.textContent = renderConsensusLine(market, snapshot);
    }
    if (el.detailWeekLine) {
      el.detailWeekLine.textContent =
        "Week " +
        formatDateRange(weekStart, weekEnd) +
        " | " +
        formatTimeRemaining(weekEnd) +
        " until reset.";
    }
    if (el.detailContext) {
      el.detailContext.textContent = market.context || defaultMarketContext(market);
    }

    renderDetailTrendPanel(market);
    renderDetailActivity(market);

    if (market.type === "binary") {
      renderBinaryDetailSections(market, snapshot);
      return;
    }

    renderMultiDetailSections(market, snapshot);
  }

  function renderBinaryDetailSections(market, snapshot) {
    if (el.detailTheoryContext) {
      el.detailTheoryContext.hidden = true;
      el.detailTheoryContext.innerHTML = "";
    }
    if (!el.detailOutcomeContext) return;

    const yesShare = snapshot.optionShares.yes || 0;
    const noShare = snapshot.optionShares.no || 0;
    const yesText =
      market.yesCase ||
      "A YES vote treats the proposition as morally permissible under the framing of this market.";
    const noText =
      market.noCase ||
      "A NO vote treats the proposition as morally impermissible under the framing of this market.";

    el.detailOutcomeContext.innerHTML =
      '<article class="detail-outcome-card yes">' +
      '<div class="detail-outcome-head"><h3>YES</h3><span class="detail-share">' +
      yesShare +
      "%</span></div>" +
      "<p>" +
      escapeHtml(yesText) +
      "</p>" +
      '<button type="button" class="detail-side-btn' +
      (selectedSide === "yes" ? " active" : "") +
      '" data-detail-side="yes">Set ticket to YES</button>' +
      "</article>" +
      '<article class="detail-outcome-card no">' +
      '<div class="detail-outcome-head"><h3>NO</h3><span class="detail-share">' +
      noShare +
      "%</span></div>" +
      "<p>" +
      escapeHtml(noText) +
      "</p>" +
      '<button type="button" class="detail-side-btn' +
      (selectedSide === "no" ? " active" : "") +
      '" data-detail-side="no">Set ticket to NO</button>' +
      "</article>";
  }

  function renderMultiDetailSections(market, snapshot) {
    if (el.detailOutcomeContext) {
      const topSummary = describeTopOptions(market, snapshot, 3);
      el.detailOutcomeContext.innerHTML =
        '<article class="detail-overview-card">' +
        "<h3>Open Ballot (Multi-choice)</h3>" +
        "<p>You can allocate credence tokens to multiple options at the same time. Current top split: " +
        escapeHtml(topSummary) +
        ".</p>" +
        "</article>";
    }

    if (!el.detailTheoryContext) return;

    const expandedMap = ensureTheoryExpandedMap(market.id);
    el.detailTheoryContext.hidden = false;
    el.detailTheoryContext.innerHTML =
      "<h3>Theory Explanations</h3>" +
      market.options
        .map(function (option, index) {
          const share = snapshot.optionShares[option.id] || 0;
          const open = Boolean(expandedMap[option.id]);
          return (
            '<article class="detail-theory-item option-' +
            (index + 1) +
            (open ? " is-open" : "") +
            '">' +
            '<button type="button" class="detail-theory-toggle" data-detail-expand="' +
            escapeHtml(option.id) +
            '" aria-expanded="' +
            (open ? "true" : "false") +
            '">' +
            '<span class="detail-theory-title">' +
            escapeHtml(option.letter + ". " + option.label) +
            "</span>" +
            '<span class="detail-share option-' +
            (index + 1) +
            '">' +
            share +
            "%</span>" +
            "</button>" +
            '<div class="detail-theory-body' +
            (open ? " open" : "") +
            '">' +
            '<p class="choice-theory">' +
            escapeHtml(option.theory) +
            "</p>" +
            '<p class="choice-sources">Sources: ' +
            renderOptionSources(option.sources) +
            "</p>" +
            "</div>" +
            "</article>"
          );
        })
        .join("");
  }

  function renderDetailActivity(market) {
    if (!el.detailActivityList) return;
    const rows = state.activity
      .filter(function (entry) {
        return entry.marketId === market.id;
      })
      .sort(function (a, b) {
        return b.createdAt.localeCompare(a.createdAt);
      })
      .slice(0, 8);

    if (rows.length === 0) {
      el.detailActivityList.innerHTML =
        '<li class="empty-item"><p>No cast actions yet for this market this week.</p></li>';
      return;
    }

    el.detailActivityList.innerHTML = rows
      .map(function (entry) {
        return (
          '<li class="feed-item">' +
          '<p class="feed-main">' +
          escapeHtml(summarizeChangesForFeed(market, entry.changes)) +
          "</p>" +
          '<p class="feed-meta">' +
          escapeHtml(describeChangesForFeed(market, entry.changes)) +
          " | " +
          escapeHtml(formatTimeAgo(entry.createdAt)) +
          "</p>" +
          "</li>"
        );
      })
      .join("");
  }

  function defaultMarketContext(market) {
    if (market.type === "multi") {
      return "This market compares competing explanatory theories and asks participants to make confidence tradeoffs explicit.";
    }
    return "This market tracks the board's current confidence split on a contested moral proposition.";
  }

  function renderBinaryCardBody(market, snapshot, isActive) {
    const yesShare = snapshot.optionShares.yes || 0;
    const noShare = snapshot.optionShares.no || 0;

    return (
      '<div class="market-bar">' +
      '<span class="bar-yes" style="width:' +
      yesShare +
      '%"></span>' +
      '<span class="bar-no" style="width:' +
      noShare +
      '%"></span>' +
      "</div>" +
      '<div class="bar-labels"><span>YES ' +
      yesShare +
      '%</span><span>NO ' +
      noShare +
      "%</span></div>" +
      '<div class="quote-row">' +
      renderQuoteButton(market.id, "yes", yesShare, isActive && selectedSide === "yes") +
      renderQuoteButton(market.id, "no", noShare, isActive && selectedSide === "no") +
      "</div>"
    );
  }

  function renderMultiCardBody(market, snapshot) {
    const top = snapshot.ordered.slice(0, 3);

    return (
      renderMultiBar(market, snapshot) +
      '<div class="multi-summary">' +
      top
        .map(function (item) {
          const option = getOption(market.id, item.optionId);
          if (!option) return "";
          return (
            '<span class="multi-pill">' +
            escapeHtml(option.letter + ".") +
            " " +
            item.share +
            "%</span>"
          );
        })
        .join("") +
      "</div>" +
      '<button type="button" class="quote-btn multi-open" data-open-market="' +
      escapeHtml(market.id) +
      '"><span>OPEN BALLOT</span><strong>Multi</strong></button>'
    );
  }

  function renderMultiBar(market, snapshot) {
    return (
      '<div class="multi-bar">' +
      market.options
        .map(function (option, index) {
          const share = snapshot.optionShares[option.id] || 0;
          return (
            '<span class="multi-segment option-' +
            (index + 1) +
            '" style="width:' +
            share +
            '%" title="' +
            escapeHtml(option.letter + ". " + option.shortLabel + " " + share + "%") +
            '"></span>'
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderCardPositionNote(market, positions) {
    if (positions.length === 0) return "";

    if (market.type === "binary") {
      const position = positions[0];
      return (
        '<p class="position-note">Your vote: <span class="positions-side ' +
        escapeHtml(position.optionId) +
        '">' +
        position.optionId.toUpperCase() +
        "</span> " +
        formatCredenceTokens(position.coins) +
        "</p>"
      );
    }

    const total = positions.reduce(function (sum, position) {
      return sum + position.coins;
    }, 0);

    return (
      '<p class="position-note">Your ballot: ' +
      positions.length +
      " options, " +
      formatCredenceTokens(total) +
      "</p>"
    );
  }

  function renderQuoteButton(marketId, optionId, price, selected) {
    return (
      '<button type="button" class="quote-btn ' +
      optionId +
      (selected ? " selected" : "") +
      '" data-market-id="' +
      escapeHtml(marketId) +
      '" data-option-id="' +
      escapeHtml(optionId) +
      '">' +
      "<span>" +
      optionId.toUpperCase() +
      "</span>" +
      "<strong>" +
      price +
      "%</strong>" +
      "</button>"
    );
  }

  function renderTicket() {
    const market = getSelectedMarket();

    if (!market) {
      el.ticketPrompt.style.display = "";
      el.ticketContent.classList.add("hidden");
      el.ticketPanel.classList.remove("side-no");
      el.ticketPanel.classList.remove("side-yes");
      return;
    }

    const snapshot = getMarketSnapshot(market);
    const weekStart = new Date(state.weekStart);
    const weekEnd = new Date(state.weekEnd);

    el.ticketPrompt.style.display = "none";
    el.ticketContent.classList.remove("hidden");
    el.ticketQuestion.textContent = market.question;
    el.ticketConsensus.textContent = renderConsensusLine(market, snapshot);
    el.weekWindow.textContent =
      "Week " +
      formatDateRange(weekStart, weekEnd) +
      " | " +
      formatTimeRemaining(weekEnd) +
      " until reset.";

    el.ticketPanel.classList.toggle("side-yes", market.type === "binary" && selectedSide === "yes");
    el.ticketPanel.classList.toggle("side-no", market.type === "binary" && selectedSide === "no");

    renderTicketControls(market, snapshot);
    if (!isDetailRoute) {
      renderTrendPanel(market);
    }

    const hasAllocation = getPositionsForMarket(market.id).length > 0;
    el.clearBtn.hidden = !hasAllocation;

    el.remainingLine.textContent =
      "Credence tokens remaining this week: " + getCoinsRemaining() + " / " + WEEKLY_COINS + ".";

    updateTicketPreview();
  }

  function renderConsensusLine(market, snapshot) {
    if (market.type === "binary") {
      return (
        "Current board split: YES " +
        (snapshot.optionShares.yes || 0) +
        "% / NO " +
        (snapshot.optionShares.no || 0) +
        "%"
      );
    }

    const top = snapshot.ordered.slice(0, 3);
    const details = top
      .map(function (item) {
        const option = getOption(market.id, item.optionId);
        if (!option) return "";
        return option.letter + ". " + item.share + "%";
      })
      .filter(Boolean)
      .join(" | ");

    return "Current board split (top choices): " + details;
  }

  function renderTicketControls(market, snapshot) {
    if (market.type === "binary") {
      renderBinaryTicketControls(market);
      return;
    }

    renderMultiTicketControls(market, snapshot);
  }

  function renderBinaryTicketControls(market) {
    const positions = getPositionsForMarket(market.id);
    const existing = positions[0] || null;

    if (selectedSide !== "yes" && selectedSide !== "no") {
      selectedSide = existing && (existing.optionId === "yes" || existing.optionId === "no")
        ? existing.optionId
        : "yes";
    }

    const key = getBinaryDraftKey(market.id, selectedSide);
    let coins = binaryCoinDraftByKey[key];
    if (!Number.isFinite(coins)) {
      if (existing && existing.optionId === selectedSide) {
        coins = existing.coins;
      } else if (existing) {
        coins = existing.coins;
      } else {
        coins = DEFAULT_CAST_COINS;
      }
    }

    coins = clamp(Math.round(Number(coins)), 1, WEEKLY_COINS);
    binaryCoinDraftByKey[key] = coins;

    el.ticketControls.innerHTML =
      '<div class="binary-controls">' +
      '<div class="side-toggle" role="tablist" aria-label="Outcome side">' +
      '<button type="button" class="side-btn' +
      (selectedSide === "yes" ? " active" : "") +
      '" data-side="yes">YES</button>' +
      '<button type="button" class="side-btn' +
      (selectedSide === "no" ? " active" : "") +
      '" data-side="no">NO</button>' +
      "</div>" +
      '<label class="field-row" for="binaryCoinsRange">' +
      "Credence tokens for this proposition: <span id=\"binaryCoinsLabel\">" +
      coins +
      "</span>" +
      '<input id="binaryCoinsRange" type="range" min="1" max="100" step="1" value="' +
      coins +
      '">' +
      "</label>" +
      "</div>";
  }

  function renderMultiTicketControls(market, snapshot) {
    const draft = ensureMultiDraft(market);
    const expandedMap = ensureTheoryExpandedMap(market.id);

    el.ticketControls.innerHTML =
      '<div class="multi-controls">' +
      '<p class="multi-intro">Choose one or more theories, allocate credence tokens, and click a row to view its full argument.</p>' +
      market.options
        .map(function (option, index) {
          const draftOption = draft[option.id] || {
            selected: false,
            coins: DEFAULT_MULTI_OPTION_COINS,
          };

          const checked = draftOption.selected ? " checked" : "";
          const coins = clamp(Math.round(Number(draftOption.coins)), 1, WEEKLY_COINS);
          const share = snapshot.optionShares[option.id] || 0;
          const isOpen = Boolean(expandedMap[option.id]);

          return (
            '<div class="choice-item option-' +
            (index + 1) +
            (draftOption.selected ? " is-selected" : "") +
            (isOpen ? " is-open" : "") +
            '">' +
            '<div class="choice-main">' +
            '<input class="choice-check" type="checkbox" data-multi-check="' +
            escapeHtml(option.id) +
            '"' +
            checked +
            ">" +
            '<button type="button" class="choice-summary" data-multi-expand="' +
            escapeHtml(option.id) +
            '" aria-expanded="' +
            (isOpen ? "true" : "false") +
            '">' +
            '<span class="choice-summary-main"><span class="choice-letter">' +
            escapeHtml(option.letter + ".") +
            "</span> " +
            escapeHtml(option.label) +
            "</span>" +
            '<span class="choice-share option-' +
            (index + 1) +
            '">' +
            share +
            "%</span>" +
            "</button>" +
            "</div>" +
            '<div class="choice-allocation">Credence tokens: <span data-multi-label="' +
            escapeHtml(option.id) +
            '">' +
            coins +
            "</span>" +
            '<input type="range" min="1" max="100" step="1" value="' +
            coins +
            '" data-multi-coins="' +
            escapeHtml(option.id) +
            '"' +
            (draftOption.selected ? "" : " disabled") +
            ">" +
            "</div>" +
            '<div class="choice-details' +
            (isOpen ? " open" : "") +
            '">' +
            '<p class="choice-theory">' +
            escapeHtml(option.theory) +
            "</p>" +
            '<p class="choice-sources">Sources: ' +
            renderOptionSources(option.sources) +
            "</p>" +
            "</div>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderOptionSources(sources) {
    return sources
      .map(function (source) {
        return (
          '<a href="' +
          escapeHtml(source.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(source.label) +
          "</a>"
        );
      })
      .join(" | ");
  }

  function renderTrendPanel(market) {
    renderTrendPanelInto(market, {
      chartEl: el.trendChart,
      legendEl: el.trendLegend,
      metaEl: el.trendMeta,
      width: 680,
      height: 220,
      padding: { top: 14, right: 52, bottom: 24, left: 12 },
      leadStroke: 2.8,
      baseStroke: 2.2,
      dotRadius: 4.2,
    });
  }

  function renderDetailTrendPanel(market) {
    renderTrendPanelInto(market, {
      chartEl: el.detailTrendChart,
      legendEl: el.detailTrendLegend,
      metaEl: el.detailTrendMeta,
      width: 920,
      height: 300,
      padding: { top: 18, right: 56, bottom: 30, left: 14 },
      leadStroke: 3.1,
      baseStroke: 2.4,
      dotRadius: 4.6,
    });
  }

  function renderTrendPanelInto(market, target) {
    const chartEl = target && target.chartEl;
    const legendEl = target && target.legendEl;
    const metaEl = target && target.metaEl;
    if (!chartEl || !legendEl || !metaEl) return;

    ensureTrendSeedForMarket(market.id);
    const series = getTrendSeries(market.id);
    if (series.length === 0) {
      chartEl.innerHTML = "";
      legendEl.innerHTML = "";
      metaEl.textContent = "No trend data yet.";
      return;
    }

    const points = series.slice();
    if (points.length === 1) {
      points.push({
        t: new Date().toISOString(),
        s: cloneShares(points[0].s),
      });
    }

    const width = Number(target.width) || 680;
    const height = Number(target.height) || 220;
    const padding = target.padding || { top: 14, right: 52, bottom: 24, left: 12 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxIndex = Math.max(points.length - 1, 1);
    const leadStroke = Number(target.leadStroke) || 2.8;
    const baseStroke = Number(target.baseStroke) || 2.2;
    const dotRadius = Number(target.dotRadius) || 4.2;

    const grid = TREND_GRID_LEVELS.map(function (level) {
      const y = padding.top + ((100 - level) / 100) * plotHeight;
      return (
        '<line class="trend-grid" x1="' +
        padding.left +
        '" y1="' +
        y.toFixed(2) +
        '" x2="' +
        (padding.left + plotWidth).toFixed(2) +
        '" y2="' +
        y.toFixed(2) +
        '"></line>' +
        '<text class="trend-axis" x="' +
        (padding.left + plotWidth + 8).toFixed(2) +
        '" y="' +
        (y + 4).toFixed(2) +
        '">' +
        level +
        "%</text>"
      );
    }).join("");

    const optionPaths = market.options
      .map(function (option, index) {
        const color = getOptionColor(index);
        const d = points
          .map(function (point, pointIndex) {
            const x = padding.left + (pointIndex / maxIndex) * plotWidth;
            const share = clamp(Number(point.s[option.id] || 0), 0, 100);
            const y = padding.top + ((100 - share) / 100) * plotHeight;
            return (pointIndex === 0 ? "M" : "L") + " " + x.toFixed(2) + " " + y.toFixed(2);
          })
          .join(" ");

        const lastPoint = points[points.length - 1];
        const finalShare = clamp(Number(lastPoint.s[option.id] || 0), 0, 100);
        const finalX = padding.left + plotWidth;
        const finalY = padding.top + ((100 - finalShare) / 100) * plotHeight;

        return (
          '<path d="' +
          d +
          '" fill="none" stroke="' +
          color +
          '" stroke-width="' +
          (index === 0 ? leadStroke : baseStroke) +
          '" stroke-linecap="round" stroke-linejoin="round"></path>' +
          '<circle cx="' +
          finalX.toFixed(2) +
          '" cy="' +
          finalY.toFixed(2) +
          '" r="' +
          dotRadius +
          '" fill="' +
          color +
          '" opacity="0.95"></circle>'
        );
      })
      .join("");

    chartEl.setAttribute("aria-label", "Trend chart for " + market.question);
    chartEl.innerHTML =
      '<rect class="trend-bg" x="0" y="0" width="' +
      width +
      '" height="' +
      height +
      '" rx="12" ry="12"></rect>' +
      grid +
      optionPaths;

    const lastPoint = points[points.length - 1];
    metaEl.textContent = "Updated " + formatTimeAgo(lastPoint.t);

    const latest = market.options
      .map(function (option, index) {
        return {
          option: option,
          color: getOptionColor(index),
          share: clamp(Number(lastPoint.s[option.id] || 0), 0, 100),
        };
      })
      .sort(function (a, b) {
        return b.share - a.share;
      });

    legendEl.innerHTML = latest
      .map(function (item) {
        const label = market.type === "binary" ? item.option.id.toUpperCase() : item.option.letter + ".";
        return (
          '<span class="trend-item">' +
          '<span class="trend-dot" style="background:' +
          item.color +
          '"></span>' +
          escapeHtml(label) +
          " " +
          item.share +
          "%</span>"
        );
      })
      .join("");
  }

  function updateTicketPreview() {
    const market = getSelectedMarket();
    if (!market) {
      el.ticketPreview.textContent = "";
      return;
    }

    if (market.type === "binary") {
      updateBinaryPreview(market);
      return;
    }

    updateMultiPreview(market);
  }

  function updateBinaryPreview(market) {
    const coinsInput = el.ticketPanel.querySelector("#binaryCoinsRange");
    const coins = clamp(Math.round(Number((coinsInput && coinsInput.value) || DEFAULT_CAST_COINS)), 1, WEEKLY_COINS);
    const existing = getPositionsForMarket(market.id)[0] || null;

    const spentWithoutMarket = getCoinsSpent() - getCoinsSpentForMarket(market.id);
    const remainingAfter = WEEKLY_COINS - (spentWithoutMarket + coins);

    if (remainingAfter < 0) {
      el.ticketPreview.textContent =
        "This cast exceeds your weekly budget by " + formatCredenceTokens(Math.abs(remainingAfter)) + ".";
      return;
    }

    const currentSnapshot = getMarketSnapshot(market);
    const projectedSnapshot = getMarketSnapshot(market, [
      {
        marketId: market.id,
        optionId: selectedSide,
        coins: coins,
      },
    ]);

    const currentShare = currentSnapshot.optionShares[selectedSide] || 0;
    const projectedShare = projectedSnapshot.optionShares[selectedSide] || 0;
    const delta = projectedShare - currentShare;
    const movement = delta === 0 ? "no shift" : delta > 0 ? "up " + delta : "down " + Math.abs(delta);

    let allocationText = "New vote.";
    if (existing) {
      allocationText =
        "Replaces your current " +
        existing.optionId.toUpperCase() +
        " allocation of " +
        formatCredenceTokens(existing.coins) +
        ".";
    }

    el.ticketPreview.textContent =
      allocationText +
      " After cast: YES " +
      (projectedSnapshot.optionShares.yes || 0) +
      "% / NO " +
      (projectedSnapshot.optionShares.no || 0) +
      "% (selected side " +
      movement +
      "). Remaining credence tokens: " +
      remainingAfter +
      ".";
  }

  function updateMultiPreview(market) {
    const draftPositions = getDraftMultiPositions(market);
    const existingPositions = getPositionsForMarket(market.id);

    if (draftPositions.length === 0 && existingPositions.length === 0) {
      el.ticketPreview.textContent = "Select at least one option to cast credence tokens on this ballot.";
      return;
    }

    const spentWithoutMarket = getCoinsSpent() - getCoinsSpentForMarket(market.id);
    const projectedSpend = draftPositions.reduce(function (sum, position) {
      return sum + position.coins;
    }, 0);
    const remainingAfter = WEEKLY_COINS - (spentWithoutMarket + projectedSpend);

    if (remainingAfter < 0) {
      el.ticketPreview.textContent =
        "This ballot exceeds your weekly budget by " + formatCredenceTokens(Math.abs(remainingAfter)) + ".";
      return;
    }

    const currentSnapshot = getMarketSnapshot(market);
    const projectedSnapshot = getMarketSnapshot(market, draftPositions);

    const topCurrent = describeTopOptions(market, currentSnapshot, 2);
    const topProjected = describeTopOptions(market, projectedSnapshot, 2);

    if (draftPositions.length === 0) {
      el.ticketPreview.textContent =
        "Casting now would clear your allocation on this market. Remaining credence tokens: " + remainingAfter + ".";
      return;
    }

    el.ticketPreview.textContent =
      "Selected " +
      draftPositions.length +
      " options for " +
      formatCredenceTokens(projectedSpend) +
      ". Top now: " +
      topCurrent +
      ". Projected top: " +
      topProjected +
      ". Remaining credence tokens: " +
      remainingAfter +
      ".";
  }

  function onCastCoins() {
    ensureCurrentWeek();

    const market = getSelectedMarket();
    if (!market) {
      el.ticketStatus.textContent = "Select a proposition first.";
      return;
    }

    if (market.type === "binary") {
      castBinaryMarket(market);
      return;
    }

    castMultiMarket(market);
  }

  function castBinaryMarket(market) {
    const input = el.ticketPanel.querySelector("#binaryCoinsRange");
    const coins = clamp(Math.round(Number((input && input.value) || DEFAULT_CAST_COINS)), 1, WEEKLY_COINS);
    const existing = getPositionsForMarket(market.id)[0] || null;

    const spentWithoutMarket = getCoinsSpent() - getCoinsSpentForMarket(market.id);
    if (spentWithoutMarket + coins > WEEKLY_COINS) {
      const available = WEEKLY_COINS - spentWithoutMarket;
      el.ticketStatus.textContent =
        "Not enough credence tokens remaining. You can allocate up to " + formatCredenceTokens(Math.max(0, available)) + " here.";
      return;
    }

    if (existing && existing.optionId === selectedSide && existing.coins === coins) {
      el.ticketStatus.textContent = "No change: your allocation is already set to this value.";
      return;
    }

    const timestamp = new Date().toISOString();
    const nextPositions = [
      {
        marketId: market.id,
        optionId: selectedSide,
        coins: coins,
        updatedAt: timestamp,
      },
    ];

    const changes = [];
    if (existing && existing.optionId !== selectedSide) {
      changes.push({
        optionId: existing.optionId,
        coins: 0,
        previousCoins: existing.coins,
      });
    }

    changes.push({
      optionId: selectedSide,
      coins: coins,
      previousCoins: existing && existing.optionId === selectedSide ? existing.coins : null,
    });

    replacePositionsForMarket(market.id, nextPositions);
    appendActivity(market.id, changes, timestamp);
    recordTrendPoint(market.id, timestamp);

    saveState();
    renderAll();

    el.ticketStatus.textContent =
      "Vote recorded: " + selectedSide.toUpperCase() + " with " + formatCredenceTokens(coins) + ".";
  }

  function castMultiMarket(market) {
    const draftPositions = getDraftMultiPositions(market);
    const existingPositions = getPositionsForMarket(market.id);

    if (draftPositions.length === 0 && existingPositions.length === 0) {
      el.ticketStatus.textContent = "Choose at least one option on this ballot.";
      return;
    }

    const projectedSpend = draftPositions.reduce(function (sum, position) {
      return sum + position.coins;
    }, 0);

    const spentWithoutMarket = getCoinsSpent() - getCoinsSpentForMarket(market.id);
    if (spentWithoutMarket + projectedSpend > WEEKLY_COINS) {
      const available = WEEKLY_COINS - spentWithoutMarket;
      el.ticketStatus.textContent =
        "Not enough credence tokens remaining. This ballot can use up to " + formatCredenceTokens(Math.max(0, available)) + ".";
      return;
    }

    if (areSamePositions(existingPositions, draftPositions)) {
      el.ticketStatus.textContent = "No change: your ballot allocation is already set to this value.";
      return;
    }

    const timestamp = new Date().toISOString();
    const nextPositions = draftPositions.map(function (position) {
      return {
        marketId: market.id,
        optionId: position.optionId,
        coins: position.coins,
        updatedAt: timestamp,
      };
    });

    const changes = buildChanges(existingPositions, nextPositions);

    replacePositionsForMarket(market.id, nextPositions);
    appendActivity(market.id, changes, timestamp);
    recordTrendPoint(market.id, timestamp);

    saveState();
    renderAll();

    if (nextPositions.length === 0) {
      el.ticketStatus.textContent = "Ballot cleared and credence tokens returned to your weekly budget.";
      return;
    }

    el.ticketStatus.textContent =
      "Ballot recorded: " +
      nextPositions.length +
      " options for " +
      formatCredenceTokens(projectedSpend) +
      ".";
  }

  function onClearMarket() {
    const market = getSelectedMarket();
    if (!market) {
      el.ticketStatus.textContent = "Select a proposition first.";
      return;
    }

    const existing = getPositionsForMarket(market.id);
    if (existing.length === 0) {
      el.ticketStatus.textContent = "No allocation to clear on this market.";
      return;
    }

    const changes = existing.map(function (position) {
      return {
        optionId: position.optionId,
        coins: 0,
        previousCoins: position.coins,
      };
    });
    const timestamp = new Date().toISOString();

    replacePositionsForMarket(market.id, []);

    if (market.type === "multi") {
      const draft = ensureMultiDraft(market);
      market.options.forEach(function (option) {
        if (!draft[option.id]) {
          draft[option.id] = { selected: false, coins: DEFAULT_MULTI_OPTION_COINS };
        } else {
          draft[option.id].selected = false;
        }
      });
    }

    appendActivity(market.id, changes, timestamp);
    recordTrendPoint(market.id, timestamp);
    saveState();
    renderAll();

    el.ticketStatus.textContent = "Cleared this market allocation.";
  }

  function renderFeed() {
    if (state.activity.length === 0) {
      el.feedList.innerHTML = '<li class="empty-item"><p>No votes this week yet.</p></li>';
      return;
    }

    const entries = state.activity
      .slice()
      .sort(function (a, b) {
        return b.createdAt.localeCompare(a.createdAt);
      })
      .slice(0, FEED_LIMIT);

    el.feedList.innerHTML = entries
      .map(function (entry) {
        const market = marketById.get(entry.marketId);
        if (!market) return "";

        const changeSummary = summarizeChangesForFeed(market, entry.changes);
        const changeDetails = describeChangesForFeed(market, entry.changes);

        return (
          '<li class="feed-item">' +
          '<p class="feed-main">' +
          escapeHtml(changeSummary) +
          "</p>" +
          '<p class="feed-meta">' +
          escapeHtml(market.question) +
          " | " +
          escapeHtml(changeDetails) +
          " | " +
          escapeHtml(formatTimeAgo(entry.createdAt)) +
          "</p>" +
          "</li>"
        );
      })
      .join("");
  }

  function summarizeChangesForFeed(market, changes) {
    if (!Array.isArray(changes) || changes.length === 0) {
      return "No change details available";
    }

    if (changes.length === 1) {
      const item = changes[0];
      const option = getOption(market.id, item.optionId);
      const optionLabel = option ? optionDisplayLabel(option, market.type === "binary") : item.optionId;
      if (item.coins === 0) {
        return "Cleared " + optionLabel;
      }
      return optionLabel + " " + formatCredenceTokens(item.coins);
    }

    const total = changes.reduce(function (sum, item) {
      return sum + Math.max(0, item.coins);
    }, 0);
    return "Updated " + changes.length + " options (" + formatCredenceTokens(total) + ")";
  }

  function describeChangesForFeed(market, changes) {
    return changes
      .map(function (item) {
        const option = getOption(market.id, item.optionId);
        const optionLabel = option ? optionDisplayLabel(option, market.type === "binary") : item.optionId;
        if (item.coins === 0) {
          return optionLabel + " cleared";
        }
        if (item.previousCoins == null) {
          return optionLabel + " set to " + formatCredenceTokens(item.coins);
        }
        return (
          optionLabel +
          " " +
          formatCredenceTokens(item.coins) +
          " (was " +
          formatCredenceTokens(item.previousCoins) +
          ")"
        );
      })
      .join("; ");
  }

  function renderPositions() {
    if (state.positions.length === 0) {
      el.positionsList.innerHTML = '<li class="empty-item"><p>No active positions this week.</p></li>';
      return;
    }

    const grouped = getPositionGroups();

    el.positionsList.innerHTML = grouped
      .map(function (group) {
        const market = marketById.get(group.marketId);
        if (!market) return "";

        const snapshot = getMarketSnapshot(market);
        const detail = group.positions
          .map(function (position) {
            const option = getOption(market.id, position.optionId);
            if (!option) return "";
            return optionDisplayLabel(option, market.type === "binary") + " " + formatCredenceTokens(position.coins);
          })
          .filter(Boolean)
          .join(" | ");

        const summary =
          market.type === "binary"
            ? "board YES " + (snapshot.optionShares.yes || 0) + "%"
            : "top " + describeTopOptions(market, snapshot, 2);

        return (
          '<li class="positions-item">' +
          '<p class="positions-main">' +
          escapeHtml(market.question) +
          "</p>" +
          '<p class="positions-meta">' +
          escapeHtml(detail) +
          " | " +
          escapeHtml(summary) +
          "</p>" +
          "</li>"
        );
      })
      .join("");
  }

  function getPositionGroups() {
    const groups = new Map();

    state.positions.forEach(function (position) {
      if (!groups.has(position.marketId)) {
        groups.set(position.marketId, []);
      }
      groups.get(position.marketId).push(position);
    });

    return Array.from(groups.entries())
      .map(function (entry) {
        const positions = entry[1].slice().sort(function (a, b) {
          return b.updatedAt.localeCompare(a.updatedAt);
        });
        return {
          marketId: entry[0],
          positions: positions,
          updatedAt: positions[0].updatedAt,
        };
      })
      .sort(function (a, b) {
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }

  function renderResolutionSummary() {
    if (!el.resolutionSummary) return;

    if (!Array.isArray(state.history) || state.history.length === 0) {
      el.resolutionSummary.textContent = "No prior week resolution snapshot yet.";
      return;
    }

    const latest = state.history[0];
    const start = new Date(latest.weekStart);
    const end = new Date(latest.weekEnd);
    const resolvedAt = new Date(latest.resolvedAt);

    el.resolutionSummary.textContent =
      "Last resolved week (" +
      formatDateRange(start, end) +
      "): " +
      formatCredenceTokens(latest.totalCoins) +
      " across " +
      latest.marketCount +
      " markets and " +
      latest.optionCount +
      " options. Cast actions: " +
      latest.voteCount +
      ". Resolved " +
      formatShortDateTime(resolvedAt) +
      ".";
  }

  function selectMarket(marketId, optionId) {
    const market = marketById.get(marketId);
    if (!market) return;

    if (!isDetailRoute) {
      navigateToMarketDetail(marketId, optionId);
      return;
    }

    selectedMarketId = marketId;

    if (market.type === "binary") {
      if (optionId === "yes" || optionId === "no") {
        selectedSide = optionId;
      } else {
        const existing = getPositionsForMarket(marketId)[0] || null;
        if (existing && (existing.optionId === "yes" || existing.optionId === "no")) {
          selectedSide = existing.optionId;
        }
      }
    }

    if (market.type === "multi") {
      ensureMultiDraft(market);
    }

    el.ticketStatus.textContent = "";
    renderMarketDetailMain();
    renderTicket();
  }

  function getSelectedMarket() {
    if (!selectedMarketId) return null;
    return marketById.get(selectedMarketId) || null;
  }

  function getPositionsForMarket(marketId) {
    return state.positions.filter(function (position) {
      return position.marketId === marketId;
    });
  }

  function replacePositionsForMarket(marketId, nextPositions) {
    state.positions = state.positions.filter(function (position) {
      return position.marketId !== marketId;
    });

    state.positions = state.positions.concat(nextPositions);
  }

  function appendActivity(marketId, changes, timestamp) {
    state.activity.push({
      id: uid("vote"),
      marketId: marketId,
      changes: changes,
      createdAt: timestamp,
    });
  }

  function getCoinsSpent() {
    return state.positions.reduce(function (sum, position) {
      return sum + position.coins;
    }, 0);
  }

  function getCoinsSpentForMarket(marketId) {
    return getPositionsForMarket(marketId).reduce(function (sum, position) {
      return sum + position.coins;
    }, 0);
  }

  function getCoinsRemaining() {
    return Math.max(0, WEEKLY_COINS - getCoinsSpent());
  }

  function getMarketSnapshot(market, hypotheticalPositions) {
    const optionCoins = Object.create(null);

    market.options.forEach(function (option) {
      optionCoins[option.id] = (option.baseline / 100) * BASELINE_LIQUIDITY;
    });

    const existingPositions = getPositionsForMarket(market.id);
    existingPositions.forEach(function (position) {
      if (optionCoins[position.optionId] == null) return;
      optionCoins[position.optionId] += position.coins;
    });

    if (Array.isArray(hypotheticalPositions)) {
      existingPositions.forEach(function (position) {
        if (optionCoins[position.optionId] == null) return;
        optionCoins[position.optionId] -= position.coins;
      });

      hypotheticalPositions.forEach(function (position) {
        if (optionCoins[position.optionId] == null) return;
        optionCoins[position.optionId] += position.coins;
      });
    }

    const total = market.options.reduce(function (sum, option) {
      return sum + Math.max(0, optionCoins[option.id] || 0);
    }, 0);

    const shares = roundSharesToHundred(market.options, optionCoins, total);

    const ordered = market.options
      .map(function (option) {
        return {
          optionId: option.id,
          share: shares[option.id] || 0,
        };
      })
      .sort(function (a, b) {
        return b.share - a.share;
      });

    return {
      optionShares: shares,
      ordered: ordered,
    };
  }

  function roundSharesToHundred(options, optionCoins, total) {
    const shares = Object.create(null);
    if (total <= 0) {
      options.forEach(function (option) {
        shares[option.id] = 0;
      });
      return shares;
    }

    const fractional = [];
    let floorSum = 0;

    options.forEach(function (option) {
      const raw = (Math.max(0, optionCoins[option.id] || 0) / total) * 100;
      const floorValue = Math.floor(raw);
      shares[option.id] = floorValue;
      floorSum += floorValue;
      fractional.push({
        optionId: option.id,
        remainder: raw - floorValue,
      });
    });

    let remainder = 100 - floorSum;
    fractional.sort(function (a, b) {
      return b.remainder - a.remainder;
    });

    for (let i = 0; i < remainder; i += 1) {
      const next = fractional[i % fractional.length];
      shares[next.optionId] += 1;
    }

    return shares;
  }

  function getDraftMultiPositions(market) {
    const draft = ensureMultiDraft(market);

    return market.options
      .map(function (option) {
        const row = draft[option.id];
        if (!row || !row.selected) return null;
        const coins = clamp(Math.round(Number(row.coins || DEFAULT_MULTI_OPTION_COINS)), 1, WEEKLY_COINS);
        return {
          marketId: market.id,
          optionId: option.id,
          coins: coins,
        };
      })
      .filter(Boolean);
  }

  function ensureMultiDraft(market) {
    if (multiDraftByMarket[market.id]) {
      return multiDraftByMarket[market.id];
    }

    const existingByOption = new Map(
      getPositionsForMarket(market.id).map(function (position) {
        return [position.optionId, position];
      })
    );

    const draft = Object.create(null);
    market.options.forEach(function (option) {
      const existing = existingByOption.get(option.id);
      draft[option.id] = {
        selected: Boolean(existing),
        coins: existing ? existing.coins : DEFAULT_MULTI_OPTION_COINS,
      };
    });

    multiDraftByMarket[market.id] = draft;
    return draft;
  }

  function getBinaryDraftKey(marketId, side) {
    return marketId + ":" + side;
  }

  function describeTopOptions(market, snapshot, count) {
    return snapshot.ordered
      .slice(0, count)
      .map(function (item) {
        const option = getOption(market.id, item.optionId);
        if (!option) return "";
        return optionDisplayLabel(option, market.type === "binary") + " " + item.share + "%";
      })
      .filter(Boolean)
      .join(" | ");
  }

  function optionDisplayLabel(option, binaryStyle) {
    if (binaryStyle) return option.id.toUpperCase();
    return option.letter + ". " + option.shortLabel;
  }

  function buildChanges(existingPositions, nextPositions) {
    const changes = [];
    const previousByOption = new Map(
      existingPositions.map(function (position) {
        return [position.optionId, position.coins];
      })
    );
    const nextByOption = new Map(
      nextPositions.map(function (position) {
        return [position.optionId, position.coins];
      })
    );

    nextByOption.forEach(function (coins, optionId) {
      const previousCoins = previousByOption.has(optionId)
        ? previousByOption.get(optionId)
        : null;
      if (previousCoins === coins) return;
      changes.push({
        optionId: optionId,
        coins: coins,
        previousCoins: previousCoins,
      });
    });

    previousByOption.forEach(function (coins, optionId) {
      if (nextByOption.has(optionId)) return;
      changes.push({
        optionId: optionId,
        coins: 0,
        previousCoins: coins,
      });
    });

    return changes;
  }

  function areSamePositions(a, b) {
    if (a.length !== b.length) return false;

    const aMap = new Map(
      a.map(function (position) {
        return [position.optionId, position.coins];
      })
    );

    for (let i = 0; i < b.length; i += 1) {
      const item = b[i];
      if (!aMap.has(item.optionId)) return false;
      if (aMap.get(item.optionId) !== item.coins) return false;
    }

    return true;
  }

  function getOption(marketId, optionId) {
    const options = optionByMarketAndId.get(marketId);
    if (!options) return null;
    return options.get(optionId) || null;
  }

  function getOptionColor(index) {
    return OPTION_COLORS[index % OPTION_COLORS.length];
  }

  function ensureTheoryExpandedMap(marketId) {
    if (!expandedTheoryByMarket[marketId]) {
      expandedTheoryByMarket[marketId] = Object.create(null);
    }
    return expandedTheoryByMarket[marketId];
  }

  function toggleTheoryExpanded(marketId, optionId) {
    const expanded = ensureTheoryExpandedMap(marketId);
    expanded[optionId] = !expanded[optionId];
  }

  function getTrendSeries(marketId) {
    if (!state.trends || typeof state.trends !== "object") {
      state.trends = Object.create(null);
    }
    if (!Array.isArray(state.trends[marketId])) {
      state.trends[marketId] = [];
    }
    return state.trends[marketId];
  }

  function ensureTrendSeedForMarket(marketId) {
    const market = marketById.get(marketId);
    if (!market) return;

    const series = getTrendSeries(marketId);
    if (series.length > 0) return;

    const snapshot = getMarketSnapshot(market);
    series.push(buildTrendPoint(state.weekStart || new Date().toISOString(), snapshot.optionShares, market));
  }

  function seedAllMarketTrends() {
    MARKETS.forEach(function (market) {
      ensureTrendSeedForMarket(market.id);
    });
  }

  function recordTrendPoint(marketId, timestamp) {
    const market = marketById.get(marketId);
    if (!market) return;

    ensureTrendSeedForMarket(marketId);
    const series = getTrendSeries(marketId);
    const snapshot = getMarketSnapshot(market);
    const nextPoint = buildTrendPoint(timestamp, snapshot.optionShares, market);
    const previousPoint = series.length > 0 ? series[series.length - 1] : null;

    if (previousPoint && sharesEqual(previousPoint.s, nextPoint.s, market)) {
      previousPoint.t = timestamp;
      return;
    }

    series.push(nextPoint);
    if (series.length > TREND_POINT_LIMIT) {
      series.splice(0, series.length - TREND_POINT_LIMIT);
    }
  }

  function buildTrendPoint(timestamp, shares, market) {
    const normalized = Object.create(null);
    market.options.forEach(function (option) {
      normalized[option.id] = clamp(Math.round(Number(shares[option.id] || 0)), 0, 100);
    });

    return {
      t: String(timestamp || new Date().toISOString()),
      s: normalized,
    };
  }

  function cloneShares(shares) {
    const cloned = Object.create(null);
    Object.keys(shares || {}).forEach(function (key) {
      cloned[key] = shares[key];
    });
    return cloned;
  }

  function sharesEqual(a, b, market) {
    for (let i = 0; i < market.options.length; i += 1) {
      const optionId = market.options[i].id;
      if (Number(a[optionId] || 0) !== Number(b[optionId] || 0)) return false;
    }
    return true;
  }

  function ensureCurrentWeek() {
    const currentWeek = getWeekContext(new Date());

    if (state.weekId === currentWeek.weekId) {
      state.weekStart = currentWeek.start.toISOString();
      state.weekEnd = currentWeek.end.toISOString();
      return;
    }

    archiveCurrentWeek();

    state.weekId = currentWeek.weekId;
    state.weekStart = currentWeek.start.toISOString();
    state.weekEnd = currentWeek.end.toISOString();
    state.positions = [];
    state.activity = [];
    state.trends = Object.create(null);
    saveState();
  }

  function archiveCurrentWeek() {
    if (state.positions.length === 0 && state.activity.length === 0) {
      return;
    }

    const marketSet = new Set(
      state.positions.map(function (position) {
        return position.marketId;
      })
    );

    const summary = {
      id: uid("week"),
      weekId: state.weekId,
      weekStart: state.weekStart,
      weekEnd: state.weekEnd,
      resolvedAt: new Date().toISOString(),
      voteCount: state.activity.length,
      marketCount: marketSet.size,
      optionCount: state.positions.length,
      totalCoins: getCoinsSpent(),
    };

    state.history.unshift(summary);
    state.history = state.history.slice(0, HISTORY_LIMIT);
  }

  function getWeekContext(date) {
    const now = new Date(date);
    const start = new Date(now);
    const day = start.getDay();
    const daysSinceMonday = (day + 6) % 7;

    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - daysSinceMonday);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const weekId =
      String(start.getFullYear()) +
      "-" +
      pad2(start.getMonth() + 1) +
      "-" +
      pad2(start.getDate());

    return {
      weekId: weekId,
      start: start,
      end: end,
    };
  }

  function createBinaryMarket(config) {
    const yes = clamp(Math.round(Number(config.baselineYes)), 1, 99);
    return {
      id: config.id,
      type: "binary",
      question: config.question,
      category: config.category,
      volume: config.volume,
      context: String(config.context || ""),
      yesCase: String(config.yesCase || ""),
      noCase: String(config.noCase || ""),
      options: [
        {
          id: "yes",
          letter: "Y",
          label: "Yes",
          shortLabel: "Yes",
          baseline: yes,
        },
        {
          id: "no",
          letter: "N",
          label: "No",
          shortLabel: "No",
          baseline: 100 - yes,
        },
      ],
    };
  }

  function parseRouteSelection() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const marketId = String(params.get("market") || "").trim();
      const sideRaw = String(params.get("side") || "").trim().toLowerCase();
      const side = sideRaw === "yes" || sideRaw === "no" ? sideRaw : "";
      return { marketId: marketId, side: side };
    } catch (error) {
      return { marketId: "", side: "" };
    }
  }

  function navigateToMarketDetail(marketId, optionId) {
    const params = new URLSearchParams();
    params.set("market", marketId);
    if (optionId === "yes" || optionId === "no") {
      params.set("side", optionId);
    }
    const nextUrl = "moral-market.html?" + params.toString();
    window.location.assign(nextUrl);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatVolume(value) {
    return compactNumber.format(value);
  }

  function formatCredenceTokens(value) {
    const amount = Math.max(0, Math.round(Number(value) || 0));
    return amount + " credence token" + (amount === 1 ? "" : "s");
  }

  function formatDateRange(start, end) {
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });

    return formatter.format(start) + " - " + formatter.format(end);
  }

  function formatShortDateTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "unknown time";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatTimeRemaining(weekEnd) {
    const diff = weekEnd.getTime() - Date.now();
    if (diff <= 0) return "reset imminent";

    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const days = Math.floor(diff / dayMs);
    const hours = Math.floor((diff % dayMs) / hourMs);

    if (days > 0) {
      return days + "d " + hours + "h";
    }

    const minutes = Math.floor((diff % hourMs) / (60 * 1000));
    return hours + "h " + minutes + "m";
  }

  function formatTimeAgo(isoDate) {
    const then = new Date(isoDate).getTime();
    if (!Number.isFinite(then)) return "unknown time";
    const diff = Date.now() - then;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return "just now";
    if (diff < hour) return Math.floor(diff / minute) + "m ago";
    if (diff < day) return Math.floor(diff / hour) + "h ago";

    const date = new Date(then);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function defaultState(week) {
    return {
      version: 4,
      weekId: week.weekId,
      weekStart: week.start.toISOString(),
      weekEnd: week.end.toISOString(),
      positions: [],
      activity: [],
      history: [],
      trends: Object.create(null),
    };
  }

  function loadState(week) {
    try {
      const stored = readStoredStateRaw();
      if (!stored || !stored.raw) return defaultState(week);

      const parsed = JSON.parse(stored.raw);
      if (!parsed || (parsed.version !== 3 && parsed.version !== 4)) {
        return defaultState(week);
      }

      const positions = sanitizePositions(parsed.positions);
      const activity = sanitizeActivity(parsed.activity);
      const history = sanitizeHistory(parsed.history);
      const trends = sanitizeTrends(parsed.trends);

      return {
        version: 4,
        weekId: typeof parsed.weekId === "string" ? parsed.weekId : week.weekId,
        weekStart:
          typeof parsed.weekStart === "string" ? parsed.weekStart : week.start.toISOString(),
        weekEnd: typeof parsed.weekEnd === "string" ? parsed.weekEnd : week.end.toISOString(),
        positions: positions,
        activity: activity,
        history: history,
        trends: trends,
      };
    } catch (error) {
      return defaultState(week);
    }
  }

  function readStoredStateRaw() {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return { key: STORAGE_KEY, raw: current };
    }

    for (let i = 0; i < LEGACY_STORAGE_KEYS.length; i += 1) {
      const key = LEGACY_STORAGE_KEYS[i];
      const raw = localStorage.getItem(key);
      if (raw) {
        return { key: key, raw: raw };
      }
    }

    return null;
  }

  function sanitizePositions(value) {
    if (!Array.isArray(value)) return [];

    let positions = value
      .map(function (position) {
        if (!position || typeof position !== "object") return null;

        const marketId = String(position.marketId || "");
        const optionId = String(position.optionId || "");
        if (!marketById.has(marketId)) return null;
        if (!getOption(marketId, optionId)) return null;

        return {
          marketId: marketId,
          optionId: optionId,
          coins: clamp(Math.round(Number(position.coins)), 1, WEEKLY_COINS),
          updatedAt: String(position.updatedAt || new Date().toISOString()),
        };
      })
      .filter(Boolean);

    positions.sort(function (a, b) {
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    const seenOptionKeys = new Set();
    const seenBinaryMarkets = new Set();
    positions = positions.filter(function (position) {
      const market = marketById.get(position.marketId);
      if (!market) return false;

      const optionKey = position.marketId + ":" + position.optionId;
      if (seenOptionKeys.has(optionKey)) return false;
      seenOptionKeys.add(optionKey);

      if (market.type === "binary") {
        if (seenBinaryMarkets.has(position.marketId)) return false;
        seenBinaryMarkets.add(position.marketId);
      }

      return true;
    });

    let running = 0;
    positions = positions.filter(function (position) {
      if (running + position.coins > WEEKLY_COINS) return false;
      running += position.coins;
      return true;
    });

    return positions;
  }

  function sanitizeActivity(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map(function (entry) {
        if (!entry || typeof entry !== "object") return null;
        const marketId = String(entry.marketId || "");
        if (!marketById.has(marketId)) return null;

        const changes = Array.isArray(entry.changes)
          ? entry.changes
              .map(function (change) {
                if (!change || typeof change !== "object") return null;
                const optionId = String(change.optionId || "");
                if (!getOption(marketId, optionId)) return null;

                return {
                  optionId: optionId,
                  coins: clamp(Math.round(Number(change.coins || 0)), 0, WEEKLY_COINS),
                  previousCoins:
                    change.previousCoins == null
                      ? null
                      : clamp(Math.round(Number(change.previousCoins)), 0, WEEKLY_COINS),
                };
              })
              .filter(Boolean)
          : [];

        return {
          id: String(entry.id || uid("vote")),
          marketId: marketId,
          changes: changes,
          createdAt: String(entry.createdAt || new Date().toISOString()),
        };
      })
      .filter(Boolean);
  }

  function sanitizeHistory(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map(function (summary) {
        if (!summary || typeof summary !== "object") return null;

        return {
          id: String(summary.id || uid("week")),
          weekId: String(summary.weekId || ""),
          weekStart: String(summary.weekStart || ""),
          weekEnd: String(summary.weekEnd || ""),
          resolvedAt: String(summary.resolvedAt || new Date().toISOString()),
          voteCount: clamp(Math.round(Number(summary.voteCount || 0)), 0, 9999),
          marketCount: clamp(Math.round(Number(summary.marketCount || 0)), 0, MARKETS.length),
          optionCount: clamp(Math.round(Number(summary.optionCount || 0)), 0, MARKETS.length * 6),
          totalCoins: clamp(Math.round(Number(summary.totalCoins || 0)), 0, WEEKLY_COINS),
        };
      })
      .filter(Boolean)
      .slice(0, HISTORY_LIMIT);
  }

  function sanitizeTrends(value) {
    const trends = Object.create(null);
    if (!value || typeof value !== "object") return trends;

    Object.keys(value).forEach(function (marketId) {
      const market = marketById.get(marketId);
      if (!market) return;

      const rawSeries = Array.isArray(value[marketId]) ? value[marketId] : [];
      const cleanSeries = rawSeries
        .map(function (point) {
          if (!point || typeof point !== "object") return null;

          const shares = Object.create(null);
          market.options.forEach(function (option) {
            shares[option.id] = clamp(Math.round(Number(point.s && point.s[option.id])), 0, 100);
          });

          return {
            t: String(point.t || new Date().toISOString()),
            s: shares,
          };
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return a.t.localeCompare(b.t);
        })
        .slice(-TREND_POINT_LIMIT);

      if (cleanSeries.length > 0) {
        trends[marketId] = cleanSeries;
      }
    });

    return trends;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function bindRevealAnimation() {
    const blocks = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      blocks.forEach(function (block) {
        block.classList.add("reveal-on");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-on");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    blocks.forEach(function (block) {
      observer.observe(block);
    });
  }

  function bindLiveTrendTicker() {
    window.setInterval(function () {
      const market = getSelectedMarket();
      if (!market) return;
      if (!isDetailRoute) {
        renderTrendPanel(market);
      }
      if (isDetailRoute) {
        renderDetailTrendPanel(market);
        renderDetailActivity(market);
      }
    }, 15000);
  }
})();
