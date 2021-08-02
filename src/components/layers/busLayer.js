import * as L from 'leaflet/src/Leaflet';

function createSVGBusMarker(innerColor, outerColor, isPulsating, pulseColor) {
  if (isPulsating) {
    return `<svg viewbox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" fill="none" r="8" stroke="${pulseColor}" stroke-width="4">
          <animate attributeName="r" from="8" to="25" dur="1.5s" begin="0s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="20" fill="${innerColor}" r="10" stroke="${outerColor}" stroke-width="4"/>
      </svg>`;
  } else {
    return `<svg viewbox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" fill="${innerColor}" r="10" stroke="${outerColor}" stroke-width="4"/>
      </svg>`;
  }
}

const buildBusLayer = (map, geoJson, propertyIndex) => {
  return L.geoJson(geoJson, {
    pointToLayer(feature, latlng) {
      const {properties} = feature;
      const baseKV = properties.v_base;
      const service = properties.in_service;
      const status = properties.status;
      const vMag = properties.v_mag[propertyIndex];
      const vMinNorm = properties.v_min_norm;
      const vMaxNorm = properties.v_max_norm;
      const energized = properties.energized[propertyIndex] === 1;
      let strokeColor = '';
      let fillColor = '';
      let isPulsating = false;
      let pulseColor = '';
      // https://www.rapidtables.com/web/color/html-color-codes.html

      /*****
       [ > 500] - silver
       [500 - 346] - bluish-grey
       [345 - 231] - bright orange
       [230 - 116] - burnt orange
       [115 - 70] - royal blue
       [69 - 13.9kV]- dark purple
       [13.8kV < )  - dark blue
       */
      if (baseKV < 13.9) {
        strokeColor = '#00008B'; // dark blue
      } else if (baseKV >= 13.9 && baseKV <= 69) {
        strokeColor = '#4B0082'; // dark purple
      } else if (baseKV > 70 && baseKV <= 115) {
        strokeColor = '#4169E1'; // royal blue
      } else if (baseKV > 115 && baseKV <= 230) {
        strokeColor = '#FF8C00'; // dark orange
      } else if (baseKV > 230 && baseKV <= 345) {
        strokeColor = '#FFA500'; // orange
      } else if (baseKV > 345 && baseKV <= 500) {
        strokeColor = '#ADD8E6'; // light blue
      } else if (baseKV > 500) {
        strokeColor = '#B0C4DE'; // blusish silver
      }

      /*******
       Fill - status or violation
       ---------------------------------
       1) out-of-service:
       transparent
       status == 'out-of-service'
       2) in-service + deenergized
       light grey
       status == 'in-service' and energized[period]  == 0
       3) in-service + energized + v_mag within violations
           green-grey
       status == 'in-service' and energized[period]  == 1 and v_min_norm <= v_mag[period] <= v_max_norm
       4) in-service + energized + v_mag high violation
       red + ripple
       status == 'in-service' and energized[period]  == 1 and v_mag[period] > v_max_norm
       5) in-service + energized + v_mag low violation
       yellow + ripple
       status == 'in-service' and energized[period]  == 1 and v_min_norm > v_mag[period]
       */
      if (status === 'out-of-service') {
        // 1
        fillColor = 'rgba(0,0,0, 0.0)'; // transparent
      } else if (status === 'in-service' && energized === false) {
        // 2
        fillColor = '#D3D3D3'; // light-grey
      } else if (
        status === 'in-service' &&
        energized === true &&
        vMinNorm <= vMag &&
        vMag <= vMaxNorm
      ) {
        // 3
        fillColor = '#90EE90'; // light green
      } else if (
        status === 'in-service' &&
        energized === true &&
        vMag > vMaxNorm
      ) {
        // 4
        fillColor = '#FF0000'; // red
        isPulsating = true;
        pulseColor = '#FF0000'; // red
      } else if (
        status === 'in-service' &&
        energized === true &&
        vMinNorm > vMag
      ) {
        // 5
        fillColor = '#FFFF00'; // yellow
        isPulsating = true;
        pulseColor = '#FFFF00'; // red
      }

      const svg = createSVGBusMarker(
        fillColor,
        strokeColor,
        isPulsating,
        pulseColor
      );
      const iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);
      const icon = L.icon({
        iconUrl,
        iconSize: [60, 60],
        iconAnchor: [20, 20]
      });

      feature.model = 'bus';

      return L.marker(latlng, {
        icon
      }).on('click', (e) => {
        const event = new CustomEvent('BUS_CLICK_EVENT', {detail: feature});
        window.dispatchEvent(event);
      });

      /***
       return L.circleMarker(latlng, {
        radius: 14,
        weight: 4,
        color: strokeColor,
        fill: true,
        fillColor: fillColor,
        fillOpacity: 1.0
      }).on("click", function(e) {
        const event = new CustomEvent("BUS_CLICK_EVENT", { detail: feature });
        window.dispatchEvent(event);
      });
       **/
    },
    onEachFeature(feature, featureLayer) {
      const {geometry} = feature;
      const {properties} = feature;
      // console.log('here is a feature cords', geometry.coordinates);
      // console.log('here is a feature properties', properties);
      // featureLayer.bindPopup();
    }
  }).addTo(map);
};

export default buildBusLayer;
