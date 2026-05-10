// Initialize map with coordinates
const map = L.map('map').setView(
    [coordinates[1], coordinates[0]],
    13
);

// Add OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20
}).addTo(map);

// Add marker
L.marker([coordinates[1], coordinates[0]])
    .addTo(map)
    .bindPopup("Listing Location")
    .openPopup();