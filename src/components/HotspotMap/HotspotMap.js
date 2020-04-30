import i18next from "i18next";

import { MAPBOX_ACCESS_TOKEN } from "../../data/constants";
import MultiTouch from "./MultiTouch";

//To add a layer toggler to a map.
//toggleableLayers is an array of format [{label:"<toggle button label>", layerId : "<id of the layer to toggle>""}]
const addLayerToggles = (map, toggleableLayers) => {
  if (!toggleableLayers.length) {
    return;
  }
  var toggler = document.getElementById("hotspot-map-menu");
  toggler.innerHTML = "";

  // set up the corresponding toggle button for each layer
  for (var i = 0; i < toggleableLayers.length; i++) {
    var label = toggleableLayers[i].label;
    var layerId = toggleableLayers[i].layerId;

    var link = document.createElement("a");
    link.href = "#";
    link.className = "active";
    link.textContent = label;
    link.setAttribute("layerId", layerId);

    link.onclick = function (e) {
      var clickedLayer = this.getAttribute("layerId");
      console.log(clickedLayer);
      e.preventDefault();
      e.stopPropagation();

      var visibility = map.getLayoutProperty(clickedLayer, "visibility");

      // toggle layer visibility by changing the layout object's visibility property
      if (visibility === "visible") {
        map.setLayoutProperty(clickedLayer, "visibility", "none");
        this.className = "";
      } else {
        this.className = "active";
        map.setLayoutProperty(clickedLayer, "visibility", "visible");
      }
    };
    toggler.appendChild(link);
  }
  toggler.style.visibility = "visible";
};

const drawHotspotMap = (lang) => {
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  var map = new mapboxgl.Map({
    container: "hotspot-map-container",
    style: "mapbox://styles/mapbox/outdoors-v11",
    center: {
      lng: 76.2926027,
      lat: 10.6321557,
    },
    /*maxBounds: [
      [73.523941, 6.869530], // SW
      [79.660925, 14.813981] // NE
    ],*/
    zoom: 6.5,
    minZoom: 4,
    maxZoom: 10,
  });

  map.addControl(
    new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: true,
      zoomControl: true,
    })
  );

  map.on("load", function () {
    map.addSource("hotspots", {
      type: "geojson",
      data: "https://data.covid19kerala.info/hotspot_data/latest.json",
    });

    map.addLayer({
      id: "hotspot-boundary",
      type: "fill",
      source: "hotspots",
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-color": "#B42222",
        "fill-opacity": 0.3,
        "fill-outline-color": "#000000",
      },
      filter: ["==", "$type", "Polygon"],
    });

    map.addLayer({
      id: "hotspot-points",
      type: "circle",
      source: "hotspots",
      layout: {
        visibility: "visible",
      },
      paint: {
        "circle-radius": 5,
        "circle-color": "#B42222",
      },
      filter: ["all", ["==", "$type", "Point"], ["!=", "type", "Other"]],
    });

    map.addLayer({
      id: "other-points",
      type: "symbol",
      source: "hotspots",
      layout: {
        "icon-image": "hospital-15",
        "icon-allow-overlap": true,
        visibility: "visible",
      },
      filter: ["all", ["==", "$type", "Point"], ["==", "type", "Other"]],
    });

    // enumerate ids of the layers
    var toggleableLayers = [
      { label: i18next.t("Affected LGS"), layerId: "hotspot-boundary" },
      { label: i18next.t("Hotspots"), layerId: "hotspot-points" },
      { label: i18next.t("Hospitals"), layerId: "other-points" },
    ];
    addLayerToggles(map, toggleableLayers);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on("mousemove", function (e) {
      const feature = map.queryRenderedFeatures(e.point, {
        layers: ["hotspot-boundary", "other-points"],
      })[0];
      if (feature) {
        var label = feature.properties.label;
        if (lang == "ml") {
          label = feature.properties.labelMl;
        }
        var district = feature.properties.district;
        var type = feature.properties.type;
        var listedOn = feature.properties.listedOn;

        var html = `<h3>${label}</h3>
              Type : ${type}<br />
              District : ${district}<br />
              Listed on : ${listedOn}`;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      } else {
        popup.remove();
      }
    });

    //Disable single touch pan in mobile devices so that scrolling is intuitive
    //To pan and zoom, use 2 fingers
    map.addControl(new MultiTouch());
  });

  // return hotspotMap;
};

export default drawHotspotMap;
