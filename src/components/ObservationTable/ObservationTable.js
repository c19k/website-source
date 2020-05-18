import i18next from "i18next";
import orderBy from "lodash/orderBy";

function drawObservationTable(observationData) {
  // Draw the Cases By Prefecture table
  let dataTable = document.querySelector("#observation-table tbody");
  let dataTableFoot = document.querySelector("#observation-table tfoot");

  // Abort if dataTable or dataTableFoot is not accessible.
  if (!dataTable || !dataTableFoot) {
    console.error("Unable to find #observation-table");
    return;
  }

  let dates = Object.keys(observationData);
  dates.sort();
  let latest = dates[dates.length - 1];
  let latestDayData = observationData[latest];
  let districts = Object.keys(latestDayData);
  let underObservationArray = [];

  districts.map((district) => {
    let districtData = latestDayData[district];
    districtData["district"] = district;
    underObservationArray.push(districtData);
  });

  underObservationArray = orderBy(
    underObservationArray,
    ["peopleunderobservation"],
    ["desc"]
  );

  dataTable.innerHTML = "";
  dataTableFoot.innerHTML = "";

  underObservationArray.map((districtData) => {
    const {
      deltaHomeIsolation,
      deltaHospitalIsolation,
      deltaPeopleUnderObservation,
      district,
    } = districtData;

    let homeisolationDeltaSpan = "";
    let hospitalisolationDeltaSpan = "";
    let totalisolationDeltaSpan = "";

    if (deltaHomeIsolation !== 0) {
      homeisolationDeltaSpan = `<span class='increment'>(${
        deltaHomeIsolation > 0 ? "+" : ""
      }${deltaHomeIsolation})</span>`;
    }

    if (deltaHospitalIsolation !== 0) {
      hospitalisolationDeltaSpan = `<span class='increment'>(${
        deltaHospitalIsolation > 0 ? "+" : ""
      }${deltaHospitalIsolation})</span>`;
    }

    if (deltaPeopleUnderObservation !== 0) {
      totalisolationDeltaSpan = `<span class='increment'>(${
        deltaPeopleUnderObservation > 0 ? "+" : ""
      }${deltaPeopleUnderObservation})</span>`;
    }

    if (district == "total") {
      dataTableFoot.innerHTML += `<tr class='totals'>
        <td class="prefecture">${i18next.t(district)}</td>
        <td class="count">${districtData.hospitalisolation} </td>
        <td class="count">${districtData.homeisolation} </td>
        <td class="count">${districtData.peopleunderobservation} </td>
        </tr>`;
    } else {
      dataTable.innerHTML += `<tr>
        <td class="prefecture">${i18next.t(district)}</td>
        <td class="count">${
          districtData.hospitalisolation
        } ${hospitalisolationDeltaSpan}</td>
        <td class="count">${
          districtData.homeisolation
        } ${homeisolationDeltaSpan}</td>
        <td class="count">${
          districtData.peopleunderobservation
        } ${totalisolationDeltaSpan}</td>
        </tr>`;
    }
  });

  return;
}

export default drawObservationTable;
