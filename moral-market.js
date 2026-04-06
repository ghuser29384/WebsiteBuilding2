(function () {
  "use strict";

  const STORAGE_KEY_BASE = "normativity-market-state-v4";
  const LEGACY_STORAGE_KEY_BASE = "normativity-market-state-v3";
  const STORAGE_KEY = resolveScopedStorageKey(STORAGE_KEY_BASE);
  const LEGACY_STORAGE_KEYS = [
    STORAGE_KEY_BASE,
    resolveScopedStorageKey(LEGACY_STORAGE_KEY_BASE),
    LEGACY_STORAGE_KEY_BASE,
  ];
  const WEEKLY_COINS = 100;
  const BASELINE_LIQUIDITY = 240;
  const FEED_LIMIT = 12;
  const HISTORY_LIMIT = 10;
  const TREND_POINT_LIMIT = 280;
  const TREND_GRID_LEVELS = [75, 50, 25, 0];
  const DEFAULT_CAST_COINS = 25;
  const DEFAULT_MULTI_OPTION_COINS = 12;
  const OPTION_COLORS = ["#2f3d53", "#6f665f", "#5d6f86", "#8a7a6e", "#7d858f", "#8a7f95", "#5f7380"];

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
              label: "Reference - Death (Deprivation Account)",
              url: "/normative-issues.html#reference-library",
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
              label: "Reference - Consequentialism",
              url: "/normative-issues.html#reference-library",
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
              label: "Reference - Kant's Moral Philosophy",
              url: "/normative-issues.html#reference-library",
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
              label: "Reference - Rights",
              url: "/normative-issues.html#reference-library",
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
              label: "Reference - Virtue Ethics",
              url: "/normative-issues.html#reference-library",
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
  let activeSort = "contested_desc";
  let showPositionsOnly = false;
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
  const chartZoomStateByEl = new WeakMap();

  const el = {
    heroSection: document.getElementById("heroSection"),
    boardSection: document.getElementById("boardSection"),
    boardControls: document.getElementById("boardControls"),
    marketCount: document.getElementById("marketCount"),
    castCount: document.getElementById("castCount"),
    positionCount: document.getElementById("positionCount"),
    searchInput: document.getElementById("searchInput"),
    categoryFilters: document.getElementById("categoryFilters"),
    sortSelect: document.getElementById("sortSelect"),
    positionsOnlyToggle: document.getElementById("positionsOnlyToggle"),
    resultSummary: document.getElementById("resultSummary"),
    marketGrid: document.getElementById("marketGrid"),
    marketDetailMain: document.getElementById("marketDetailMain"),
    detailMarketType: document.getElementById("detailMarketType"),
    detailCategory: document.getElementById("detailCategory"),
    detailVolume: document.getElementById("detailVolume"),
    detailQuestion: document.getElementById("detailQuestion"),
    detailConsensusLine: document.getElementById("detailConsensusLine"),
    detailWeekLine: document.getElementById("detailWeekLine"),
    detailSignalCount: document.getElementById("detailSignalCount"),
    detailForecasterCount: document.getElementById("detailForecasterCount"),
    detailCurrentEstimate: document.getElementById("detailCurrentEstimate"),
    detailEstimateRange: document.getElementById("detailEstimateRange"),
    detailContext: document.getElementById("detailContext"),
    detailOutcomeContext: document.getElementById("detailOutcomeContext"),
    detailTheoryContext: document.getElementById("detailTheoryContext"),
    detailActivityList: document.getElementById("detailActivityList"),
    detailDistributionMeta: document.getElementById("detailDistributionMeta"),
    detailDistributionChart: document.getElementById("detailDistributionChart"),
    detailDistributionLegend: document.getElementById("detailDistributionLegend"),
    detailDistributionSummary: document.getElementById("detailDistributionSummary"),
    detailVoterDistributionMeta: document.getElementById("detailVoterDistributionMeta"),
    detailVoterDistributionChart: document.getElementById("detailVoterDistributionChart"),
    detailVoterDistributionLegend: document.getElementById("detailVoterDistributionLegend"),
    detailVoterDistributionSummary: document.getElementById("detailVoterDistributionSummary"),
    detailFactorsGrid: document.getElementById("detailFactorsGrid"),
    detailJumpToCast: document.getElementById("detailJumpToCast"),
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
    detailInfoPanel: document.getElementById("detailInfoPanel"),
    detailInfoList: document.getElementById("detailInfoList"),
    detailTagPanel: document.getElementById("detailTagPanel"),
    detailTagList: document.getElementById("detailTagList"),
    detailSimilarPanel: document.getElementById("detailSimilarPanel"),
    detailSimilarList: document.getElementById("detailSimilarList"),
    resolutionSection: document.getElementById("resolutionSection"),
    resolutionSummary: document.getElementById("resolutionSummary"),
  };

  init();

  function getAuthUser() {
    try {
      if (!window.NormativityAuth || typeof window.NormativityAuth.getCurrentUser !== "function") {
        return null;
      }
      return window.NormativityAuth.getCurrentUser() || null;
    } catch (_error) {
      return null;
    }
  }

  function isAuthenticated() {
    const user = getAuthUser();
    return Boolean(user && user.id);
  }

  function getCurrentPathWithSearchAndHash() {
    const path = window.location.pathname || "/moral-market.html";
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    return path + search + hash;
  }

  function getAuthRedirectUrl(mode) {
    return "auth.html?mode=" + encodeURIComponent(mode || "signin") + "&next=" + encodeURIComponent(getCurrentPathWithSearchAndHash());
  }

  function redirectToAuth(mode) {
    window.location.assign(getAuthRedirectUrl(mode || "signin"));
  }

  function resolveScopedStorageKey(baseKey) {
    try {
      if (!window.NormativityAuth || typeof window.NormativityAuth.scopedStorageKey !== "function") {
        return baseKey;
      }
      return window.NormativityAuth.scopedStorageKey(baseKey);
    } catch (_error) {
      return baseKey;
    }
  }

  function init() {
    initChartTrackpadZooming();
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

  function initChartTrackpadZooming() {
    enableTrackpadZoomForChart(el.trendChart, { maxScale: 16 });
    enableTrackpadZoomForChart(el.detailTrendChart, { maxScale: 16 });
    enableTrackpadZoomForChart(el.detailDistributionChart, { maxScale: 16 });
    enableTrackpadZoomForChart(el.detailVoterDistributionChart, { maxScale: 16 });
  }

  function enableTrackpadZoomForChart(svgEl, options) {
    if (!svgEl || chartZoomStateByEl.has(svgEl)) return;

    const baseViewBox = readSvgViewBox(svgEl);
    if (!baseViewBox) return;

    const zoomState = {
      base: baseViewBox,
      current: {
        x: baseViewBox.x,
        y: baseViewBox.y,
        width: baseViewBox.width,
        height: baseViewBox.height,
      },
      maxScale: Math.max(1, Number(options && options.maxScale) || 12),
      gestureScale: 1,
    };
    chartZoomStateByEl.set(svgEl, zoomState);
    svgEl.style.touchAction = "none";

    svgEl.addEventListener(
      "wheel",
      function (event) {
        if (!event.ctrlKey) return;
        if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
        event.preventDefault();

        const rect = svgEl.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;

        const anchorX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const anchorY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        const deltaMultiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 80 : 1;
        const zoomFactor = Math.exp(-(event.deltaY * deltaMultiplier) * 0.0022);
        applySvgZoom(svgEl, zoomState, zoomFactor, anchorX, anchorY);
      },
      { passive: false }
    );

    svgEl.addEventListener(
      "gesturestart",
      function (event) {
        event.preventDefault();
        zoomState.gestureScale = Number.isFinite(event.scale) && event.scale > 0 ? event.scale : 1;
      },
      { passive: false }
    );

    svgEl.addEventListener(
      "gesturechange",
      function (event) {
        event.preventDefault();
        const nextGestureScale = Number.isFinite(event.scale) && event.scale > 0 ? event.scale : 1;
        const previousGestureScale = zoomState.gestureScale > 0 ? zoomState.gestureScale : 1;
        zoomState.gestureScale = nextGestureScale;

        const factor = clamp(nextGestureScale / previousGestureScale, 0.5, 2);
        const rect = svgEl.getBoundingClientRect();
        const anchorX =
          rect && rect.width > 0 && Number.isFinite(event.clientX)
            ? clamp((event.clientX - rect.left) / rect.width, 0, 1)
            : 0.5;
        const anchorY =
          rect && rect.height > 0 && Number.isFinite(event.clientY)
            ? clamp((event.clientY - rect.top) / rect.height, 0, 1)
            : 0.5;
        applySvgZoom(svgEl, zoomState, factor, anchorX, anchorY);
      },
      { passive: false }
    );

    svgEl.addEventListener(
      "gestureend",
      function (event) {
        event.preventDefault();
        zoomState.gestureScale = 1;
      },
      { passive: false }
    );
  }

  function readSvgViewBox(svgEl) {
    if (!svgEl) return null;

    const rawViewBox = svgEl.getAttribute("viewBox");
    if (rawViewBox) {
      const parts = rawViewBox
        .trim()
        .split(/[\s,]+/)
        .map(function (value) {
          return Number(value);
        });
      if (
        parts.length === 4 &&
        Number.isFinite(parts[0]) &&
        Number.isFinite(parts[1]) &&
        Number.isFinite(parts[2]) &&
        Number.isFinite(parts[3]) &&
        parts[2] > 0 &&
        parts[3] > 0
      ) {
        return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
      }
    }

    const baseVal = svgEl.viewBox && svgEl.viewBox.baseVal;
    if (baseVal && baseVal.width > 0 && baseVal.height > 0) {
      return { x: baseVal.x, y: baseVal.y, width: baseVal.width, height: baseVal.height };
    }

    return null;
  }

  function writeSvgViewBox(svgEl, viewBox) {
    if (!svgEl || !viewBox) return;
    svgEl.setAttribute(
      "viewBox",
      [viewBox.x, viewBox.y, viewBox.width, viewBox.height]
        .map(function (value) {
          return Number(value.toFixed(4));
        })
        .join(" ")
    );
  }

  function applySvgZoom(svgEl, zoomState, zoomFactor, anchorX, anchorY) {
    if (!zoomState || !Number.isFinite(zoomFactor) || zoomFactor <= 0) return;

    const base = zoomState.base;
    const current = zoomState.current;
    const minScale = 1;
    const maxScale = zoomState.maxScale;

    const currentScale = base.width / current.width;
    const nextScale = clamp(currentScale * zoomFactor, minScale, maxScale);
    const nextWidth = base.width / nextScale;
    const nextHeight = base.height / nextScale;

    const normalizedAnchorX = clamp(anchorX, 0, 1);
    const normalizedAnchorY = clamp(anchorY, 0, 1);

    const anchorWorldX = current.x + normalizedAnchorX * current.width;
    const anchorWorldY = current.y + normalizedAnchorY * current.height;

    const rawX = anchorWorldX - normalizedAnchorX * nextWidth;
    const rawY = anchorWorldY - normalizedAnchorY * nextHeight;
    const boundedX = clamp(rawX, base.x, base.x + base.width - nextWidth);
    const boundedY = clamp(rawY, base.y, base.y + base.height - nextHeight);

    zoomState.current = {
      x: boundedX,
      y: boundedY,
      width: nextWidth,
      height: nextHeight,
    };
    writeSvgViewBox(svgEl, zoomState.current);
  }

  function bindEvents() {
    el.searchInput.addEventListener("input", function () {
      renderMarketGrid();
    });

    if (el.sortSelect) {
      el.sortSelect.addEventListener("change", function () {
        activeSort = String(el.sortSelect.value || "contested_desc");
        renderMarketGrid();
      });
    }

    if (el.positionsOnlyToggle) {
      el.positionsOnlyToggle.addEventListener("change", function () {
        showPositionsOnly = Boolean(el.positionsOnlyToggle.checked);
        renderMarketGrid();
      });
    }

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

    el.marketGrid.addEventListener("keydown", function (event) {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const interactive = event.target.closest("button, input, select, textarea, a");
      if (interactive && !interactive.matches("article[data-market-id]")) return;
      const card = event.target.closest("article[data-market-id]");
      if (!card) return;
      event.preventDefault();
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

    if (el.detailJumpToCast) {
      el.detailJumpToCast.addEventListener("click", function () {
        if (!el.ticketPanel) return;
        el.ticketPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
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

    document.body.classList.toggle("market-detail-route", inDetail);

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
    if (el.detailInfoPanel) {
      el.detailInfoPanel.hidden = !inDetail;
      el.detailInfoPanel.classList.toggle("hidden", !inDetail);
    }
    if (el.detailTagPanel) {
      el.detailTagPanel.hidden = !inDetail;
      el.detailTagPanel.classList.toggle("hidden", !inDetail);
    }
    if (el.detailSimilarPanel) {
      el.detailSimilarPanel.hidden = !inDetail;
      el.detailSimilarPanel.classList.toggle("hidden", !inDetail);
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
    el.positionCount.textContent = isAuthenticated() ? String(getCoinsRemaining()) : "—";
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

    if (el.sortSelect) {
      el.sortSelect.value = activeSort;
    }
    if (el.positionsOnlyToggle) {
      el.positionsOnlyToggle.checked = showPositionsOnly;
    }

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

    const filteredBySearchAndCategory = MARKETS.filter(function (market) {
      const categoryMatch = activeCategory === "all" || market.category === activeCategory;
      const searchMatch =
        query.length === 0 ||
        market.question.toLowerCase().includes(query) ||
        market.category.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });

    const filtered = showPositionsOnly
      ? filteredBySearchAndCategory.filter(function (market) {
          return getPositionsForMarket(market.id).length > 0;
        })
      : filteredBySearchAndCategory;

    const sorted = sortMarketsForGrid(filtered);
    updateResultSummary(sorted.length, MARKETS.length, query);

    if (sorted.length === 0) {
      let emptyText = "No markets match your filters.";
      if (showPositionsOnly && filteredBySearchAndCategory.length > 0) {
        emptyText = "No active positions in the currently filtered markets.";
      } else if (query.length > 0) {
        emptyText = 'No markets found for "' + escapeHtml(query) + '".';
      }

      el.marketGrid.innerHTML = '<article class="empty-item"><p>' + emptyText + "</p></article>";
      return;
    }

    el.marketGrid.innerHTML = sorted
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
          '" role="button" tabindex="0" aria-label="Open market: ' +
          escapeHtml(market.question) +
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

  function sortMarketsForGrid(markets) {
    return markets
      .slice()
      .sort(function (a, b) {
        const scoreA = getMarketSortScore(a, activeSort);
        const scoreB = getMarketSortScore(b, activeSort);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return a.question.localeCompare(b.question);
      });
  }

  function getMarketSortScore(market, mode) {
    if (mode === "volume_desc") {
      return market.volume || 0;
    }

    if (mode === "activity_desc") {
      return state.activity.reduce(function (count, activityItem) {
        return count + (activityItem.marketId === market.id ? 1 : 0);
      }, 0);
    }

    if (mode === "confidence_desc") {
      return getMarketConfidenceShare(market);
    }

    if (mode === "confidence_asc") {
      return -getMarketConfidenceShare(market);
    }

    return getMarketContestedScore(market);
  }

  function getMarketConfidenceShare(market) {
    const snapshot = getMarketSnapshot(market);
    if (market.type === "binary") {
      return snapshot.optionShares.yes || 0;
    }
    return snapshot.ordered[0] ? snapshot.ordered[0].share : 0;
  }

  function getMarketContestedScore(market) {
    const snapshot = getMarketSnapshot(market);
    if (market.type === "binary") {
      const yes = snapshot.optionShares.yes || 0;
      const no = snapshot.optionShares.no || 0;
      return 100 - Math.abs(yes - no);
    }

    const top = snapshot.ordered[0] ? snapshot.ordered[0].share : 0;
    const second = snapshot.ordered[1] ? snapshot.ordered[1].share : 0;
    return 100 - Math.abs(top - second);
  }

  function updateResultSummary(shownCount, totalCount, query) {
    if (!el.resultSummary) return;
    const querySegment = query ? ' for "' + query + '"' : "";
    const positionSegment = showPositionsOnly ? " with your positions" : "";
    el.resultSummary.textContent =
      "Showing " +
      shownCount +
      " of " +
      totalCount +
      " markets" +
      querySegment +
      positionSegment +
      ".";
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
      el.detailVolume.textContent = formatVolume(market.volume) + " weekly volume";
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
    if (el.detailSignalCount) {
      el.detailSignalCount.textContent = formatVolume(market.volume) + " signals";
    }
    if (el.detailForecasterCount) {
      el.detailForecasterCount.textContent = compactNumber.format(getSyntheticParticipantCount(market)) + " participants";
    }

    renderDetailDistribution(market, snapshot);
    renderDetailFactors(market, snapshot);
    renderDetailSidebar(market, snapshot);
    renderDetailTrendPanel(market);
    renderDetailActivity(market);

    if (market.type === "binary") {
      renderBinaryDetailSections(market, snapshot);
      return;
    }

    renderMultiDetailSections(market, snapshot);
  }

  function renderDetailDistribution(market, snapshot) {
    const voterSnapshot = getMarketVoterSnapshot(market, snapshot);
    updateDetailEstimateBlock(market, snapshot, voterSnapshot);

    renderDistributionPanel({
      market: market,
      snapshot: snapshot,
      chartEl: el.detailDistributionChart,
      metaEl: el.detailDistributionMeta,
      legendEl: el.detailDistributionLegend,
      summaryEl: el.detailDistributionSummary,
      mode: "tokens",
    });

    renderDistributionPanel({
      market: market,
      snapshot: voterSnapshot,
      chartEl: el.detailVoterDistributionChart,
      metaEl: el.detailVoterDistributionMeta,
      legendEl: el.detailVoterDistributionLegend,
      summaryEl: el.detailVoterDistributionSummary,
      mode: "voters",
    });
  }

  function updateDetailEstimateBlock(market, tokenSnapshot, voterSnapshot) {
    if (!el.detailCurrentEstimate || !el.detailEstimateRange) return;

    if (market.type === "binary") {
      const yesToken = tokenSnapshot.optionShares.yes || 0;
      const noToken = tokenSnapshot.optionShares.no || 0;
      const leadId = yesToken >= noToken ? "yes" : "no";
      const leadShare = leadId === "yes" ? yesToken : noToken;
      const yesVoters = voterSnapshot.optionShares.yes || 0;
      const noVoters = voterSnapshot.optionShares.no || 0;

      el.detailCurrentEstimate.textContent = leadId.toUpperCase() + " " + leadShare + "%";
      el.detailEstimateRange.textContent =
        "Token split: YES " +
        yesToken +
        "% / NO " +
        noToken +
        "%. Voter split: YES " +
        yesVoters +
        "% / NO " +
        noVoters +
        "%.";
      return;
    }

    const tokenLead = tokenSnapshot.ordered[0];
    const voterLead = voterSnapshot.ordered[0];
    const tokenOption = tokenLead ? getOption(market.id, tokenLead.optionId) : null;
    const voterOption = voterLead ? getOption(market.id, voterLead.optionId) : null;

    el.detailCurrentEstimate.textContent = tokenOption ? tokenOption.letter + ". " + tokenLead.share + "%" : "Open ballot";
    el.detailEstimateRange.textContent =
      "Token lead: " +
      (tokenOption ? tokenOption.letter + ". " + tokenLead.share + "%" : "Open ballot") +
      ". Voter lead: " +
      (voterOption ? voterOption.letter + ". " + voterLead.share + "%" : "Open ballot") +
      ".";
  }

  function renderDistributionPanel(config) {
    if (!config || !config.chartEl || !config.metaEl || !config.legendEl || !config.summaryEl) {
      return;
    }

    const market = config.market;
    const snapshot = config.snapshot;
    const isTokenMode = config.mode === "tokens";

    config.metaEl.textContent = isTokenMode
      ? "Percentage of credence tokens cast on each answer among total tokens cast in this market."
      : "Percentage of voters for each answer among the total number of voters in this market.";

    config.legendEl.innerHTML = getOptionsInLetterOrderWithShares(market, snapshot)
      .map(function (item) {
        const option = getOption(market.id, item.optionId);
        if (!option) return "";
        return (
          '<span class="distribution-pill">' +
          escapeHtml(optionDisplayLabel(option, market.type === "binary")) +
          " " +
          item.share +
          "%</span>"
        );
      })
      .join("");

    config.summaryEl.textContent = isTokenMode
      ? "This view tracks conviction-weighted allocation: larger credence-token commitments move the split more."
      : "This view tracks support breadth across participants: each voter counts once regardless of token size.";

    renderAnswerShareDistributionChart(
      config.chartEl,
      market,
      snapshot,
      (isTokenMode ? "Token share" : "Voter share") + " across answers for " + market.question
    );
  }

  function renderAnswerShareDistributionChart(chartEl, market, snapshot, ariaLabel) {
    if (!chartEl) return;

    const width = 920;
    const height = 320;
    const ordered = getOptionsInLetterOrderWithShares(market, snapshot);
    const padding = {
      top: 28,
      right: 30,
      bottom: 36,
      left: market.type === "binary" ? 170 : 230,
    };
    const plotWidth = width - padding.left - padding.right;
    const rowGap = ordered.length > 4 ? 10 : 14;
    const availableHeight = height - padding.top - padding.bottom - rowGap * Math.max(0, ordered.length - 1);
    const rowHeight = clamp(availableHeight / Math.max(1, ordered.length), 28, 46);
    const axisY = padding.top + ordered.length * rowHeight + Math.max(0, ordered.length - 1) * rowGap + 18;

    const verticalGuides = [0, 25, 50, 75, 100]
      .map(function (value) {
        const x = padding.left + (value / 100) * plotWidth;
        return (
          '<line class="distribution-scale-line" x1="' +
          x.toFixed(2) +
          '" y1="' +
          padding.top +
          '" x2="' +
          x.toFixed(2) +
          '" y2="' +
          (axisY - 14).toFixed(2) +
          '"></line>' +
          '<text class="distribution-axis distribution-axis-x" x="' +
          x.toFixed(2) +
          '" y="' +
          axisY.toFixed(2) +
          '" text-anchor="' +
          (value === 0 ? "start" : value === 100 ? "end" : "middle") +
          '">' +
          value +
          "%</text>"
        );
      })
      .join("");

    const bars = ordered
      .map(function (item, index) {
        const option = getOption(market.id, item.optionId);
        if (!option) return "";

        const y = padding.top + index * (rowHeight + rowGap);
        const barWidth = Math.max(item.share === 0 ? 0 : 8, (item.share / 100) * plotWidth);
        const color = getOptionColor(index);
        const label = optionDisplayLabel(option, market.type === "binary");
        const valueX = padding.left + Math.min(barWidth + 14, plotWidth - 6);
        return (
          '<text class="distribution-axis distribution-axis-y" x="' +
          (padding.left - 14) +
          '" y="' +
          (y + rowHeight / 2 + 5).toFixed(2) +
          '" text-anchor="end">' +
          escapeHtml(label) +
          "</text>" +
          '<rect class="distribution-multi-track" x="' +
          padding.left +
          '" y="' +
          y.toFixed(2) +
          '" width="' +
          plotWidth.toFixed(2) +
          '" height="' +
          rowHeight.toFixed(2) +
          '" rx="10" ry="10"></rect>' +
          '<rect x="' +
          padding.left +
          '" y="' +
          y.toFixed(2) +
          '" width="' +
          barWidth.toFixed(2) +
          '" height="' +
          rowHeight.toFixed(2) +
          '" rx="10" ry="10" fill="' +
          color +
          '" opacity="0.9"></rect>' +
          '<text class="distribution-label distribution-label-end" x="' +
          valueX.toFixed(2) +
          '" y="' +
          (y + rowHeight / 2 + 6).toFixed(2) +
          '">' +
          item.share +
          "%</text>"
        );
      })
      .join("");

    chartEl.setAttribute("aria-label", ariaLabel);
    chartEl.innerHTML =
      '<rect class="distribution-bg" x="0" y="0" width="' +
      width +
      '" height="' +
      height +
      '" rx="16" ry="16"></rect>' +
      verticalGuides +
      bars;
  }

  function renderDetailFactors(market, snapshot) {
    if (!el.detailFactorsGrid) return;

    const factors = getMarketFactors(market, snapshot);
    el.detailFactorsGrid.innerHTML = factors
      .map(function (factor) {
        return (
          '<article class="factor-card factor-' +
          escapeHtml(factor.tone) +
          '">' +
          '<div class="factor-meter"><span></span></div>' +
          '<div class="factor-copy">' +
          '<p class="factor-kicker">' +
          escapeHtml(factor.kicker) +
          "</p>" +
          '<h4 class="factor-title">' +
          escapeHtml(factor.title) +
          "</h4>" +
          '<p class="factor-body">' +
          escapeHtml(factor.body) +
          "</p>" +
          '<p class="factor-meta">' +
          escapeHtml(factor.meta) +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderDetailSidebar(market, snapshot) {
    renderDetailInfo(market, snapshot);
    renderDetailTags(market);
    renderDetailSimilar(market);
  }

  function renderDetailInfo(market, snapshot) {
    if (!el.detailInfoList) return;

    const participantCount = getSyntheticParticipantCount(market);
    const voterSnapshot = getMarketVoterSnapshot(market, snapshot);
    const infoRows = [
      ["Category", market.category],
      ["Weekly volume", formatVolume(market.volume) + " credence tokens"],
      ["Participants", compactNumber.format(participantCount)],
      ["Market closes", "This Sunday"],
      [
        "Token split",
        market.type === "binary"
          ? "YES " + (snapshot.optionShares.yes || 0) + "% / NO " + (snapshot.optionShares.no || 0) + "%"
          : describeLeadingOptionsInLetterOrder(market, snapshot, 2),
      ],
      [
        "Voter split",
        market.type === "binary"
          ? "YES " + (voterSnapshot.optionShares.yes || 0) + "% / NO " + (voterSnapshot.optionShares.no || 0) + "%"
          : describeLeadingOptionsInLetterOrder(market, voterSnapshot, 2),
      ],
    ];

    el.detailInfoList.innerHTML = infoRows
      .map(function (row) {
        return (
          "<div>" +
          "<dt>" +
          escapeHtml(row[0]) +
          "</dt>" +
          "<dd>" +
          escapeHtml(row[1]) +
          "</dd>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderDetailTags(market) {
    if (!el.detailTagList) return;
    el.detailTagList.innerHTML = getMarketTags(market)
      .map(function (tag) {
        return '<span class="detail-tag">' + escapeHtml(tag) + "</span>";
      })
      .join("");
  }

  function renderDetailSimilar(market) {
    if (!el.detailSimilarList) return;

    const similar = getSimilarMarkets(market).slice(0, 4);
    el.detailSimilarList.innerHTML = similar
      .map(function (candidate) {
        const snapshot = getMarketSnapshot(candidate);
        const estimate =
          candidate.type === "binary"
            ? "YES " + (snapshot.optionShares.yes || 0) + "%"
            : describeTopOptions(candidate, snapshot, 1);
        return (
          '<a class="detail-similar-card" href="moral-market.html?market=' +
          encodeURIComponent(candidate.id) +
          '">' +
          '<span class="detail-similar-question">' +
          escapeHtml(candidate.question) +
          "</span>" +
          '<span class="detail-similar-meta">' +
          escapeHtml(estimate + " • " + candidate.category) +
          "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function getMarketFactors(market, snapshot) {
    if (market.type === "binary") {
      const yesShare = snapshot.optionShares.yes || 0;
      const noShare = snapshot.optionShares.no || 0;
      return [
        {
          tone: "higher",
          kicker: "Pushes TRUE higher",
          title: yesShare >= noShare ? "Current lead case" : "Primary upside case",
          body: truncateCopy(extractLeadSentence(market.yesCase || "")),
          meta: "Current YES support: " + yesShare + "%",
        },
        {
          tone: "lower",
          kicker: "Pushes TRUE lower",
          title: noShare > yesShare ? "Current lead case" : "Primary downside case",
          body: truncateCopy(extractLeadSentence(market.noCase || "")),
          meta: "Current NO support: " + noShare + "%",
        },
        {
          tone: "sensitive",
          kicker: "Most decision-relevant uncertainty",
          title: "What would move this market fastest",
          body: truncateCopy(deriveSensitivityText(market)),
          meta: "Category: " + market.category,
        },
      ];
    }

    const topRanked = snapshot.ordered.slice(0, 3);
    const rankByOptionId = new Map(
      topRanked.map(function (item, index) {
        return [item.optionId, index];
      })
    );

    return getLeadingOptionsInLetterOrder(market, snapshot, 3).map(function (item) {
      const option = getOption(market.id, item.optionId);
      const theory = option ? option.theory : "Competing theory explanation.";
      const rank = rankByOptionId.has(item.optionId) ? rankByOptionId.get(item.optionId) : 2;
      return {
        tone: rank === 0 ? "higher" : rank === 1 ? "sensitive" : "lower",
        kicker: "Option " + (option ? option.letter : String(rank + 1)),
        title: option ? option.label : "Open ballot option",
        body: truncateCopy(extractLeadSentence(theory)),
        meta: item.share + "% of current credence",
      };
    });
  }

  function getMarketTags(market) {
    const tags = [market.category, market.type === "binary" ? "Binary ballot" : "Open ballot"];
    const keywordMap = [
      ["autonomy", "Autonomy"],
      ["rights", "Rights"],
      ["harm", "Harm"],
      ["welfare", "Welfare"],
      ["suffering", "Suffering"],
      ["justice", "Justice"],
      ["dignity", "Dignity"],
      ["agency", "Agency"],
      ["public safety", "Public safety"],
      ["law", "Law"],
    ];
    const haystack = (market.context + " " + (market.yesCase || "") + " " + (market.noCase || "")).toLowerCase();
    keywordMap.forEach(function (entry) {
      if (haystack.includes(entry[0].toLowerCase()) && tags.indexOf(entry[1]) === -1) {
        tags.push(entry[1]);
      }
    });
    return tags.slice(0, 6);
  }

  function getSimilarMarkets(market) {
    return MARKETS.filter(function (candidate) {
      return candidate.id !== market.id;
    }).sort(function (a, b) {
      return getMarketSimilarityScore(market, b) - getMarketSimilarityScore(market, a);
    });
  }

  function getMarketSimilarityScore(source, candidate) {
    let score = 0;
    if (source.category === candidate.category) score += 4;
    if (source.type === candidate.type) score += 2;
    const sourceConfidence = getMarketConfidenceShare(source);
    const candidateConfidence = getMarketConfidenceShare(candidate);
    score += Math.max(0, 2 - Math.abs(sourceConfidence - candidateConfidence) / 25);
    return score;
  }

  function getSyntheticParticipantCount(market) {
    const activityCount = state.activity.reduce(function (count, activityItem) {
      return count + (activityItem.marketId === market.id ? 1 : 0);
    }, 0);
    return Math.max(180, Math.round(market.volume / 8 + activityCount * 6));
  }

  function deriveSensitivityText(market) {
    if (market.type === "multi") {
      return "The market moves most when one explanatory theory accounts for the strongest cases without generating new counterexamples.";
    }

    const context = String(market.context || "");
    if (context) {
      return context;
    }

    return "The estimate is most sensitive to which empirical and normative premise people treat as decision-relevant, rather than to rhetorical framing alone.";
  }

  function truncateCopy(text) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= 170) return normalized;
    return normalized.slice(0, 167).trimEnd() + "...";
  }

  function extractLeadSentence(text) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    const match = normalized.match(/[^.!?]+[.!?]?/);
    return match ? match[0].trim() : normalized;
  }

  function buildBinaryDistribution(market, snapshot) {
    const mean = clamp((snapshot.optionShares.yes || 0) / 100, 0.03, 0.97);
    const confidenceGap = Math.abs((snapshot.optionShares.yes || 0) - 50);
    const concentration = clamp(7 + market.volume / 3200 + confidenceGap / 5, 6, 22);
    const alpha = Math.max(1.2, mean * concentration);
    const beta = Math.max(1.2, (1 - mean) * concentration);
    const points = [];
    let maxY = 0;

    for (let i = 0; i <= 80; i += 1) {
      const x = 0.01 + (i / 80) * 0.98;
      const y = betaPdf(x, alpha, beta);
      if (y > maxY) maxY = y;
      points.push({ x: x, y: y });
    }

    const q10 = betaQuantile(alpha, beta, 0.1);
    const q50 = betaQuantile(alpha, beta, 0.5);
    const q90 = betaQuantile(alpha, beta, 0.9);
    const meanDensity = betaPdf(mean, alpha, beta);

    return {
      question: market.question,
      mean: mean,
      q10: q10,
      q50: q50,
      q90: q90,
      meanDensity: meanDensity,
      maxY: maxY,
      points: points,
    };
  }

  function betaPdf(x, alpha, beta) {
    const safeX = clamp(x, 0.0001, 0.9999);
    return Math.exp(
      (alpha - 1) * Math.log(safeX) +
      (beta - 1) * Math.log(1 - safeX) -
      logBeta(alpha, beta)
    );
  }

  function betaQuantile(alpha, beta, target) {
    const steps = 360;
    const normalizedTarget = clamp(target, 0, 1);
    const checkpoints = [];
    let totalArea = 0;
    let lastX = 0.01;
    let lastY = betaPdf(lastX, alpha, beta);

    for (let i = 1; i <= steps; i += 1) {
      const x = 0.01 + (i / steps) * 0.98;
      const y = betaPdf(x, alpha, beta);
      totalArea += ((lastY + y) / 2) * (x - lastX);
      checkpoints.push({ x: x, cumulative: totalArea });
      lastX = x;
      lastY = y;
    }

    const targetArea = totalArea * normalizedTarget;
    for (let i = 0; i < checkpoints.length; i += 1) {
      if (checkpoints[i].cumulative >= targetArea) {
        return checkpoints[i].x;
      }
    }

    return 0.99;
  }

  function logBeta(alpha, beta) {
    return logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  }

  function logGamma(value) {
    const coefficients = [
      76.18009172947146,
      -86.50532032941677,
      24.01409824083091,
      -1.231739572450155,
      0.001208650973866179,
      -0.000005395239384953,
    ];
    let x = value;
    let y = value;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let series = 1.000000000190015;

    coefficients.forEach(function (coefficient) {
      y += 1;
      series += coefficient / y;
    });

    return Math.log(2.5066282746310005 * series / x) - tmp;
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
      const topSummary = describeLeadingOptionsInLetterOrder(market, snapshot, 4);
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
    const top = getLeadingOptionsInLetterOrder(market, snapshot, 3);

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
    const ticketHeading = el.ticketPanel ? el.ticketPanel.querySelector("h2") : null;
    const signedIn = isAuthenticated();

    if (!market) {
      el.ticketPrompt.style.display = "";
      el.ticketContent.classList.add("hidden");
      el.ticketPanel.classList.remove("side-no");
      el.ticketPanel.classList.remove("side-yes");
      if (ticketHeading) {
        ticketHeading.textContent = "Normativity Ticket";
      }
      return;
    }

    const snapshot = getMarketSnapshot(market);
    const weekStart = new Date(state.weekStart);
    const weekEnd = new Date(state.weekEnd);

    el.ticketPrompt.style.display = "none";
    el.ticketContent.classList.remove("hidden");
    if (ticketHeading) {
      ticketHeading.textContent = isDetailRoute ? "Cast Credence" : "Normativity Ticket";
    }
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
    el.clearBtn.hidden = !signedIn || !hasAllocation;
    el.castBtn.hidden = !signedIn;

    el.remainingLine.textContent = signedIn
      ? "Credence tokens remaining this week: " + getCoinsRemaining() + " / " + WEEKLY_COINS + "."
      : "Browsing mode: sign in or sign up to cast credence tokens and save positions.";

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

    return "Current board split (top choices): " + describeLeadingOptionsInLetterOrder(market, snapshot, 4);
  }

  function renderTicketControls(market, snapshot) {
    if (!isAuthenticated()) {
      renderGuestTicketControls();
      return;
    }

    if (market.type === "binary") {
      renderBinaryTicketControls(market);
      return;
    }

    renderMultiTicketControls(market, snapshot);
  }

  function renderGuestTicketControls() {
    el.ticketControls.innerHTML =
      '<div class="market-auth-gate">' +
      '<p class="market-auth-copy">Sign in or sign up to cast credence tokens, track your positions, and carry your weekly budget across markets.</p>' +
      '<div class="market-auth-actions">' +
      '<a class="btn btn-primary market-auth-link" href="' +
      escapeHtml(getAuthRedirectUrl("signin")) +
      '">Sign in</a>' +
      '<a class="btn btn-ghost market-auth-link" href="' +
      escapeHtml(getAuthRedirectUrl("signup")) +
      '">Sign up</a>' +
      "</div>" +
      "</div>";
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
      });

    if (market.type === "binary") {
      latest.sort(function (a, b) {
        return b.share - a.share;
      });
    }

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
    if (!isAuthenticated()) {
      el.ticketPreview.textContent = "Browse the market freely. Authentication is required before you can cast credence tokens.";
      return;
    }

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
    if (!isAuthenticated()) {
      el.ticketPreview.textContent = "Browse the market freely. Authentication is required before you can cast credence tokens.";
      return;
    }

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
    if (!isAuthenticated()) {
      el.ticketStatus.textContent = "Sign in or sign up to cast credence tokens.";
      redirectToAuth("signin");
      return;
    }

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
    if (!isAuthenticated()) {
      el.ticketStatus.textContent = "Sign in or sign up to manage market allocations.";
      redirectToAuth("signin");
      return;
    }

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
    if (!isAuthenticated()) {
      el.positionsList.innerHTML =
        '<li class="empty-item"><p>Sign in or sign up to track your positions and remaining credence tokens.</p></li>';
      return;
    }

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

  // Voter share is flatter than token share because each participant counts once,
  // while token allocation amplifies higher-conviction positions.
  function getMarketVoterSnapshot(market, tokenSnapshot) {
    const rawSupport = Object.create(null);
    const exponent = market.type === "binary" ? 0.68 : 0.74;

    market.options.forEach(function (option) {
      const tokenShare = Math.max(0.001, (tokenSnapshot.optionShares[option.id] || 0) / 100);
      rawSupport[option.id] = Math.pow(tokenShare, exponent);
    });

    const totalRaw = market.options.reduce(function (sum, option) {
      return sum + (rawSupport[option.id] || 0);
    }, 0);

    const shares = roundSharesToHundred(market.options, rawSupport, totalRaw);
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

  function describeLeadingOptionsInLetterOrder(market, snapshot, count) {
    return getLeadingOptionsInLetterOrder(market, snapshot, count)
      .map(function (item) {
        const option = getOption(market.id, item.optionId);
        if (!option) return "";
        return optionDisplayLabel(option, market.type === "binary") + " " + item.share + "%";
      })
      .filter(Boolean)
      .join(" | ");
  }

  function getLeadingOptionsInLetterOrder(market, snapshot, count) {
    return snapshot.ordered
      .slice(0, count)
      .slice()
      .sort(function (a, b) {
        return getOptionOrderIndex(market, a.optionId) - getOptionOrderIndex(market, b.optionId);
      });
  }

  function getOptionsInLetterOrderWithShares(market, snapshot) {
    return market.options.map(function (option) {
      return {
        optionId: option.id,
        share: snapshot.optionShares[option.id] || 0,
      };
    });
  }

  function getOptionOrderIndex(market, optionId) {
    for (let i = 0; i < market.options.length; i += 1) {
      if (market.options[i].id === optionId) return i;
    }
    return Number.MAX_SAFE_INTEGER;
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

  function formatPercent(value) {
    return Math.round(Number(value) || 0) + "%";
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
      if (!isAuthenticated()) {
        return defaultState(week);
      }

      const stored = readStoredStateRaw();
      if (!stored || !stored.raw) return defaultState(week);
      if (stored.key !== STORAGE_KEY) {
        localStorage.setItem(STORAGE_KEY, stored.raw);
      }

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
