import * as L from 'leaflet/src/Leaflet';
const LogoControl = L.Control.extend({
    options: {
        position: 'topright'
    },

    onAdd(map) {
        return L.DomUtil.create('div', 'logo-control');

    }
});

export default LogoControl;
