// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";
import * as c3 from "c3";

// Localization deps
import i18next from "i18next";

const COLOR_ACTIVE = "rgb(238,161,48)";
const COLOR_CONFIRMED = "rgb(223,14,31)";
const COLOR_RECOVERED = "rgb(25,118,210)";
const COLOR_DECEASED = "rgb(55,71,79)";

function getRGBColor(color) {
  return color
    .substring(4, color.length - 1)
    .replace(/ /g, "")
    .split(",");
}

function drawTrendChart(sheetTrend, LANG) {
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
      // r: 2,
      show: false,
    },
    zoom: {
      enabled: false,
      // type: 'drag',
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
          culling: {
            max: 10, // the number of tick texts will be adjusted to less than this value
          },
          //values: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
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

export default drawTrendChart;
