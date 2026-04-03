// Map functionality - Complete
(function() {
    'use strict';
    
    // Initialize map on show page
    window.initShowMap = function(listingData) {
        console.log('Initializing show map...', listingData);
        
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }
        
        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded');
            return;
        }
        
        // Default view (India)
        const map = L.map('map').setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Custom Airbnb-style marker
        const airbnbIcon = L.divIcon({
            html: '<i class="fas fa-map-marker-alt" style="color: #ff385c; font-size: 30px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        // Add marker if coordinates exist
        if (listingData.geometry && listingData.geometry.coordinates) {
            const lat = listingData.geometry.coordinates[1];
            const lng = listingData.geometry.coordinates[0];
            
            L.marker([lat, lng], { icon: airbnbIcon })
                .addTo(map)
                .bindPopup(`<b>${listingData.title}</b><br>${listingData.location}, ${listingData.country}`)
                .openPopup();
            
            map.setView([lat, lng], 13);
        } else {
            L.marker([20.5937, 78.9629])
                .addTo(map)
                .bindPopup(`${listingData.location}, ${listingData.country}`)
                .openPopup();
        }
        
        return map;
    };
    
    // Initialize map on index page (multiple listings)
    window.initIndexMap = function(listings) {
        console.log('Initializing index map...', listings);
        
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        if (typeof L === 'undefined') return;
        
        const map = L.map('map').setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        const airbnbIcon = L.divIcon({
            html: '<i class="fas fa-map-marker-alt" style="color: #ff385c; font-size: 24px;"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24]
        });
        
        listings.forEach(listing => {
            if (listing.geometry && listing.geometry.coordinates) {
                const lat = listing.geometry.coordinates[1];
                const lng = listing.geometry.coordinates[0];
                
                L.marker([lat, lng], { icon: airbnbIcon })
                    .addTo(map)
                    .bindPopup(`<b>${listing.title}</b><br>${listing.location}<br><a href="/listings/${listing._id}">View Details</a>`);
            }
        });
        
        return map;
    };
    
    // Auto-initialize when DOM is ready (for show page)
    if (typeof window !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function() {
            const mapDataElement = document.getElementById('map-data');
            if (mapDataElement && mapDataElement.dataset.listing) {
                try {
                    const listingData = JSON.parse(mapDataElement.dataset.listing);
                    window.initShowMap(listingData);
                } catch(e) {
                    console.error('Failed to parse listing data', e);
                }
            }
        });
    }
    
    console.log('map.js loaded');
})();