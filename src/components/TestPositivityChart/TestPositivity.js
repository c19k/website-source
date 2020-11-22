import * as d3 from "d3";
import * as c3 from "c3";
import i18next from "i18next";
import last from "lodash/last";
import sum from "lodash/sum";

import {
  COLOR_TESTED,
  COLOR_TESTED_DAILY,
  TIME_PERIOD,
  COLOR_RED,
  COLOR_ORANGE,
  COLOR_TESTED_TOTAL_GRAPH,
} from "../../data/constants";

const drawTestPositivityChart = (sheetTrend, testPositivityChart) => {
  console.log(sheetTrend);
  const cols = {
    Date: [i18next.t("Date")],
    PositivityDaily: [i18next.t("Test Positivity")],
  };
  let testedTotal = [];
  let labels = [];

  for (let i = 0; i < sheetTrend.length; i++) {
    const row = sheetTrend[i];

    if (i === 0) {
      // Skip early feb data point
      continue;
    }

    cols.Date.push(row.date);

    if (cols.PositivityDaily.length > 1) {
      // Skip the first value

      let prevTotal = last(testedTotal);
      let thisDailyVal = row.testedCumulative - prevTotal;
      let thisDailyConfirmed = row.confirmed;

      if (thisDailyVal < 0) {
        thisDailyVal = 0;
      }
      let positivityToday = ((thisDailyConfirmed / thisDailyVal) * 100).toFixed(
        2
      );
      cols.PositivityDaily.push(positivityToday);
      testedTotal.push(row.testedCumulative);
      labels.push(
        `${i18next.t("Positive tests")}: ${thisDailyConfirmed} ${i18next.t(
          "Total tests"
        )} : ${thisDailyVal}`
      );
    } else {
      cols.PositivityDaily.push(0);
      testedTotal.push(0);
    }
  }

  if (testPositivityChart) {
    testPositivityChart.destroy();
  }

  testPositivityChart = c3.generate({
    bindto: "#test-positivity-chart",
    data: {
      colors: {
        [i18next.t("Test Positivity")]: COLOR_RED,
      },
      columns: [cols.PositivityDaily],
      // type: "bar",
      types: {
        [i18next.t("Test Positivity")]: "line",
      },
      regions: {
        [cols.PositivityDaily[0]]: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
      },
      axes: {
        [i18next.t("Test Positivity")]: "y",
      },
    },
    point: {
      // show: false,
      r: 0,
    },
    bar: {
      width: {
        ratio: 0.8,
      },
    },
    axis: {
      x: {
        tick: {
          format: (x) => {
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];

            // x+1 because the list is prefixed with the label
            const xDate = new Date(cols.Date[x + 1]);
            return `${months[xDate.getMonth()]} ${xDate.getDate()}`;
          },
        },
      },
      y: {
        label: i18next.t("Test Positivity"),
      },
    },
    tooltip: {
      format: {
        value: (value, ratio, id, index) => {
          return `${value}%  (${index > 0 ? labels[index - 1] : ""})`;
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
    legend: {
      hide: false,
    },
  });
  return testPositivityChart;
};

export default drawTestPositivityChart;
