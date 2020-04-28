// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";
import tippy from "tippy.js";
import * as d3 from "d3";
import * as c3 from "c3";
import ApexCharts from "apexcharts";
import moment from "moment";

// Localization deps
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import locI18next from "loc-i18next";
import languageResources, { LANGUAGES } from "./i18n";

import drawTestingTrendChart from "./components/TestingTrendChart";
import drawDailyIncreaseChart from "./components/DailyIncreaseChart";
import drawHotspotMap from "./components/HotspotMap";

// Keep reference to current chart in order to clean up when redrawing.
let testingTrendChart = null;
let dailyIncreaseChart = null;
let hotspotMap = null;

mapboxgl.accessToken =
  "pk.eyJ1IjoiamVldmFudGhhbmFsIiwiYSI6ImNrOGI3Y2UwZzA5ZTIzZm8zaHBoc3k5bmYifQ.u_IlM2qUJmPReoqA54Qqhw";
const PREFECTURE_JSON_PATH = "static/prefectures.geojson";
const JSON_PATH = "https://data.covid19kerala.info/summary/latest.json";
const TIME_FORMAT = "YYYY-MM-DD";
const COLOR_ACTIVE = "rgb(238,161,48)";
const COLOR_CONFIRMED = "rgb(223,14,31)";
const COLOR_RECOVERED = "rgb(25,118,210)";
const COLOR_DECEASED = "rgb(55,71,79)";
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
  },
  resources: languageResources,
};

// Global vars
let ddb = {
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
  travelRestrictions: {
    japan: {
      banned: [
        // refer to the keys under "countries" in the i18n files for names
        {
          name: "andorra",
          emoji: "🇦🇩",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "austria",
          emoji: "🇦🇹",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "belgium",
          emoji: "🇧🇪",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "china",
          emoji: "🇨🇳",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "estonia",
          emoji: "🇪🇪",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "france",
          emoji: "🇫🇷",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "germany",
          emoji: "🇩🇪",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "iceland",
          emoji: "🇮🇸",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "iran",
          emoji: "🇮🇷",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "ireland",
          emoji: "🇮🇪",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "italy",
          emoji: "🇮🇹",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "korea",
          emoji: "🇰🇷",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "liechtenstein",
          emoji: "🇱🇮",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "luxembourg",
          emoji: "🇱🇺",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "malta",
          emoji: "🇲🇹",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "monaco",
          emoji: "🇲🇨",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "netherlands",
          emoji: "🇳🇱",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "norway",
          emoji: "🇳🇴",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "portugal",
          emoji: "🇵🇹",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "sanmarino",
          emoji: "🇸🇲",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "Slovenia",
          nameJa: "スロベニア",
          emoji: "🇸🇮",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "spain",
          emoji: "🇪🇸",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "sweden",
          emoji: "🇸🇪",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "switzerland",
          emoji: "🇨🇭",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "vatican",
          emoji: "🇻🇦",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
        {
          name: "westerdam",
          emoji: "🛳",
          link: "http://www.moj.go.jp/content/001316999.pdf",
        },
      ],
      visaRequired: [],
      selfQuarantine: [],
      other: [],
    },
    foreignBorders: [
      {
        banned: [],
        visaRequired: [],
        selfQuarantine: [],
        other: [],
      },
    ],
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

    if (totalsDiff[totalKey] <= 0 && twoDaysBefore && twoDaysBefore[rowKey]) {
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
        return p.name === feature.properties.DISTRICT;
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
        feature.properties.DISTRICT
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

function getRGBColor(color) {
  return color
    .substring(4, color.length - 1)
    .replace(/ /g, "")
    .split(",");
}

function drawTrendChart(sheetTrend) {
  var cols = {
    Date: ["Date"],
    Confirmed: ["Confirmed"],
    Active: ["Active"],
    Critical: ["Critical"],
    Deceased: ["Deceased"],
    Recovered: ["Recovered"],
    Tested: ["Tested"],
  };

  for (var i = 0; i < sheetTrend.length; i++) {
    var row = sheetTrend[i];

    /*if (i === 0) {
      // Skip early feb data point
      continue;
    }*/

    cols.Date.push(row.date);
    cols.Confirmed.push(row.confirmedCumulative);
    cols.Critical.push(row.criticalCumulative);
    cols.Deceased.push(row.deceasedCumulative);
    cols.Recovered.push(row.recoveredCumulative);
    cols.Active.push(
      row.confirmedCumulative - row.deceasedCumulative - row.recoveredCumulative
    );
    cols.Tested.push(row.testedCumulative);
  }

  var chart = c3.generate({
    bindto: "#trend-chart",
    data: {
      x: "Date",
      color: function (color, d) {
        if (d && d.index === cols.Date.length - 2) {
          let rgb = getRGBColor(color);
          return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.6})`;
        } else {
          return color;
        }
      },
      columns: [
        cols.Date,
        cols.Confirmed,
        cols.Active,
        cols.Recovered,
        cols.Deceased,
        //cols.Tested
      ],
      regions: {
        [cols.Confirmed[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        [cols.Active[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        [cols.Recovered[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        [cols.Deceased[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
        //[cols.Tested[0]]: [{'start': cols.Date[cols.Date.length-2], 'style':'dashed'}],
      },
      names: {
        Date: i18next.t("Date"),
        Confirmed: i18next.t("Confirmed"),
        Active: i18next.t("Active"),
        Recovered: i18next.t("Recovered"),
        Deceased: i18next.t("Deceased"),
      },
    },
    color: {
      pattern: [COLOR_CONFIRMED, COLOR_ACTIVE, COLOR_RECOVERED, COLOR_DECEASED],
    },
    point: {
      r: 3,
    },
    axis: {
      x: {
        type: "timeseries",
        tick: {
          format: "%b %d",
          count: 6,
        },
      },
      y: {
        padding: {
          bottom: 0,
        },
        tick: {
          values: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
        },
      },
    },
    tooltip: {
      format: {
        value: function (value, ratio, id, index) {
          if (index && cols[id][index]) {
            var diff = parseInt(value) - cols[id][index];
            return `${value} (${(diff >= 0 ? "+" : "") + diff}) ${
              index === cols.Date.length - 2
                ? LANG === "en"
                  ? "Provisional"
                  : "അന്തിമമല്ല"
                : ""
            }`;
          } else {
            return value;
          }
        },
      },
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

function drawPrefectureTrend(elementId, seriesData, maxConfirmedIncrease) {
  let yMax = maxConfirmedIncrease;
  let prefectureMax = _.max(seriesData);
  if (prefectureMax / maxConfirmedIncrease < 0.1) {
    yMax = prefectureMax * 5; // artificially scale up low values to make it look ok.
  }

  const period = 30; // days
  let last30days = _.takeRight(seriesData, period);
  var options = {
    series: [{ data: last30days }],
    chart: {
      type: "area",
      height: 30,
      sparkline: { enabled: true },
      animations: { enabled: false },
    },
    colors: [COLOR_CONFIRMED],
    /*plotOptions: { bar: { columnWidth: "95%" } },*/
    xaxis: { crosshairs: { width: 1 } },
    yaxis: { max: yMax },
    stroke: {
      show: true,
      curve: "smooth",
      lineCap: "butt",
      colors: undefined,
      width: 0.75,
      dashArray: 0,
    },
    tooltip: {
      fixed: { enabled: false },
      x: { show: false },
      y: {
        formatter: function (
          value,
          { series, seriesIndex, dataPointIndex, w }
        ) {
          let daysBeforeToday = period - dataPointIndex - 1;
          let dateString = moment()
            .subtract(daysBeforeToday, "days")
            .format("MM/DD");
          return `${dateString}: ${value}`;
        },
        title: {
          formatter: (series) => {
            return "";
          },
        },
      },
      marker: { show: false },
    },
  };

  // Need an artificial delay for the html element to attach.
  setTimeout(function () {
    try {
      let chartElem = document.querySelector(elementId);
      if (chartElem) {
        // TODO(liquidx): So many places at the moment where HTML elements don't attach synchronously.
        var chart = new ApexCharts(document.querySelector(elementId), options);
        chart.render();
      }
    } catch (err) {
      // Silently fail if there's an error when creating the chart.
      // TODO(liquidx): Figure out what is going on.
    }
  }, 1000);
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

function drawPrefectureTable(prefectures, totals) {
  // Draw the Cases By Prefecture table
  let dataTable = document.querySelector("#prefectures-table tbody");
  let dataTableFoot = document.querySelector("#prefectures-table tfoot");
  let unspecifiedRow = "";
  let portOfEntryRow = "";

  // Abort if dataTable or dataTableFoot is not accessible.
  if (!dataTable || !dataTableFoot) {
    console.error("Unable to find #prefecture-table");
    return;
  }

  // Remove the loading cell
  dataTable.innerHTML = "";

  // Work out the largest daily increase
  let maxConfirmedIncrease = _.max(
    _.map(prefectures, (pref) => {
      return _.max(pref.dailyConfirmedCount);
    })
  );

  // Parse values so we can sort
  _.map(prefectures, function (pref) {
    pref.confirmed = pref.confirmed ? parseInt(pref.confirmed) : 0;
    pref.recovered = pref.recovered ? parseInt(pref.recovered) : 0;
    // TODO change to deceased
    pref.deceased = pref.deaths ? parseInt(pref.deaths) : 0;
    pref.active =
      pref.confirmed - ((pref.recovered || 0) + (pref.deceased || 0));
  });

  // Iterate through and render table rows
  _.orderBy(prefectures, "confirmed", "desc").map(function (pref) {
    if (!pref.confirmed && !pref.recovered && !pref.deceased) {
      return;
    }

    let prefStr;
    if (LANG == "en") {
      prefStr = pref.name;
    } else {
      prefStr = pref.name_ja;
    }

    let increment =
      pref.dailyConfirmedCount[pref.dailyConfirmedCount.length - 1];
    let incrementString = "";
    if (increment > 0) {
      incrementString = `<span class='increment'>(+${increment})</span>`;
    }

    if (pref.name == "Unspecified") {
      // Save the "Unspecified" row for the end of the table
      unspecifiedRow = `<tr>
        <td class="prefecture">${prefStr}</td>
        <td class="trend"><div id="Unspecified-trend"></div></td>
        <td class="count">${pref.confirmed} ${incrementString}</td>
        <td class="count">${pref.recovered ? pref.recovered : 0}</td>
        <td class="count">${pref.deceased ? pref.deceased : 0}</td>
        <td class="count">${pref.active || ""}</td>
        </tr>`;
      drawPrefectureTrend(
        `#Unspecified-trend`,
        pref.dailyConfirmedCount,
        maxConfirmedIncrease
      );
    } else if (pref.name == "Port Quarantine" || pref.name == "Port of Entry") {
      portOfEntryRow = `<tr>
        <td class="prefecture" data-ja="空港検疫">Port of Entry</td>
        <td class="trend"><div id="PortOfEntry-trend"></div></td>
        <td class="count">${pref.confirmed} ${incrementString}</td>
        <td class="count">${pref.recovered ? pref.recovered : 0}</td>
        <td class="count">${pref.deceased ? pref.deceased : 0}</td>
        <td class="count">${pref.active || ""}</td>
        </tr>`;
      drawPrefectureTrend(
        `#PortOfEntry-trend`,
        pref.dailyConfirmedCount,
        maxConfirmedIncrease
      );
    } else if (pref.name == "Total") {
      // Skip
    } else {
      dataTable.innerHTML += `<tr>
        <td class="prefecture">${prefStr}</td>
        <td class="trend"><div id="${pref.name}-trend"></div></td>
        <td class="count">${pref.confirmed} ${incrementString}</td>
        <td class="count">${pref.recovered ? pref.recovered : ""}</td>
        <td class="count">${pref.deceased ? pref.deceased : ""}</td>
        <td class="count">${pref.active || ""}</td>
        </tr>`;
      drawPrefectureTrend(
        `#${pref.name}-trend`,
        pref.dailyConfirmedCount,
        maxConfirmedIncrease
      );
    }
    return true;
  });

  dataTable.innerHTML = dataTable.innerHTML + portOfEntryRow + unspecifiedRow;

  let totalStr = "Total";
  if (LANG == "ml") {
    totalStr = "ആകെ ";
  }

  dataTableFoot.innerHTML = `<tr class='totals'>
        <td>${i18next.t("total")}</td>
        <td class="trend"></td>
        <td class="count">${totals.confirmed}</td>
        <td class="count">${totals.recovered}</td>
        <td class="count">${totals.deceased}</td>
        <td class="count">${
          totals.confirmed - totals.recovered - totals.deceased
        }</td>
        </tr>`;
}

function drawTravelRestrictions() {
  travelRestrictionsHelper(
    "#banned-entry",
    ddb.travelRestrictions.japan.banned
  );
  travelRestrictionsHelper(
    "#visa-required",
    ddb.travelRestrictions.japan.visaRequired
  );
  travelRestrictionsHelper(
    "#self-quarantine",
    ddb.travelRestrictions.japan.selfQuarantine
  );
  travelRestrictionsHelper(
    "#other-restrictions",
    ddb.travelRestrictions.japan.other
  );

  /*travelRestrictionsHelper('#foreign-banned-entry', ddb.travelRestrictions.foreignBorders.banned);
  travelRestrictionsHelper('#foreign-visa-required', ddb.travelRestrictions.foreignBorders.visaRequired);
  travelRestrictionsHelper('#foreign-self-quarantine', ddb.travelRestrictions.foreignBorders.selfQuarantine);
  travelRestrictionsHelper('#foreign-other-restrictions', ddb.travelRestrictions.foreignBorders.other);
  */
}

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
    document.querySelector("#kpi-" + key + " .value").innerHTML = value;
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
  // setKpi("critical", totals.critical);
  // setKpiDiff("critical", totalsDiff.critical);
  setKpi("hosptilised", totals.hosptilised);
  setKpiDiff("hosptilised", totalsDiff.hosptilised);
  setKpi("tested", totals.tested);
  setKpiDiff("tested", totalsDiff.tested);
  setKpi("active", totals.confirmed - totals.recovered - totals.deceased);
  setKpiDiff(
    "active",
    totalsDiff.confirmed - totalsDiff.recovered - totalsDiff.deceased
  );
}

function drawAgeTrendChart(age) {
  let female = [];
  let male = [];
  let ageGroups = [];
  var totalUnspecified;
  for (let ageGroup of age) {
    if (ageGroup.ageGroup != "Unspecified") {
      female.push(ageGroup.female);
      male.push(ageGroup.male);
      ageGroups.push(ageGroup.ageGroup);
    }

    if (ageGroup.ageGroup == "Unspecified") {
      totalUnspecified = ageGroup.total;
    }
  }

  var options = {
    series: [
      {
        name: "Male",
        data: male,
      },
      {
        name: "Female",
        data: female,
      },
    ],
    colors: ["#f5935d", "#a58e9e"],
    chart: {
      type: "bar",
      height: 400,
      stacked: true,
      toolbar: {
        show: false,
      },

      zoom: {
        enabled: false,
      },
      download: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    stroke: {
      width: 0.5,
      colors: ["#fff"],
    },
    /*title: {
          text: 'Age Group'
        },*/
    subtitle: {
      text: "Avaiting details for " + totalUnspecified + " patients",
      align: "right",
    },
    xaxis: {
      categories: ageGroups,
      labels: {
        formatter: function (val) {
          return val;
        },
      },
      title: {
        text: "Age Group",
      },
    },
    yaxis: {
      title: {
        text: "Number of patients",
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val;
        },
      },
    },
    fill: {
      opacity: 1,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      offsetX: 40,
    },
  };

  var chart = new ApexCharts(
    document.querySelector("#age-trend-chart"),
    options
  );
  chart.render();
}

function drawGenderChart(gender) {
  var options = {
    series: [gender.female, gender.male, gender.unspecified],
    colors: ["#57a998", "#c8e6bc", "#85cb9c"],
    chart: {
      width: 400,
      type: "pie",
    },
    labels: ["Female", "Male", "Unspecified"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 400,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  var chart = new ApexCharts(document.querySelector("#gender-chart"), options);
  chart.render();
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
  const lastUpdatedMoment = moment(
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
  let prefecturePaint = ["match", ["get", "DISTRICT"]];

  // Go through all prefectures looking for cases
  ddb.prefectures.map(function (prefecture) {
    let cases = parseInt(
      (prefecture.active =
        prefecture.confirmed -
        ((prefecture.recovered || 0) + (prefecture.deceased || 0)))
    );
    if (cases > 0) {
      prefecturePaint.push(prefecture.name);

      if (cases <= 5) {
        // 1-5 cases
        prefecturePaint.push("rgb(253,234,203)");
      } else if (cases <= 10) {
        // 6-10 cases
        prefecturePaint.push("rgb(251,155,127)");
      } else if (cases <= 50) {
        // 11-50 cases
        prefecturePaint.push("rgb(244,67,54)");
      } else {
        // 50+ cases
        prefecturePaint.push("rgb(186,0,13)");
      }
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
    map.getStyle().layers.forEach(function (thisLayer) {
      if (thisLayer.type == "symbol") {
        map.setLayoutProperty(thisLayer.id, "text-field", [
          "get",
          // "name_" + LANG,
          "name_en",
        ]);
      }
    });

    // Set HTML language tag
    document.documentElement.setAttribute("lang", LANG);

    // Redraw all components that need rerendering to be localized the prefectures table
    if (!document.body.classList.contains("embed-mode")) {
      if (document.getElementById("prefectures-table")) {
        drawPrefectureTable(ddb.prefectures, ddb.totals);
      }

      if (document.getElementById("travel-restrictions")) {
        drawTravelRestrictions();
      }

      drawTrendChart(ddb.trend);

      drawPrefectureTrajectoryChart(ddb.prefectures);
    }
    updateTooltipLang();
  });
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

    drawKpis(ddb.totals, ddb.totalsDiff);
    if (!document.body.classList.contains("embed-mode")) {
      drawLastUpdated(ddb.lastUpdated);
      drawPageTitleCount(ddb.totals.confirmed);
      drawPrefectureTable(ddb.prefectures, ddb.totals);
      drawTravelRestrictions();
      drawTrendChart(ddb.trend);
      drawDailyIncreaseChart(ddb.trend);
      drawPrefectureTrajectoryChart(ddb.prefectures);
      drawAgeTrendChart(ddb.age);
      drawGenderChart(ddb.gender);
      testingTrendChart = drawTestingTrendChart(ddb.trend, testingTrendChart);
      dailyIncreaseChart = drawDailyIncreaseChart(
        ddb.trend,
        dailyIncreaseChart,
        LANG
      );
    }

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

  drawMapPrefectures(pageDraws);
}

const startReloadTimer = () => {
  let reloadInterval = 3;
  setTimeout(() => location.reload(), reloadInterval * 60 * 60 * 1000);
};

window.onload = function () {
  startReloadTimer();
  initDataTranslate();
  // Set HTML language tag
  document.documentElement.setAttribute("lang", LANG);
  drawMap();
  hotspotMap = drawHotspotMap(LANG);

  map.once("style.load", function (e) {
    styleLoaded = true;
    whenMapAndDataReady();
  });

  loadDataOnPage();

  // Reload data every INTERVAL
  const FIVE_MINUTES_IN_MS = 300000;
  setInterval(function () {
    pageDraws++;
    loadDataOnPage();
  }, FIVE_MINUTES_IN_MS);
};
