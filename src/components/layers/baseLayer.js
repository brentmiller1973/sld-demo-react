import * as L from 'leaflet/src/Leaflet';
const buildBaseLayer = (mapUrl, cords, zoom, attributionStr) => {
  const map = L.map('map', {
    scrollWheelZoom: false
  }).setView(cords, zoom);

  L.tileLayer(mapUrl, {
    attribution: attributionStr
  }).addTo(map);

  return map;
};

export default buildBaseLayer;
