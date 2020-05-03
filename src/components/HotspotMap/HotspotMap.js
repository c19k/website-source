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
    if (Array.isArray(layerIds)) {
      layerIds = layerIds.join(";");
    }

    var toggleEvent = function (e) {
      var clickedLayersList = this.getAttribute("layerIds");
      var clickedLayersArray = clickedLayersList.split(";");
      clickedLayersArray.forEach((layer) => {
        var visibility = map.getLayoutProperty(layer, "visibility");
        // toggle layer visibility by changing the layout object's visibility property
        if (visibility === "visible") {
          map.setLayoutProperty(layer, "visibility", "none");
        } else {
          map.setLayoutProperty(layer, "visibility", "visible");
        }
      });
    };

    const toggleButton = new MapboxGLButtonControl({
      className: "mapbox-gl-toggle-btn",
      title: label,
      layerIds: layerIds,
      eventHandler: toggleEvent,
    });
    map.addControl(toggleButton, "bottom-left");
  }
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

    // Add toggle buttons for map layers. Make sure visibility property
    // is set to visible for each layers
    var toggleableLayers = [
      {
        label: i18next.t("Affected LGS"),
        layerIds: ["hotspot-boundary", "hotspot-points"],
      },
      { label: i18next.t("Hotspots"), layerIds: "hotspot-points" },
      { label: i18next.t("Hospitals"), layerIds: "other-points" },
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
