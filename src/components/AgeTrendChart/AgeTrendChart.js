// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";
import * as d3 from "d3";
import * as c3 from "c3";
import ApexCharts from "apexcharts";
import moment from "moment";

// Localization deps
import i18next from "i18next";

function showSummary(
  totalUnspecified,
  totalMale,
  totalFemale,
  totalGenderUnspecified
) {
  let label = `${i18next.t("Awaiting age details for")}  : ${totalUnspecified}
    <br/>
    ${i18next.t("Male")} : ${totalMale} 
    &nbsp;&nbsp;  ${i18next.t("Female")} : ${totalFemale} 
    &nbsp;&nbsp; ${i18next.t("UnspecifiedGender")} : ${totalGenderUnspecified}
  `;
  document.getElementById("age-trend-count-summary").innerHTML = label;
}

function drawAgeTrendChart(age) {
  let female = [];
  let male = [];
  let ageGroups = [];
  var totalUnspecified;
  var totalMale = 0;
  var totalFemale = 0;
  var totalGenderUnspecified = 0;
  for (let ageGroup of age) {
    totalMale += ageGroup.male;
    totalFemale += ageGroup.female;
    totalGenderUnspecified += ageGroup.unspecified;
    if (ageGroup.ageGroup != "Unspecified") {
      female.push(ageGroup.female);
      male.push(ageGroup.male);
      ageGroups.push(ageGroup.ageGroup);
    }

    if (ageGroup.ageGroup == "Unspecified") {
      totalUnspecified = ageGroup.total;
    }
  }
  let grandTotal = totalMale + totalFemale + totalGenderUnspecified;
  let yTicks = [];
  for (let i = 50; i < grandTotal + 50; i = i + 50) {
    yTicks.push(i);
  }
  var totals = [];

  function showLastLabel() {
    var shown = chart.data.shown().map(function (item) {
      return item.id;
    }); // get visible ids: ['data1', 'data2', ...]
    var last = shown[shown.length - 1];
    d3.select("#age-trend-chart")
      .select(".c3-chart-texts")
      .selectAll(".c3-target")
      .style("display", "none"); // hide all

    d3.select("#age-trend-chart")
      .select(".c3-chart-texts")
      .selectAll(".c3-target-" + last)
      .style("display", "block"); // show last
    d3.select("#age-trend-chart")
      .select(".c3-chart-texts")
      .selectAll(".c3-target-" + last)
      .selectAll(".c3-texts-" + last)
      .selectAll(".c3-text")
      .style("fill", "#DE0E1F");
  }

  var chart = c3.generate({
    bindto: "#age-trend-chart",
    onrendered: function () {
      totals = [];
    },
    legend: {
      item: {
        onclick: function (id) {
          chart.toggle([id]); // keep default functionality
          showLastLabel();
        },
      },
    },
    data: {
      x: "x",
      columns: [
        ["x", ...ageGroups],
        [i18next.t("Female"), ...female],
        [i18next.t("Male"), ...male],
      ],
      colors: {
        [i18next.t("Female")]: "#1976D3",
        [i18next.t("Male")]: "#A5ADC1",
      },
      labels: {
        format: function (v, id, i, j) {
          if (isNaN(totals[i])) totals[i] = 0;
          // sum only visible
          if (chart) {
            var shown = chart.data.shown().map(function (item) {
              return item.id;
            });
            if (shown.indexOf(id) != -1) totals[i] += v;
          } else {
            totals[i] += v;
          }
          return totals[i];
        },
      },
      type: "bar",
      groups: [[i18next.t("Female"), i18next.t("Male")]],
    },
    axis: {
      x: {
        label: {
          text: i18next.t("Age Group"),
          position: "outer-right",
        },
        type: "category",
      },
      y: {
        label: {
          text: i18next.t("Number of patients"),
          position: "outer-top",
        },
        tick: {
          values: yTicks,
        },
      },
    },
    padding: {
      bottom: 10,
    },
    grid: {
      y: {
        show: true,
      },
    },
  });
  showLastLabel();
  showSummary(totalUnspecified, totalMale, totalFemale, totalGenderUnspecified);
}

export default drawAgeTrendChart;
