import i18next from "i18next";

import { MAPBOX_ACCESS_TOKEN } from "../../data/constants";
import MultiTouch from "./MultiTouch";
import MapboxGLButtonControl from "./MapboxGLButtonControl";

//To add a layer toggler to a map.
//toggleableLayers is an array of format [{label:"<toggle button label>", layerIds : ["<layer id1>", "<layer id12>"...]}]
const addLayerToggles = (map, toggleableLayers) => {
  if (!toggleableLayers.length) {
    return;
  }
  // set up the corresponding toggle button for each layer
  for (var i = 0; i < toggleableLayers.length; i++) {
    var label = toggleableLayers[i].label;
    var layerIds = toggleableLayers[i].layerIds;

    var initialVisibility =
      toggleableLayers[i].initialVisibility !== undefined
        ? toggleableLayers[i].initialVisibility
        : true;

    if (Array.isArray(layerIds)) {
      layerIds = layerIds.join(";");
    }

    var toggleEvent = function (e) {
      this.blur();
      var clickedLayersList = this.getAttribute("layerIds");
      var clickedLayersArray = clickedLayersList.split(";");
      clickedLayersArray.forEach((layer) => {
        var visibility = map.getLayoutProperty(layer, "visibility");
        // toggle layer visibility by changing the layout object's visibility property
        if (visibility === "visible") {
          map.setLayoutProperty(layer, "visibility", "none");
          this.classList.remove("mapbox-gl-toggle-btn-active");
          this.classList.add("mapbox-gl-toggle-btn");
        } else {
          map.setLayoutProperty(layer, "visibility", "visible");
          this.classList.add("mapbox-gl-toggle-btn-active");
          this.classList.remove("mapbox-gl-toggle-btn");
        }
      });
    };
    var toggleBtnClassName = initialVisibility
      ? "mapbox-gl-toggle-btn-active"
      : "mapbox-gl-toggle-btn";
    const toggleButton = new MapboxGLButtonControl({
      className: toggleBtnClassName,
      title: label,
      layerIds: layerIds,
      eventHandler: toggleEvent,
    });
    map.addControl(toggleButton, "bottom-left");
  }
};

/**
 * drawDistrcitZones
 */
const drawDistrcitZones = (map, districtsData) => {
  // Find the index of the first symbol layer
  // in the map style so we can draw the
  // prefecture colors behind it

  var firstSymbolId;
  var layers = map.getStyle().layers;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === "symbol") {
      firstSymbolId = layers[i].id;
      break;
    }
  }

  // Start the Mapbox search expression
  let zonePaint = ["match", ["get", "district"]];

  // Go through all district to identify zones
  districtsData.map(function (district) {
    let zone = district.zone;
    if (zone) {
      zonePaint.push(district.name);
      if (zone == "Green") {
        // Green Zone
        zonePaint.push("rgb(0,128,0)");
      } else if (zone == "Orange") {
        // Orange Zone
        zonePaint.push("rgb(255,165,0)");
      } else if (zone == "Red") {
        // Red Zone
        zonePaint.push("rgb(255,0,0)");
      }
    }
  });

  // Add a final value to the list for the default color
  zonePaint.push("rgba(0,0,0,0)");

  map.addSource("districts-zones", {
    type: "geojson",
    data: "/static/districts.geojson",
  });

  // Add the prefecture color layer to the map
  map.addLayer(
    {
      id: "zone-layer",
      type: "fill",
      source: "districts-zones",
      layout: {
        visibility: "none",
      },
      paint: {
        "fill-color": zonePaint,
        "fill-opacity": 0.5,
      },
    },
    firstSymbolId
  );

  // Add another layer with type "line"
  // to provide a styled district border
  let distBorderLayer = map.addLayer(
    {
      id: "zone-outline-layer",
      type: "line",
      source: "districts-zones",
      layout: {
        visibility: "none",
      },
      paint: {
        "line-width": 0.5,
        "line-color": "#c0c0c0",
        "line-opacity": 0.5,
      },
    },
    firstSymbolId
  );

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });

  map.on("mousemove", function (e) {
    const feature = map.queryRenderedFeatures(e.point, {
      layers: ["zone-layer"],
    })[0];
    if (feature) {
      const thisDistrict = districtsData.filter((p) => {
        return p.name === feature.properties.district;
      });
      const name = thisDistrict[0].name;
      const zone = thisDistrict[0].zone;
      const zoneUpdatedOn = thisDistrict[0].zoneUpdatedOn;
      const html = `<h3>${i18next.t(name)}</h3><strong>${i18next.t(
        "Zone"
      )}: ${i18next.t(zone)}</strong><br />${i18next.t(
        "Zone Updated On"
      )}: ${zoneUpdatedOn}`;
      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    } else {
      popup.remove();
    }
  });
};

const drawHotspotMap = (districtsData, lang) => {
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

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  map.addControl(
    new mapboxgl.NavigationControl({
      showCompass: false,
      showZoom: true,
      zoomControl: true,
    })
  );

  map.on("load", function () {
    // Hotspots from JSON API
    map.addSource("hotspots", {
      type: "geojson",
      data: "https://data.covid19kerala.info/hotspot_data/latest.json",
    });

    // Distrricts GeoJson
    map.addSource("districts", {
      type: "geojson",
      data: "/static/districts.geojson",
    });

    // Boundaries to districts
    map.addLayer({
      id: "districts-boundaries",
      type: "line",
      source: "districts",
      layout: {
        visibility: "visible",
      },
      paint: {
        "line-width": 0.5,
        "line-color": "#000000",
        "line-opacity": 0.8,
      },
      filter: ["==", "$type", "Polygon"],
    });

    // Hotspot LSG Boundaries
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

    // Points to center of hotspot LSG
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

    // Hotspots other than LSGs
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

    // Add toggle buttons for map layers. Make sure visibility property
    // is set to visible for each layers
    var toggleableLayers = [
      {
        label: i18next.t("Hotspots"),
        layerIds: ["hotspot-boundary", "hotspot-points"],
      },
      {
        label: i18next.t("District Boundaries"),
        layerIds: "districts-boundaries",
      },
    ];

    addLayerToggles(map, toggleableLayers);

    // Hover Popup
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
        var notes = feature.properties.notes;

        var html = `<h3>${label}</h3>
              Type : ${type}<br />
              District : ${district}<br />
              Listed on : ${listedOn}`;

        if (feature.properties.notes) {
          html = html + `<br />Notes : ${notes}`;
        }
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
