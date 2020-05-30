// Injects required polyfills for IE11
import "core-js/stable";
import "whatwg-fetch";

// Add all non-polyfill deps below.
import _ from "lodash";

import moment from "moment";
import sparkline from "@fnando/sparkline";

// Localization deps
import i18next from "i18next";

function drawPrefectureTrend(elementId, seriesData, maxConfirmedIncrease) {
  let yMax = maxConfirmedIncrease;
  let prefectureMax = _.max(seriesData);
  if (prefectureMax / maxConfirmedIncrease < 0.1) {
    yMax = prefectureMax * 5; // artificially scale up low values to make it look ok.
  }

  const period = 30; // days
  let last30days = _.takeRight(seriesData, period);

  function findClosest(target, tagName) {
    if (target.tagName === tagName) {
      return target;
    }

    while ((target = target.parentNode)) {
      if (target.tagName === tagName) {
        break;
      }
    }

    return target;
  }
  var options = {
    onmousemove(event, datapoint) {
      var svg = findClosest(event.target, "svg");
      var tooltip = svg.nextElementSibling;
      console.log(tooltip);
      let dataPointIndex = datapoint.index;
      let dataPointValue = datapoint.value;
      let daysBeforeToday = period - dataPointIndex - 1;
      let dateString = moment()
        .subtract(daysBeforeToday, "days")
        .format("MM/DD");
      tooltip.hidden = false;
      tooltip.textContent = `${dateString}: ${dataPointValue}`;
      tooltip.style.top = `${event.offsetY}px`;
      tooltip.style.left = `${event.offsetX + 20}px`;
    },

    onmouseout() {
      var svg = findClosest(event.target, "svg");
      var tooltip = svg.nextElementSibling;

      tooltip.hidden = true;
    },
  };

  // Need an artificial delay for the html element to attach.
  setTimeout(function () {
    try {
      let chartElem = document.querySelector(elementId);
      if (chartElem) {
        sparkline(chartElem, last30days, options);
      }
    } catch (err) {
      // Silently fail if there's an error when creating the chart.
      // TODO(liquidx): Figure out what is going on.
    }
  }, 1000);
}

function drawPrefectureTable(prefectures, totals, LANG) {
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
        <td class="trend">
          <div class="sparkline-container">
            <svg class="dist-sparkline" id="Unspecified-trend" width="100" height="30" stroke-width="0.5"></svg>
            <span class="sparkline-tooltip" hidden="true"></span>
          </div>
        </td>
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
        <td class="trend">
          <div class="sparkline-container">
            <svg class="dist-sparkline" id="PortOfEntry-trend" width="100" height="30" stroke-width="0.5"></svg>
            <span class="sparkline-tooltip" hidden="true"></span>
          </div>
        </td>
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
        <td class="trend">
        <div class="sparkline-container">
          <svg class="dist-sparkline" id="${
            pref.name
          }-trend" width="100" height="30" stroke-width="0.5"></svg>
          <span class="sparkline-tooltip" hidden="true"></span>
        </div>
        </td>
        <td class="count">${pref.confirmed} ${incrementString}</td>
        <td class="count">${pref.active || ""}</td>
        <td class="count">${pref.recovered ? pref.recovered : ""}</td>
        <td class="count">${pref.deceased ? pref.deceased : ""}</td>
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
        <td class="count">${
          totals.confirmed - totals.recovered - totals.deceased
        }</td>
        <td class="count">${totals.recovered}</td>
        <td class="count">${totals.deceased}</td>
        </tr>`;
}

export default drawPrefectureTable;
