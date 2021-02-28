// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";
import tippy from "tippy.js";
import * as d3 from "d3";
import * as c3 from "c3";

// Goodbye momentJS welcome dayJS
// import moment from "moment";
var dayjs = require("dayjs");
require("dayjs/locale/ml");
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
var customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

// Localization deps
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import locI18next from "loc-i18next";
import languageResources, { LANGUAGES } from "./i18n";

import drawTestingTrendChart from "./components/TestingTrendChart";
import drawDailyIncreaseChart from "./components/DailyIncreaseChart";

// import drawHotspotMap from "./components/HotspotMap";
// import drawObservationTable from "./components/ObservationTable";
// import drawPrefectureTable from "./components/DistrictTable";
// import drawAgeTrendChart from "./components/AgeTrendChart";

import drawTrendChart from "./components/OutbreakSpreadChart";
import drawimportedAndContachCasesChart from "./components/ImportedContactChart";
import drawTestPositivityChart from "./components/TestPositivityChart";

// Keep reference to current chart in order to clean up when redrawing.
let testingTrendChart = null;
let testPositivityChart = null;
let dailyIncreaseChart = null;
let hotspotMap = null;

// mapboxgl.accessToken = ("pk.eyJ1IjoiamVldmFudGhhbmFsIiwiYSI6ImNrOGI3Y2UwZzA5ZTIzZm8zaHBoc3k5bmYifQ.u_IlM2qUJmPReoqA54Qqhw");
const PREFECTURE_JSON_PATH = "static/districts.geojson";
const JSON_PATH = "https://data.covid19kerala.info/summary/latest.json";
const KPI_JSON_PATH = "https://data.covid19kerala.info/kpi/latest.json";
const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "YYYY-MM-DD h:mm:ssA";
const COLOR_TESTED = "rgb(164,173,192)";
const COLOR_TESTED_DAILY = "rgb(209,214,223)";
const COLOR_INCREASE = "rgb(163,172,191)";

const PAGE_TITLE = "COVID-19 Kerala Tracker";
export const SUPPORTED_LANGS = LANGUAGES;
let LANG = "en";

export const LANG_CONFIG = {
  fallbackLng: "en",
  lowerCaseLng: true,
  detection: {
    order: ["querystring", "cookie", "navigator"],
    caches: ["cookie"],
    cookieMinutes: 60 * 24 * 365,
    // optional set cookie options, reference:[MDN Set-Cookie docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
    cookieOptions: { path: "/", sameSite: "strict" },
  },
  resources: languageResources,
};

// Global vars
let ddb = {
  isSiteUpdating: false,
  prefectures: undefined,
  trend: undefined,
  totals: {
    confirmed: 0,
    recovered: 0,
    deceased: 0,
    tested: 0,
    critical: 0,
  },
  totalsDiff: {
    confirmed: 0,
    recovered: 0,
    deceased: 0,
    tested: 0,
    critical: 0,
  },
};
let map = undefined;
let tippyInstances;

// IE11 forEach Polyfill
if ("NodeList" in window && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Returns true if this is a network error
function isNetworkError(err) {
  if (err && err.name && err.name == "TypeError") {
    if (err.toString() == "TypeError: Failed to fetch") {
      return true;
    }
  }
  return false;
}

// Fetches data from the JSON_PATH but applies an exponential
// backoff if there is an error.
function loadData(callback) {
  let delay = 2 * 1000; // 2 seconds

  const tryFetch = function (retryFn) {
    // Load the json data file
    fetch(JSON_PATH)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        callback(data);
      })
      .catch(function (err) {
        retryFn(delay, err);
        delay *= 2; // exponential backoff.

        // throwing the error again so it is logged in sentry/debuggable.
        if (!isNetworkError(err)) {
          throw err;
        }
      });
  };

  const retryFetchWithDelay = function (delay, err) {
    console.log(err + ": retrying after " + delay + "ms.");
    setTimeout(function () {
      tryFetch(retryFetchWithDelay);
    }, delay);
  };

  tryFetch(retryFetchWithDelay);
}

function calculateTotals(daily) {
  // Calculate the totals
  let totals = {
    confirmed: 0,
    recovered: 0,
    deceased: 0,
    critical: 0,
    tested: 0,
    observation: 0,
    homeObservation: 0,
    hosptilised: 0,
    active: 0,
  };
  let totalsDiff = {
    confirmed: 1,
    recovered: 1,
    deceased: 1,
    critical: 1,
    tested: 1,
    observation: 0,
    homeObservation: 0,
    hosptilised: 0,
    active: 0,
  };

  // If there is an empty cell, fall back to the previous row
  function pullLatestSumAndDiff(rowKey, totalKey) {
    let latest = {};
    let dayBefore = {};
    let twoDaysBefore = {};
    if (daily.length > 2) {
      twoDaysBefore = daily[daily.length - 3];
    }
    if (daily.length > 1) {
      dayBefore = daily[daily.length - 2];
    }
    if (daily.length > 0) {
      latest = daily[daily.length - 1];
    }

    if (latest && dayBefore && latest[rowKey] && dayBefore[rowKey]) {
      totals[totalKey] = latest[rowKey];
      totalsDiff[totalKey] = latest[rowKey] - dayBefore[rowKey];
    }

    /*
      if latest day's status is not Finalised yet and the difference in current key is <=0,
      Compare with data of two days before. This prevents showing 0 diffs
      in case of data in spreadsheet is not updated with current day yet
    */
    if (
      latest.status !== "Finalised" &&
      totalsDiff[totalKey] <= 0 &&
      twoDaysBefore &&
      twoDaysBefore[rowKey]
    ) {
      totalsDiff[totalKey] = latest[rowKey] - twoDaysBefore[rowKey];
    }

    if (rowKey == "deceasedCumulative" && totals[totalKey] == 1) {
      totals[totalKey] = 2;
    }
  }

  pullLatestSumAndDiff("testedCumulative", "tested");
  pullLatestSumAndDiff("criticalCumulative", "critical");
  pullLatestSumAndDiff("confirmedCumulative", "confirmed");
  pullLatestSumAndDiff("recoveredCumulative", "recovered");
  pullLatestSumAndDiff("deceasedCumulative", "deceased");
  pullLatestSumAndDiff("observationCumulative", "observation");
  pullLatestSumAndDiff("homeObservationCumulative", "homeObservation");
  pullLatestSumAndDiff("hosptilisedCumulative", "hosptilised");
  pullLatestSumAndDiff("activeCumulative", "active");

  return [totals, totalsDiff];
}

function drawMap() {
  // Initialize Map

  map = new mapboxgl.Map({
    container: "map-container",
    style: "mapbox://styles/mapbox/light-v10",
    zoom: 6.5,
    minZoom: 6.5,
    maxZoom: 6.5,
    center: {
      lng: 76.2926027,
      lat: 10.6321557,
    },
    interactive: false,
    zoomControl: false,
    /* maxBounds: [
      {lat: 14.118318014416644, lng: 74.01240618330542}, // SW
      {lat: 14.34721256263214, lng: 78.3273570446982} // NE
    ], */
  });

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.scrollZoom.disable();
  map.addControl(
    new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: false,
      zoomControl: false,
    })
  );

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });

  map.on("mousemove", function (e) {
    const feature = map.queryRenderedFeatures(e.point, {
      layers: ["prefecture-layer"],
    })[0];
    if (feature) {
      const thisDistrict = ddb.prefectures.filter((p) => {
        return p.name === feature.properties.district;
      });
      const active = parseInt(
        (thisDistrict[0].active =
          thisDistrict[0].confirmed -
          ((thisDistrict[0].recovered || 0) + (thisDistrict[0].deaths || 0)))
      );
      const confirmed = thisDistrict[0].confirmed;
      const deaths = thisDistrict[0].deaths;
      const recovered = thisDistrict[0].recovered;
      const html = `<h3>${i18next.t(
        feature.properties.district
      )}</h3><strong>${i18next.t(
        "Active"
      )}: ${active}</strong><br />${i18next.t(
        "Confirmed"
      )}: ${confirmed}<br /> ${i18next.t(
        "Deceased"
      )}: ${deaths}<br />${i18next.t("Recovered")}: ${recovered}`;
      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    } else {
      popup.remove();
    }
  });
}

function drawPrefectureTrajectoryChart(prefectures) {
  const minimumConfirmed = 10;
  const filteredPrefectures = _.filter(prefectures, function (prefecture) {
    return prefecture.confirmed >= minimumConfirmed;
  });
  const trajectories = _.map(filteredPrefectures, function (prefecture) {
    const cumulativeConfirmed = _.reduce(
      prefecture.dailyConfirmedCount,
      function (result, value) {
        if (result.length > 0) {
          const sum = result[result.length - 1] + value;
          result.push(sum);
          return result;
        } else {
          return [value];
        }
      },
      []
    );
    const cumulativeConfirmedFromMinimum = _.filter(
      cumulativeConfirmed,
      function (value) {
        return value >= minimumConfirmed;
      }
    );
    return {
      name: prefecture.name,
      name_ja: prefecture.name_ja,
      confirmed: prefecture.confirmed,
      cumulativeConfirmed: cumulativeConfirmedFromMinimum,
    };
  });

  const columns = _.map(trajectories, function (prefecture) {
    return [prefecture.name].concat(prefecture.cumulativeConfirmed);
  });

  const labelPosition = _.reduce(
    trajectories,
    function (result, value) {
      // Show on second to last point to avoid cutoff
      result[value.name] = value.cumulativeConfirmed.length - 1;
      return result;
    },
    {}
  );

  const maxDays = _.reduce(
    _.values(labelPosition),
    function (a, b) {
      return Math.max(a, b);
    },
    0
  );

  const nameMap = _.reduce(
    trajectories,
    function (result, value) {
      if (LANG === "en") {
        result[value.name] = value.name;
      } else {
        result[value.name] = value.name_ja;
      }
      return result;
    },
    {}
  );

  c3.generate({
    bindto: "#prefecture-trajectory",
    axis: {
      y: {
        min: minimumConfirmed,
        padding: {
          bottom: 0,
        },
      },
      x: {
        // Set max x value to be 1 greater to avoid label cutoff
        max: maxDays + 1,
        label: `Number of Days since ${minimumConfirmed}th case`,
      },
    },
    data: {
      columns: columns,
      labels: {
        format: function (v, id, i) {
          if (id) {
            if (i === labelPosition[id]) {
              return id;
            }
          }
        },
      },
      names: nameMap,
    },
    point: {
      r: 0,
    },
    grid: {
      x: {
        show: true,
      },
      y: {
        show: true,
      },
    },
    padding: {
      right: 24,
    },
  });
}

function drawTravelRestrictions() {}

function travelRestrictionsHelper(elementId, countries) {
  let countryList = [];
  // Iterate through and render country links
  _.orderBy(countries, "name", "desc").map(function (country) {
    let name = i18next.t(`countries.${country.name}`);
    countryList.unshift(
      `<a href="${country.link}">${country.emoji}${name}</a>`
    );
    return true;
  });

  let banned = document.querySelector(elementId);
  if (banned) {
    banned.innerHTML = countryList.join(", ");
  }
}

function drawKpis(totals, totalsDiff) {
  // Draw the KPI values
  function setKpi(key, value) {
    document.querySelector(
      "#kpi-" + key + " .value"
    ).innerHTML = new Intl.NumberFormat("en-IN", {
      maximumSignificantDigits: 3,
    }).format(value);
  }
  function setKpiDiff(key, value) {
    let diffDir = value >= 0 ? "+" : "";
    document.querySelector("#kpi-" + key + " .diff").innerHTML =
      "( " + diffDir + value + " )";
  }

  setKpi("confirmed", totals.confirmed);
  setKpiDiff("confirmed", totalsDiff.confirmed);
  setKpi("recovered", totals.recovered);
  setKpiDiff("recovered", totalsDiff.recovered);
  setKpi("deceased", totals.deceased);
  setKpiDiff("deceased", totalsDiff.deceased);
  setKpi("critical", totals.critical);
  setKpiDiff("critical", totalsDiff.critical);
  // setKpi("hosptilised", totals.hosptilised);
  // setKpiDiff("hosptilised", totalsDiff.hosptilised);
  setKpi("tested", totals.tested);
  setKpiDiff("tested", totalsDiff.tested);
  setKpi("active", totals.active);
  setKpiDiff("active", totalsDiff.active);
}

/**
 * @param {string} lastUpdated - MMM DD YYYY, HH:mm JST (e.g. Mar 29 2020, 15:53 JST)
 */
function drawLastUpdated(lastUpdated) {
  // Draw the last updated time

  const display = document.getElementById("last-updated");
  if (!display) {
    return;
  }

  // TODO we should be parsing the datlastUpdatede, but I
  // don't trust the user input on the sheet
  // console.log(lastUpdated.slice(0, -4))
  const lastUpdatedMoment = dayjs(
    lastUpdated, //lastUpdated.slice(0, -4)
    "YYYY-MM-DD HH:mm"
  ).utcOffset(330, true); // IST offset
  if (!lastUpdatedMoment.isValid()) {
    // Fall back to raw value on failed parse
    display.textContent = lastUpdated;
    return;
  }
  const relativeTime = {
    en: lastUpdatedMoment.clone().locale("en").fromNow(),
    ml: lastUpdatedMoment.clone().locale("ml").fromNow(),
  };

  const absoluteTime = lastUpdatedMoment.clone().format(TIME_FORMAT);

  display.textContent = relativeTime[LANG];
  display.setAttribute("title", lastUpdated);
  i18next.addResource(
    "en",
    "translation",
    "last-updated-time",
    relativeTime["en"]
  );
  i18next.addResource(
    "ml",
    "translation",
    "last-updated-time",
    relativeTime["ml"]
  );
  display.setAttribute("data-i18n", "last-updated-time");

  document.getElementsByClassName("last-updated").forEach((lastUpdatedP) => {
    lastUpdatedP.innerHTML = `${i18next.t("last-updated")} ${absoluteTime}`;
  });
}

function drawPageTitleCount(confirmed) {
  // Update the number of confirmed cases in the title

  document.title = "(" + confirmed + ") " + PAGE_TITLE;
}

/**
 * drawMapPrefectures
 * @param {*} pageDraws - number of redraws to screen
 */
function drawMapPrefectures(pageDraws) {
  // Find the index of the first symbol layer
  // in the map style so we can draw the
  // prefecture colors behind it

  var firstSymbolId;
  var layers = map.getStyle().layers;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === "symbol") {
      firstSymbolId = layers[i].id;
      break;
    }
  }

  // Start the Mapbox search expression
  let prefecturePaint = ["match", ["get", "district"]];

  // Generate an array of prefectures cases
  var prefecturesActives = [];

  // pushing values of prefecture cases to the cases array
  ddb.prefectures.map(function (prefecture) {
    let cases = parseInt(
      (prefecture.active =
        prefecture.confirmed -
        ((prefecture.recovered || 0) + (prefecture.deceased || 0)))
    );
    prefecturesActives.push(cases);
  });

  // Map a given value to scale
  const scale = (value, inMin, inMax, outMin, outMax) => {
    return Math.floor(
      ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    );
  };

  // Go through all prefectures looking for cases
  ddb.prefectures.map(function (prefecture) {
    let cases = parseInt(
      (prefecture.active =
        prefecture.confirmed -
        ((prefecture.recovered || 0) + (prefecture.deceased || 0)))
    );

    let maxCases = Math.max(...prefecturesActives);
    let minCases = Math.min(...prefecturesActives);

    let caseScale = scale(cases, minCases, maxCases, 1, 9);

    if (cases > 0) {
      prefecturePaint.push(prefecture.name);

      //Bestpractice 7-class OrRd scale, kept for futur references
      var colorScaleSeven = [
        "rgb(0,0,0)",
        "rgb(254,240,217)",
        "rgb(253,212,158)",
        "rgb(253,187,132)",
        "rgb(252,141,89)",
        "rgb(239,101,72)",
        "rgb(215,48,31)",
        "rgb(153,0,0)",
      ];

      //9-class OrRd for distinguish districts on Kerala map, not the best cartographic choice
      var colorScaleNine = [
        "rgb(0,0,0)",
        "rgb(255,247,236)",
        "rgb(254,232,200)",
        "rgb(253,212,158)",
        "rgb(253,187,132)",
        "rgb(252,141,89)",
        "rgb(239,101,72)",
        "rgb(215,48,31)",
        "rgb(179,0,0)",
        "rgb(127,0,0)",
      ];

      prefecturePaint.push(colorScaleNine[caseScale]);
    }
  });

  // Add a final value to the list for the default color
  prefecturePaint.push("rgba(0,0,0,0)");

  if (pageDraws === 0) {
    // If it is the first time drawing the map

    map.addSource("prefectures", {
      type: "geojson",
      data: PREFECTURE_JSON_PATH,
    });

    // Add the prefecture color layer to the map
    map.addLayer(
      {
        id: "prefecture-layer",
        type: "fill",
        source: "prefectures",
        layout: {},
        paint: {
          "fill-color": prefecturePaint,
          "fill-opacity": 0.8,
        },
      },
      firstSymbolId
    );

    // Add another layer with type "line"
    // to provide a styled prefecture border
    let prefBorderLayer = map.addLayer(
      {
        id: "prefecture-outline-layer",
        type: "line",
        source: "prefectures",
        layout: {},
        paint: {
          "line-width": 0.5,
          "line-color": "#c0c0c0",
          "line-opacity": 0.5,
        },
      },
      firstSymbolId
    );
  } else {
    // Update prefecture paint properties

    map.setPaintProperty("prefecture-layer", "fill-color", prefecturePaint);
  }
}

// localize must be accessible globally
const localize = locI18next.init(i18next);
function initDataTranslate() {
  // load translation framework
  i18next
    .use(LanguageDetector)
    .init(LANG_CONFIG)
    .then(() => {
      setLang(i18next.language);
    });

  // Language selector event handler
  if (document.querySelectorAll("[data-lang-picker]")) {
    document.querySelectorAll("[data-lang-picker]").forEach(function (pick) {
      pick.addEventListener("click", function (e) {
        e.preventDefault();
        setLang(e.target.dataset.langPicker);
      });
    });
  }
}

function setLang(lng) {
  // Clip to first two letters of the language.
  if (lng && lng.length > 1) {
    let proposedLng = lng.slice(0, 2);
    // Don't set the lang if it's not the supported languages.
    if (SUPPORTED_LANGS.indexOf(proposedLng) != -1) {
      LANG = proposedLng;
    }
  }

  // toggle picker
  toggleLangPicker();

  // set i18n framework lang
  i18next.changeLanguage(LANG).then(() => {
    localize("html");
    // Update the map
    if (map && map.getStyle()) {
      map.getStyle().layers.forEach(function (thisLayer) {
        if (thisLayer.type == "symbol") {
          map.setLayoutProperty(thisLayer.id, "text-field", [
            "get",
            // "name_" + LANG,
            "name_en",
          ]);
        }
      });
    }

    // Set HTML language tag
    document.documentElement.setAttribute("lang", LANG);

    // Redraw all components that need rerendering to be localized the prefectures table
    if (!document.body.classList.contains("embed-mode")) {
      /*       if (document.getElementById("prefectures-table")) {
        drawPrefectureTable(ddb.prefectures, ddb.totals, LANG);
      }
       */
      /* if (document.getElementById("observation-table")) {
        drawObservationTable(ddb.underObservationData);
      }
 */
      // drawTrendChart(ddb.trend, LANG);
      // hotspotMap = drawHotspotMap(ddb.prefectures, LANG);

      // drawPrefectureTrajectoryChart(ddb.prefectures);

      // drawAgeTrendChart(ddb.age);

      dailyIncreaseChart = drawDailyIncreaseChart(
        ddb.trend,
        dailyIncreaseChart,
        LANG
      );

      drawimportedAndContachCasesChart(ddb.trend);

      testPositivityChart = drawTestPositivityChart(
        ddb.trend,
        testPositivityChart
      );

      drawLastUpdated(ddb.lastUpdated);
    }
    updateTooltipLang();
  });
}

function drawSiteUpdating(isUpdating) {
  if (isUpdating) {
    document.getElementById("data-update-warning-container").style.visibility =
      "visible";
  }
}

function updateTooltipLang() {
  // Destroy current tooltips
  if (Array.isArray(tippyInstances)) {
    tippyInstances.forEach((instance) => instance.destroy());
  }

  // Set tooltip content to current language
  document.querySelectorAll(`[data-tippy-i18n]`).forEach((node) => {
    const i18nKey = node.getAttribute("data-tippy-i18n");
    const dataTippyContent = i18next.t(i18nKey);
    node.setAttribute("data-tippy-content", dataTippyContent);
  });

  // Activate tooltips
  tippyInstances = tippy("[data-tippy-content]");
}

function toggleLangPicker() {
  // Toggle the lang picker
  if (document.querySelectorAll("a[data-lang-picker]")) {
    document.querySelectorAll("a[data-lang-picker]").forEach(function (el) {
      el.style.display = "inline";
    });
    let currentLangPicker = document.querySelector(
      "a[data-lang-picker=" + LANG + "]"
    );
    if (currentLangPicker) {
      currentLangPicker.style.display = "none";
    }
  }
}
function checkIsSiteUpdating(dailyStats) {
  let latestDayStats = dailyStats[dailyStats.length - 1];
  return latestDayStats.status && latestDayStats.status == "Reviewing"
    ? true
    : false;
}

function loadDataOnPage() {
  loadData(function (data) {
    jsonData = data;

    ddb.prefectures = jsonData.prefectures;
    let newTotals = calculateTotals(jsonData.daily);
    ddb.totals = newTotals[0];
    ddb.totalsDiff = newTotals[1];
    ddb.trend = jsonData.daily;
    ddb.lastUpdated = jsonData.updated;

    ddb.age = jsonData.age;
    ddb.gender = jsonData.gender;

    ddb.isSiteUpdating = checkIsSiteUpdating(jsonData.daily);

    ddb.underObservationData = jsonData.underObservation;

    //drawKpis(ddb.totals, ddb.totalsDiff);
    if (!document.body.classList.contains("embed-mode")) {
      drawSiteUpdating(ddb.isSiteUpdating);
      drawLastUpdated(ddb.lastUpdated);
      drawPageTitleCount(ddb.totals.confirmed);
      // drawPrefectureTable(ddb.prefectures, ddb.totals, LANG);
      // drawObservationTable(ddb.underObservationData);
      drawTrendChart(ddb.trend, LANG);
      drawDailyIncreaseChart(ddb.trend);
      // drawPrefectureTrajectoryChart(ddb.prefectures);
      // drawAgeTrendChart(ddb.age);
      testingTrendChart = drawTestingTrendChart(ddb.trend, testingTrendChart);
      testPositivityChart = drawTestPositivityChart(
        ddb.trend,
        testPositivityChart
      );

      dailyIncreaseChart = drawDailyIncreaseChart(
        ddb.trend,
        dailyIncreaseChart,
        LANG
      );
      drawimportedAndContachCasesChart(ddb.trend);
    }
    // drawMap();
    /* map.once("style.load", function (e) {
      styleLoaded = true;
      whenMapAndDataReady();
    }); */
    whenMapAndDataReady();
    updateTooltipLang();
  });
}

var pageDraws = 0;
var styleLoaded = false;
var jsonData = undefined;
function whenMapAndDataReady() {
  // This runs drawMapPref only when
  // both style and json data are ready

  if (!styleLoaded || !jsonData) {
    return;
  }

  // drawMapPrefectures(pageDraws);
  // hotspotMap = drawHotspotMap(ddb.prefectures, LANG);
}

const startReloadTimer = () => {
  let reloadInterval = 3;
  setTimeout(() => location.reload(), reloadInterval * 60 * 60 * 1000);
};

let kpiDelay = 0;
const fetchAndUpdateKpi = async () => {
  try {
    let kpiResponse = await fetch(KPI_JSON_PATH);
    let kpiJson = await kpiResponse.json();
    drawKpis(kpiJson.totals, kpiJson.totalsDiff);
    if (kpiJson.updated) {
      drawLastUpdated(kpiJson.updated);
    }
  } catch (err) {
    kpiDelay += 2000;
    setTimeout(() => {
      fetchAndUpdateKpi();
    }, kpiDelay);
    // exponential backoff.
    console.log(err);
  }
};

window.onload = async function () {
  startReloadTimer();
  initDataTranslate();
  // Set HTML language tag
  document.documentElement.setAttribute("lang", LANG);
  await fetchAndUpdateKpi();

  loadDataOnPage();

  /*
    Commenting out auto refresh to mprove performance
  // Reload data every INTERVAL
  const FIVE_MINUTES_IN_MS = 300000;
  setInterval(function () {
    pageDraws++;
    loadDataOnPage();
  }, FIVE_MINUTES_IN_MS);
  */
};
