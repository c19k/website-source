import i18next from "i18next";

import { MAPBOX_ACCESS_TOKEN } from "../../data/constants";
import MultiTouch from "./MultiTouch";

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
      },
      filter: ["all", ["==", "$type", "Point"], ["==", "type", "Other"]],
    });

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
