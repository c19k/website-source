// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";
import * as d3 from "d3";
import * as c3 from "c3";
// import ApexCharts from "apexcharts";
import moment from "moment";

// Localization deps
import i18next from "i18next";

function drawGenderChart(gender) {
  var options = {
    series: [gender.female, gender.male, gender.unspecified],
    colors: ["#57a998", "#c8e6bc", "#85cb9c"],
    chart: {
      width: 400,
      type: "pie",
    },
    labels: [
      i18next.t("Female"),
      i18next.t("Male"),
      i18next.t("UnspecifiedGender"),
    ],
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
  if (genderChart !== false) {
    genderChart.destroy();
  }
  genderChart = new ApexCharts(
    document.querySelector("#gender-chart"),
    options
  );
  genderChart.render();
}

export default drawGenderChart;
