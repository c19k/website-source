import * as c3 from "c3";
import i18next from "i18next";
/* import { format } from "date-fns";
import { enUS, ml } from "date-fns/locale"; */
import dayjs from "dayjs";

import {
  COLOR_TESTED,
  COLOR_TESTED_DAILY,
  CHART_TIME_PERIOD,
  COLOR_CONFIRMED,
} from "../../data/constants";

const drawDailyIncreaseChart = (sheetTrend, dailyIncreaseChart, lang) => {
  let dateLocale = "en";
  /*if (lang == "ja") {
    dateLocale = ml;
  }*/

  const cols = {
    Date: ["Date"],
    Confirmed: ["Confirmed"],
    ConfirmedAvg: ["ConfirmedAvg"],
  };

  for (
    // let i = sheetTrend.length - CHART_TIME_PERIOD;
    let i = sheetTrend.length - sheetTrend.length;
    i < sheetTrend.length;
    i++
  ) {
    const row = sheetTrend[i];
    cols.Date.push(row.date);
    cols.Confirmed.push(row.confirmed);
    // cols.ConfirmedAvg.push(row.confirmedAvg7d);
    if (i < sheetTrend.length - 1) {
      // Omit the last data point since it's provisional
      // and will always point downwards for the average.
      cols.ConfirmedAvg.push(row.confirmedAvg7d);
    }
  }

  if (dailyIncreaseChart) {
    dailyIncreaseChart.destroy();
  }

  // console.log([cols.Confirmed, cols.ConfirmedAvg]);

  dailyIncreaseChart = c3.generate({
    bindto: "#daily-increase-chart",
    data: {
      colors: {
        Confirmed: (color, d) => {
          if (d && d.index === cols.Date.length - 2) {
            return COLOR_TESTED_DAILY;
          } else {
            return COLOR_TESTED;
          }
        },
        ConfirmedAvg: (color, d) => {
          return COLOR_CONFIRMED;
        },
      },
      columns: [cols.Confirmed, cols.ConfirmedAvg],
      /*names: {
        Confirmed: i18next.t("daily"),
        ConfirmedAvg: i18next.t("7-day-average"),
      },*/
      names: {
        Confirmed: i18next.t("Daily"),
        ConfirmedAvg: i18next.t("7 Day Average"),
      },
      type: "bar",
      types: {
        Confirmed: "bar",
        ConfirmedAvg: "spline",
      },
      regions: {
        Confirmed: [
          { start: cols.Date[cols.Date.length - 2], style: "dashed" },
        ],
      },
    },
    point: {
      r: 0,
    },
    bar: {
      width: {
        ratio: 0.6,
      },
    },
    axis: {
      x: {
        tick: {
          format: (x) => {
            // x+1 because the list is prefixed with the label
            const xDate = new Date(cols.Date[x + 1]);
            return dayjs(xDate).format("MMM d");
          },
        },
      },
      y: {
        tick: {
          culling: {
            max: 10, // the number of tick texts will be adjusted to less than this value
          },
        },
      },
    },
    tooltip: {
      format: {
        value: (value, ratio, id, index) => {
          return `${value} ${
            index === cols.Date.length - 2 ? i18next.t("provisional") : ""
          }`;
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
  return dailyIncreaseChart;
};

export default drawDailyIncreaseChart;
