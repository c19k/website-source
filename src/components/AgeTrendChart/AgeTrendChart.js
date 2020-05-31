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

function showUnspecifiedLabel(count) {
  let label = i18next.t("Awaiting details for") + " : " + count;
  document.getElementById("unspecified-count").innerHTML = label;
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
  showUnspecifiedLabel(totalUnspecified);
}

export default drawAgeTrendChart;
