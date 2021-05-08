// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";
import * as c3 from "c3";
import * as d3 from "d3";

// Localization deps
import i18next from "i18next";

import {
  COLOR_TESTED,
  COLOR_TESTED_DAILY,
  TIME_PERIOD,
  COLOR_RED,
  COLOR_ORANGE,
  COLOR_TESTED_TOTAL_GRAPH,
} from "../../data/constants";

function getRGBColor(color) {
  return color
    .substring(4, color.length - 1)
    .replace(/ /g, "")
    .split(",");
}

function drawVaccinationChart(sheetTrend, LANG) {
  var cols = {
    Date: ["Date"],
    VaccinatedTotal: ["VaccinatedTotal"],
    VaccinatedFirstDose: ["VaccinatedFirstDose"],
    VaccinatedSecondDose: ["VaccinatedSecondDose"],
  };

  for (var i = 374; i < sheetTrend.length; i++) {
    var row = sheetTrend[i];
    if (_.get(row, "vaccineCumulative", 0) == 0) {
      continue;
    }

    cols.Date.push(row.date);
    cols.VaccinatedTotal.push(_.get(row, "vaccineCumulative", 0));
    cols.VaccinatedFirstDose.push(_.get(row, "vaccineFirstDose", 0));
    cols.VaccinatedSecondDose.push(_.get(row, "vaccineSecondDose", 0));
  }

  console.log(cols);

  var chart = c3.generate({
    bindto: "#vaccination-chart",
    data: {
      x: "Date",
      columns: [
        cols.Date,
        cols.VaccinatedTotal,
        cols.VaccinatedFirstDose,
        cols.VaccinatedSecondDose,
      ],
      colors: {
        VaccinatedTotal: COLOR_TESTED_TOTAL_GRAPH,
        VaccinatedFirstDose: COLOR_TESTED_DAILY,
        VaccinatedSecondDose: "#1876D3",
      },
      names: {
        Date: i18next.t("Date"),
        VaccinatedTotal: i18next.t("VaccinatedTotal"),
        VaccinatedFirstDose: i18next.t("VaccinatedFirstDose"),
        VaccinatedSecondDose: i18next.t("VaccinatedSecondDose"),
      },
      types: {
        VaccinatedTotal: "area",
        VaccinatedFirstDose: "spline",
        VaccinatedSecondDose: "spline",
      },
      groups: [["VaccinatedFirstDose", "VaccinatedFirstDose"]],
      axes: {
        VaccinatedFirstDose: "y",
        VaccinatedSecondDose: "y",
        VaccinatedTotal: "y2",
      },
    },
    type: "bar",
    bar: {
      width: {
        ratio: 0.2,
      },
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
      y2: {
        show: true,
        label: i18next.t("VaccinatedTotal"),
        tick: {
          format: d3.format("~s"),
        },
      },
    },
  });
}

export default drawVaccinationChart;
