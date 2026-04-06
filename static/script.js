let map;
let userLocation = [19.0760, 72.8777];
let ambulanceMarker, routeLine, hospitalMarker;

let requestCount = 0;
let totalETA = 0;

let chart;

// 🚦 Traffic Simulation
function simulateTraffic() {
    const levels = ["Low", "Medium", "High"];
    return levels[Math.floor(Math.random() * levels.length)];
}

// 📊 Chart Init
function initChart() {
    const ctx = document.getElementById('statsChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time',
                data: [],
                borderColor: 'green'
            }]
        }
    });
}

function initMap() {
    map = L.map('map').setView(userLocation, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

    L.marker(userLocation).addTo(map).bindPopup("You");

    initChart();
}

function drawRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const coords = data.routes[0].geometry.coordinates;
            const latlngs = coords.map(c => [c[1], c[0]]);

            if (routeLine) map.removeLayer(routeLine);

            routeLine = L.polyline(latlngs, {color: 'blue'}).addTo(map);

            animateAmbulance(latlngs);
        });
}

function animateAmbulance(route) {
    let i = 0;

    let ambulanceIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
        iconSize: [40, 40]
    });

    if (ambulanceMarker) map.removeLayer(ambulanceMarker);

    ambulanceMarker = L.marker(route[0], {icon: ambulanceIcon}).addTo(map);

    function move() {
        if (i < route.length) {
            ambulanceMarker.setLatLng(route[i]);
            i++;
            setTimeout(move, 20);
        }
    }

    move();
}

function requestAmbulance() {
    const statusEl = document.getElementById("status");

    statusEl.innerText = "Processing...";
    document.getElementById("statusText").innerText = "Active";

    fetch('/request_ambulance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lat: userLocation[0],
            lng: userLocation[1],
            severity: document.getElementById("severity").value
        })
    })
    .then(res => res.json())
    .then(data => {

        requestCount++;
        totalETA += data.eta;

        let avg = Math.round(totalETA / requestCount);

        document.getElementById("requests").innerText = requestCount;
        document.getElementById("avgTime").innerText = avg + " min";

        let traffic = simulateTraffic();
        let extra = traffic === "High" ? 5 : traffic === "Medium" ? 2 : 0;

        let finalETA = data.eta + extra;

        statusEl.innerText =
            "🚑 ETA: " + finalETA +
            " mins | 🚦 " + traffic +
            " | 🏥 " + data.hospital.name;

        // 📊 Update chart
        chart.data.labels.push("Req " + requestCount);
        chart.data.datasets[0].data.push(finalETA);
        chart.update();

        let ambulance = [data.ambulance.lat, data.ambulance.lng];

        drawRoute(ambulance, userLocation);
    });
}