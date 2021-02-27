// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";
/* import { format } from "date-fns";
import { enUS } from "date-fns/locale"; */
// Add all non-polyfill deps below.
import _ from "lodash";

// import moment from "moment";
import * as c3 from "c3";
import dayjs from "dayjs";

// Localization deps
import i18next from "i18next";

// Helper method to do parseInt safely (reverts to 0 if unparse)
const safeParseInt = (v) => {
  let result = parseInt(v);
  if (isNaN(result)) {
    return 0;
  }
  return result;
};

const startDate = "2020-03-19";

function drawimportedAndContachCasesChart(trendData) {
  let dateLocale = "en";
  let dates = [];
  let contactCases = [];
  let importedCases = [];
  let noHistoryCases = [];
  for (let i = 0; i < trendData.length; i++) {
    let currentDateData = trendData[i];
    let date = currentDateData.date;
    let dateMoment = dayjs(date);

    if (!dateMoment.isAfter(startDate)) {
      continue;
    }

    let currentDayImportedCases = safeParseInt(currentDateData.importedCases);
    let currentDayContactCases = safeParseInt(currentDateData.contactCases);
    let currentDayNoHistoryCases = safeParseInt(currentDateData.noHistoryCases);

    //skip the entry if data for the present date is not
    if (i == trendData.length - 1) {
      if (currentDayImportedCases == 0 && currentDayContactCases == 0) {
        continue;
      }
    }
    dates.push(date);
    contactCases.push(currentDayContactCases);
    importedCases.push(currentDayImportedCases);
    noHistoryCases.push(currentDayNoHistoryCases);
  }

  var chart = c3.generate({
    bindto: "#contact-cases-chart",
    data: {
      x: "x",
      columns: [
        ["x", ...dates],
        [i18next.t("contact-cases"), ...contactCases],
        [i18next.t("imported-cases"), ...importedCases],
        [i18next.t("no-history-cases"), ...noHistoryCases],
      ],
      colors: {
        [i18next.t("contact-cases")]: "#1876D3",
        [i18next.t("imported-cases")]: "#A5ADC1",
        [i18next.t("no-history-cases")]: "#F44335",
      },
    },
    point: {
      r: 2,
    },
    axis: {
      x: {
        type: "timeseries",
        tick: {
          format: "%b %d",
          count: 15,
        },
      },
      y: {
        min: 20,
        label: {
          text: i18next.t("Number of patients"),
          position: "outer-top",
        },
      },
    },
    padding: {
      bottom: 10,
      right: 30,
    },
    grid: {
      y: {
        show: true,
      },
    },
  });
}
export default drawimportedAndContachCasesChart;
