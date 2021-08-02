import * as L from 'leaflet/src/Leaflet';
const buildBranchLayer = (map, geoJson, propertyIndex) => {
  const branchLayer = L.geoJson(geoJson, {
    style(feature) {
      const { properties } = feature;

      const baseKV = properties.v_base;
      const status = properties.status;
      const energized = properties.energized[propertyIndex] === 1; // only supporting 1 period right now
      const P_mk = properties.P_mk[propertyIndex];
      const P_km = properties.P_km[propertyIndex];
      const ratingA = properties.ratingA;
      // and if max(P_mk[period], P_km[period]) < ratingA and ( ratingA - max(P_mk[period], P_km[period]) ) / ratingA > 0.05
      if (status === 'out-of-service') {
        return {
          color: '#D3D3D3', // light-grey
          dashArray: '16',
          weight: 3
        };
      } else if (status === 'in-service' && energized === false) {
        return {
          color: '#D3D3D3', // light-grey
          weight: 3
        };
      } else if (
        status === 'in-service' &&
        energized === true &&
        Math.max(P_mk, P_km) < ratingA &&
        (ratingA - Math.max(P_mk, P_km)) / ratingA > 0.05
      ) {
        return {
          color: '#90EE90', // light green
          weight: 3
        };
      } else if (
        status === 'in-service' &&
        energized === true &&
        Math.max(P_mk, P_km) < ratingA &&
        (ratingA - Math.max(P_mk, P_km)) / ratingA <= 0.05
      ) {
        return {
          color: '#FFFF00', // yellow
          weight: 3
        };
      } else if (
        status === 'in-service' &&
        energized === true &&
        Math.max(P_mk, P_km) >= ratingA &&
        (Math.max(P_mk, P_km) - ratingA) / ratingA <= 0.05
      ) {
        return {
          color: '#FFA500', // orange
          weight: 3
        };
      } else if (
        status === 'in-service' &&
        energized === true &&
        Math.max(P_mk, P_km) >= ratingA &&
        (Math.max(P_mk, P_km) - ratingA) / ratingA > 0.05
      ) {
        return {
          color: '#FF0000', // red
          weight: 3
        };
      }
    },
    onEachFeature(feature, featureLayer) {
      const { geometry, properties } = feature;
      feature.model = 'branch';
      featureLayer.on('click', (e) => {
        const event = new CustomEvent('BRANCH_CLICK_EVENT', {
          detail: feature
        });
        window.dispatchEvent(event);
      });
      return L.polyline(geometry.coordinates, {
        fill: true
      });
    }
  }).addTo(map);

  return branchLayer;
};

export default buildBranchLayer;
