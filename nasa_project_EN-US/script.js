// Rio Preto Verde - Leaflet.js Integration v4.0

// Global variables
let map;
let fireMarkers = [];
let districtMarkers = [];
let lowIcvCircles = [];
let layerGroups = {
    fires: null,
    districts: null,
    icv: null,
    heat: null,
    co2: null
};

// São José do Rio Preto coordinates
const RIO_PRETO_CENTER = [-20.8197, -49.3789];

// Districts data with VCI (Vegetation Cover Index) information
const districtsData = [
    { name: 'Talhado', lat: -20.7650, lng: -49.3500, icv: 22, priority: true },
    { name: 'HB', lat: -20.8400, lng: -49.4100, icv: 18, priority: true },
    { name: 'Schmitt', lat: -20.8600, lng: -49.3600, icv: 25, priority: true },
    { name: 'Central', lat: -20.8100, lng: -49.3789, icv: 52, priority: false },
    { name: 'Pinheirinho', lat: -20.7800, lng: -49.4000, icv: 38, priority: false },
    { name: 'CEU', lat: -20.7800, lng: -49.3500, icv: 42, priority: false },
    { name: 'Bosque', lat: -20.7750, lng: -49.3200, icv: 48, priority: false },
    { name: 'Represa', lat: -20.8200, lng: -49.3400, icv: 35, priority: false },
    { name: 'Vila Toninho', lat: -20.8500, lng: -49.3789, icv: 28, priority: true },
    { name: 'Cidade da Criança', lat: -20.8150, lng: -49.4200, icv: 33, priority: false },
    { name: 'Santa Fé', lat: -20.7950, lng: -49.3650, icv: 18, priority: true }
];

// Fire alerts data (simulated FIRMS data)
const fireAlertsData = [
    { lat: -20.7900, lng: -49.3700, location: 'Talhado', time: '12:30' },
    { lat: -20.8350, lng: -49.4050, location: 'HB', time: '10:15' },
    { lat: -20.8150, lng: -49.3500, location: 'Represa', time: '14:45' },
    { lat: -20.7850, lng: -49.4000, location: 'Pinheirinho', time: '09:20' },
    { lat: -20.8550, lng: -49.3650, location: 'Schmitt', time: '13:10' }
];

// Initialize Leaflet Map
function initMap() {
    console.log('%c🌳 Initializing Leaflet.js...', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    
    // Check if map element exists
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('%c⚠️ Map element not found. Skipping map initialization.', 'color: #FF9800; font-size: 12px;');
        return;
    }

    // Create map
    map = L.map('map', {
        center: RIO_PRETO_CENTER,
        zoom: 12,
        zoomControl: false
    });
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Initialize layer groups
    layerGroups.fires = L.layerGroup().addTo(map);
    layerGroups.districts = L.layerGroup().addTo(map);
    layerGroups.icv = L.layerGroup().addTo(map);
    layerGroups.heat = L.layerGroup();
    layerGroups.co2 = L.layerGroup();
    
    // Add markers and overlays
    addDistrictMarkers();
    addFireAlerts();
    addLowIcvZones();
    addHeatIslands();
    addTrafficAndCO2();
    
    // Initialize layer controls
    initializeLayerControls();
    
    // Initialize map controls
    initializeMapControls();
    
    console.log('%c✅ Leaflet.js loaded successfully!', 'color: #4CAF50; font-size: 12px;');
}

// Add district markers
function addDistrictMarkers() {
    districtsData.forEach(district => {
        // Create custom icon
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-pin ${district.priority ? 'priority' : 'normal'}">
                       <div class="marker-icon">${district.priority ? '⚠️' : '📍'}</div>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
        
        const marker = L.marker([district.lat, district.lng], { icon: icon });
        
        // Create popup content
        const popupContent = `
            <div class="leaflet-popup-custom">
                <div class="popup-title">${district.name}</div>
                <div class="popup-content">
                    <div class="popup-metric">
                        <span class="popup-label">VCI:</span>
                        <span class="popup-value ${district.icv < 30 ? 'alert' : district.icv < 40 ? 'warning' : 'success'}">
                            ${district.icv}%
                        </span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">Status:</span>
                        <span class="popup-value ${district.priority ? 'alert' : 'success'}">
                            ${district.priority ? 'Priority' : 'Adequate'}
                        </span>
                    </div>
                </div>
                <a href="bairro.html?district=${encodeURIComponent(district.name)}" class="popup-button">
                    View Detailed Analysis
                </a>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
        
        marker.addTo(layerGroups.districts);
        districtMarkers.push(marker);
    });
}

// Add fire alert markers
function addFireAlerts() {
    fireAlertsData.forEach(fire => {
        // Create pulsing fire icon
        const fireIcon = L.divIcon({
            className: 'fire-marker',
            html: `<div class="fire-marker-container">
                       <div class="fire-pulse"></div>
                       <div class="fire-icon">🔥</div>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
        
        const marker = L.marker([fire.lat, fire.lng], { icon: fireIcon });
        
        // Create popup for fire alert
        const firePopupContent = `
            <div class="leaflet-popup-custom fire-popup">
                <div class="popup-title">🔥 Active Heat Hotspot</div>
                <div class="popup-content">
                    <div class="popup-metric">
                        <span class="popup-label">Location:</span>
                        <span class="popup-value">${fire.location}</span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">Detected:</span>
                        <span class="popup-value">Today, ${fire.time}</span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">Source:</span>
                        <span class="popup-value">NASA FIRMS</span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">Status:</span>
                        <span class="popup-value alert">Active</span>
                    </div>
                </div>
            </div>
        `;
        
        marker.bindPopup(firePopupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
        
        marker.addTo(layerGroups.fires);
        fireMarkers.push(marker);
    });
}

// Add low VCI zones
function addLowIcvZones() {
    districtsData.forEach(district => {
        if (district.icv < 30) {
            const circle = L.circle([district.lat, district.lng], {
                color: '#f44336',
                fillColor: '#f44336',
                fillOpacity: 0.25,
                radius: 1500,
                weight: 2
            });
            
            circle.addTo(layerGroups.icv);
            lowIcvCircles.push(circle);
        }
    });
}

// Add heat islands layer
function addHeatIslands() {
    const heatIslandAreas = [
        { lat: -20.8100, lng: -49.3789, intensity: 'high', temp: 38 },
        { lat: -20.8400, lng: -49.4100, intensity: 'high', temp: 37 },
        { lat: -20.7950, lng: -49.3650, intensity: 'medium', temp: 35 }
    ];
    
    heatIslandAreas.forEach(area => {
        const color = area.intensity === 'high' ? '#FF5722' : '#FF9800';
        const circle = L.circle([area.lat, area.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            radius: 1200,
            weight: 2
        });
        
        circle.bindPopup(`
            <div class="leaflet-popup-custom">
                <div class="popup-title">🌡️ Heat Island</div>
                <div class="popup-content">
                    <div class="popup-metric">
                        <span class="popup-label">LST Temperature:</span>
                        <span class="popup-value alert">${area.temp}°C</span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">Intensity:</span>
                        <span class="popup-value">${area.intensity === 'high' ? 'High' : 'Medium'}</span>
                    </div>
                </div>
            </div>
        `);
        
        circle.addTo(layerGroups.heat);
    });
}

// Add traffic and CO2 emissions layer
function addTrafficAndCO2() {
    const trafficAreas = [
        { lat: -20.8100, lng: -49.3789, level: 'high', co2: 850, name: 'Downtown' },
        { lat: -20.8200, lng: -49.3400, level: 'medium', co2: 420, name: 'Represa' },
        { lat: -20.7800, lng: -49.3500, level: 'medium', co2: 380, name: 'CEU' }
    ];
    
    trafficAreas.forEach(area => {
        const color = area.level === 'high' ? '#9C27B0' : '#673AB7';
        const circle = L.circle([area.lat, area.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            radius: 1000,
            weight: 2,
            dashArray: '5, 5'
        });
        
        circle.bindPopup(`
            <div class="leaflet-popup-custom">
                <div class="popup-title">🚗 Traffic & Emissions</div>
                <div class="popup-content">
                    <div class="popup-metric">
                        <span class="popup-label">Location:</span>
                        <span class="popup-value">${area.name}</span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">Traffic Level:</span>
                        <span class="popup-value ${area.level === 'high' ? 'alert' : 'warning'}">
                            ${area.level === 'high' ? 'High' : 'Medium'}
                        </span>
                    </div>
                    <div class="popup-metric">
                        <span class="popup-label">CO₂ Emission:</span>
                        <span class="popup-value">${area.co2} ton/year</span>
                    </div>
                </div>
            </div>
        `);
        
        circle.addTo(layerGroups.co2);
    });
}

// Initialize layer controls
function initializeLayerControls() {
    const layerCheckboxes = document.querySelectorAll('.toggle-checkbox');
    
    layerCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const layerId = this.id;
            const isChecked = this.checked;
            
            console.log(`Layer ${layerId} ${isChecked ? 'activated' : 'deactivated'}`);
            
            if (layerId === 'layer-fires') {
                if (isChecked) map.addLayer(layerGroups.fires); else map.removeLayer(layerGroups.fires);
            }
            if (layerId === 'layer-icv') {
                if (isChecked) map.addLayer(layerGroups.icv); else map.removeLayer(layerGroups.icv);
            }
            if (layerId === 'layer-districts') {
                if (isChecked) map.addLayer(layerGroups.districts); else map.removeLayer(layerGroups.districts);
            }
            if (layerId === 'layer-heat') {
                if (isChecked) map.addLayer(layerGroups.heat); else map.removeLayer(layerGroups.heat);
            }
            if (layerId === 'layer-co2') {
                if (isChecked) map.addLayer(layerGroups.co2); else map.removeLayer(layerGroups.co2);
            }
            
            showNotification(`Layer ${isChecked ? 'activated' : 'deactivated'} successfully`);
        });
    });
}

// Initialize map controls
function initializeMapControls() {
    if (map) {
        document.getElementById('zoom-in')?.addEventListener('click', () => { map.zoomIn(); });
        document.getElementById('zoom-out')?.addEventListener('click', () => { map.zoomOut(); });
        document.getElementById('locate')?.addEventListener('click', () => { map.setView(RIO_PRETO_CENTER, 12); });
        document.getElementById('fullscreen')?.addEventListener('click', () => { toggleFullscreen(); });
    }
}

// Initialize district detail map
function initDistrictDetailMap() {
    console.log('%c🌳 Initializing neighborhood detail map...', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    
    const mapElement = document.getElementById('district-map');
    if (!mapElement) {
        console.log('%c⚠️ Neighborhood map element not found.', 'color: #FF9800; font-size: 12px;');
        return;
    }

    // Get district name from URL
    const urlParams = new URLSearchParams(window.location.search);
    const districtName = urlParams.get('district') || 'Santa Fé';
    
    // Find district data
    const district = districtsData.find(d => d.name === districtName) || districtsData[0];
    
    // Create map centered on district
    const districtMap = L.map('district-map', {
        center: [district.lat, district.lng],
        zoom: 14,
        zoomControl: true
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(districtMap);
    
    // Add district marker
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin ${district.priority ? 'priority' : 'normal'}">
                   <div class="marker-icon">${district.priority ? '⚠️' : '📍'}</div>
               </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 50]
    });
    
    L.marker([district.lat, district.lng], { icon: icon }).addTo(districtMap);
    
    // Add circle around district
    L.circle([district.lat, district.lng], {
        color: district.priority ? '#f44336' : '#2196F3',
        fillColor: district.priority ? '#f44336' : '#2196F3',
        fillOpacity: 0.15,
        radius: 2000,
        weight: 3
    }).addTo(districtMap);
    
    // Add priority areas if district is priority
    if (district.priority) {
        const priorityAreas = [
            { lat: district.lat + 0.005, lng: district.lng - 0.005, icv: 8 },
            { lat: district.lat - 0.003, lng: district.lng + 0.004, icv: 12 },
            { lat: district.lat + 0.002, lng: district.lng + 0.006, icv: 15 }
        ];
        
        priorityAreas.forEach((area, index) => {
            const circle = L.circle([area.lat, area.lng], {
                color: '#f44336',
                fillColor: '#f44336',
                fillOpacity: 0.4,
                radius: 400,
                weight: 2
            });
            
            circle.bindPopup(`
                <div class="leaflet-popup-custom">
                    <div class="popup-title">Priority Area ${index + 1}</div>
                    <div class="popup-content">
                        <div class="popup-metric">
                            <span class="popup-label">Local VCI:</span>
                            <span class="popup-value alert">${area.icv}%</span>
                        </div>
                        <div class="popup-metric">
                            <span class="popup-label">Action:</span>
                            <span class="popup-value">Urgent planting</span>
                        </div>
                    </div>
                </div>
            `);
            
            circle.addTo(districtMap);
        });
    }
    
    // Update page title
    document.querySelector('.breadcrumb-current').textContent = `Neighborhood Analysis: ${district.name}`;
    document.querySelector('.section-title').textContent = `📍 Detailed Map: ${district.name}`;
    
    console.log('%c✅ Neighborhood detail map loaded!', 'color: #4CAF50; font-size: 12px;');
}

// Initialize other UI elements
function initializeUIElements() {
    console.log('%c🌳 Rio Preto Verde - Geospatial Environmental Management System', 'color: #4CAF50; font-size: 18px; font-weight: bold;');
    console.log('%cPrototype v4.0 with Leaflet.js - Developed for São José do Rio Preto City Hall', 'color: #2196F3; font-size: 12px;');
    
    // Action buttons
    document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', function() {
            this.textContent = '⏳ Generating...';
            this.disabled = true;
            setTimeout(() => { window.location.href = 'relatorio.html'; }, 1500);
        });
    });
    
    // Secondary buttons
    document.querySelectorAll('.secondary-btn').forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            if (buttonText.includes('Sync')) {
                const originalText = this.textContent;
                this.textContent = '🔄 Syncing...';
                this.disabled = true;
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    showNotification('Data synced successfully!');
                }, 2000);
            } else if (buttonText.includes('Save')) {
                showNotification('Settings saved successfully!');
            }
        });
    });
    
    // Configuration sliders
    initializeSliders();
    
    // Config navigation
    initializeConfigNavigation();
    
    // Animate metric cards
    animateMetricCards();
    
    // Animate chart bars
    animateChartBars();
}

// Initialize sliders
function initializeSliders() {
    const sliders = {
        'icv-slider': { el: 'icv-value', suffix: '%' },
        'temp-slider': { el: 'temp-value', suffix: '°C' },
        'target-slider': { el: 'target-value', suffix: '%' },
        'fire-slider': { el: 'fire-value', levels: ['Low', 'Medium', 'High'] }
    };

    for (const sliderId in sliders) {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(sliders[sliderId].el);
        if (slider && valueEl) {
            slider.addEventListener('input', function() {
                if (sliders[sliderId].levels) {
                    valueEl.textContent = sliders[sliderId].levels[this.value - 1];
                } else {
                    valueEl.textContent = this.value + sliders[sliderId].suffix;
                }
            });
        }
    }
}

// Initialize config navigation
function initializeConfigNavigation() {
    const configNavItems = document.querySelectorAll('.config-nav-item');
    configNavItems.forEach(item => {
        item.addEventListener('click', function() {
            configNavItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Animate metric cards
function animateMetricCards() {
    document.querySelectorAll('.metric-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
}

// Animate chart bars
function animateChartBars() {
    const bars = document.querySelectorAll('.bar');
    if (bars.length > 0) {
        setTimeout(() => {
            bars.forEach((bar, index) => {
                const targetWidth = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => { bar.style.width = targetWidth; }, 100 + (index * 150));
            });
        }, 300);
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => { document.body.removeChild(notification); }, 300);
    }, 3000);
}

// Toggle fullscreen
function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUIElements();
    if (document.getElementById('map')) {
        initMap();
    } else if (document.getElementById('district-map')) {
        initDistrictDetailMap();
    }
});