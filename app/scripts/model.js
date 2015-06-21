var map;
var infowindow;

function neighborhoodMapViewModel() {
	var self = this;
	var service;

	// kapahulu area's latitude and longitude
	var lat = 21.2790587;
	var lng = -157.81368810000004;
	var kapahulu = new google.maps.LatLng(lat, lng);

	// array to hold info for knockout
	// var markersIdArray = [];
	self.pins = ko.observableArray([]);
	self.query = ko.observable('');

	// string to hold foursquare information
	self.foursquareInfo = '';

	/**
	* http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
	*/
	var Pin = function Pin(map, name, lat, lon, id, text) {
		var marker;

		this.name = ko.observable(name);
		this.lat  = ko.observable(lat);
		this.lon  = ko.observable(lon);
		this.text = ko.observable(text);
		this.fsqid = ko.observable('');

		marker = new google.maps.Marker({
			icon: 'img/red-dot.png',
			position: new google.maps.LatLng(lat, lon),
			place_id: id,
			animation: google.maps.Animation.DROP
		});
		this.marker = ko.observable(marker);
		this.isVisible = ko.observable(false);

		this.isVisible.subscribe(function(currentState) {
			if (currentState) {
				marker.setMap(map);
			} else {
				marker.setMap(null);
			}
		});
		this.isVisible(true);

		createMarker(marker,id,this);
		// Asynchronous fetching of 4square vicinity venues. First item will be fethched
		this.getFoursquareInfo = asyncComputed(function() {
			var foursquareURL = 'http://api.foursquare.com/v2/venues/search?ll=' +lat+ ',' +lon+ '&oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare';
			return $.getJSON(foursquareURL, {
				format: "json", limit: 1
			});
		}, this);
	};
	/**
	* This should help asynchronously execute functions. It will be used to fetch
	* some json objects. Code based on URL below
	* https://github.com/knockout/knockout/wiki/Asynchronous-Dependent-Observables
	*/
	function asyncComputed(evaluator, owner) {
		var result = ko.observable();

		ko.computed(function() {
			// Get the $.Deferred value, and then set up a callback
			evaluator.call(owner).done(result);
		});
		return result;
	}
	/**
	* The CenterControl adds a control to the map that recenters the map on Neighborhood.
	* This constructor takes the control DIV as an argument.
	*/
	function CenterControl(controlDiv, map) {

		// Set CSS for the control border and text
		var controlUI = document.createElement('div');
		controlUI.className = "reset-button";
		controlUI.title = 'Click to recenter the map';
		controlDiv.appendChild(controlUI);
		var controlText = document.createElement('div');
		controlText.className = "reset-button-text";
		controlText.innerHTML = 'Reset Kapahulu Map';
		controlUI.appendChild(controlText);

		// Setup the click event listener to simply reset the map to kapahulu
		google.maps.event.addDomListener(controlUI, 'click', function() {
			map.setCenter(kapahulu);
			map.setZoom(16);
			if (infowindow) infowindow.close();
			self.query('');
		});
	}

	/*
	Loads the map as well as position the search bar and list. On a search, clearMarkers removes all markers already on the map and removes all info in allPlaces. Then, once a search is complete, populates more markers and sends the info to getAllPlaces to populate allPlaces again. Zoom level 0-19; 0 for a planetary view and 19 to a very local view
	*/
	self.list = (document.getElementById('list'));
	var input = (document.getElementById('pac-input'));
	var mapDiv = document.getElementById('map-canvas');
	var mapOptions = {
		zoom: 16,
		maxZoom: 18,
		minZoom: 10,
		center: kapahulu,
		disableDefaultUI: true,
		zoomControl: true,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.LARGE,
			position: google.maps.ControlPosition.LEFT_TOP
		},
		scaleControl: true,
		streetViewControl: true,
		streetViewControlOptions: {
			position: google.maps.ControlPosition.LEFT_TOP
		}
	};

	function initialize() {

		map = new google.maps.Map(mapDiv, mapOptions);
		service = new google.maps.places.PlacesService(map);
		getPlaces();
		// Create the DIV to hold the control and call the CenterControl() constructor
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(self.list);

		var centerControlDiv = document.createElement('div');
		var centerControl = new CenterControl(centerControlDiv, map);
		centerControlDiv.index = 1;

		map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(centerControlDiv);
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

		// Handles an event where Google Maps takes too long to load
		var timer = window.setTimeout(failedToLoad, 8000);
		google.maps.event.addListener(map, 'tilesloaded', function() {
			window.clearTimeout(timer);
		});
	}
	// Posts a message to let user know when Google Maps fails to load.
	function failedToLoad() {
		$('#map-canvas').html("<h1>Google Maps Failed to Load. Please try reloading the page.</h1>");
	}
	// This interfaces to bound pin markers in view
	self.filterPins = ko.computed(function () {
			var search  = self.query().toLowerCase();

			return ko.utils.arrayFilter(self.pins(), function (pin) {
					var doesMatch = pin.name().toLowerCase().indexOf(search) >= 0;

					pin.isVisible(doesMatch);

					return doesMatch;
			});
	});
	/*
	Function to pre-populate the map -- nearbySearch retuns up to 20 places.
	*/
	function getPlaces() {
		var request = {
			location: kapahulu,
			radius: 500,
			types: ['restaurant', 'cafe', 'food'],
		};

		infowindow = new google.maps.InfoWindow();
		service.nearbySearch(request, callback);
	}
	/*
	Gets the callback from Google and creates a Pin marker for each place.
	*/
	function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			// bounds = new google.maps.LatLngBounds();
			results.forEach(function (place){
				var latitude = place.geometry.location.lat();
				var longitude = place.geometry.location.lng();

				var pin = new Pin(map, place.name, latitude, longitude, place.place_id, place.text);
				// bounds.extend(new google.maps.LatLng(latitude,longitude));
				self.pins.push(pin);
			});

			// console.log(results);
			// map.fitBounds(bounds);
		}
	}
	/*
	Function to create a marker at each place. This is called on load of the map with the pre-populated list, and also after each search. Also sets the content of each place's infowindow.
	*/
	function createMarker(marker,id,place) {
	// var address;
	// if (place.vicinity !== undefined) {
	// 	address = place.vicinity;
	// } else if (place.formatted_address !== undefined) {
	// 	address = place.formatted_address;
	// }
	// var contentString = '<div style="font-weight: bold">' + place.name() + '</div><br>' + 'address' + '<br>' + self.foursquareInfo ;

	var contentString = place.name();

	google.maps.event.addListener(marker, 'click', function() {
		if (infowindow) infowindow.close();
		infowindow.setContent(contentString);
		infowindow.open(map, marker);
		map.panTo(marker.position);
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){marker.setAnimation(null);}, 1000);
	});
	}
	/*
	Function that will pan to the position and open an info window of an item clicked in the list.
	*/
	self.clickMarker = function(place) {
		var pos = new google.maps.LatLng(place.lat(), place.lon());
		var getFoursquareInfoDetail;
		var marker = place.marker();
		var contentString = '<div style="font-weight: bold">' + place.name() + '</div>';
		infowindow.setContent(contentString);
		infowindow.open(map, marker);
		map.panTo(pos);
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){marker.setAnimation(null);}, 1000);

		var tempid = place.getFoursquareInfo().response.venues[0].id;

		var foursquareURL = 'http://api.foursquare.com/v2/venues/' +tempid+  '?oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare';
		$.getJSON(foursquareURL, function(data) {
			var detail = data.response.venue;
			console.log('yeah '+ detail.name);
		}).error(function(e){
			console.log('oops');
		});
	};

	google.maps.event.addDomListener(window, 'load', initialize);
}

ko.applyBindings(new neighborhoodMapViewModel());
