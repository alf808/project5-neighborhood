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

	// Finds the center of the map to get lat and lng values
	// function computeCenter() {
	// 	var latAndLng = map.getCenter();
	// 	lat = latAndLng.lat();
	// 	lng = latAndLng.lng();
	// }
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

		this.getFoursquareInfo = asyncComputed(function() {
			// creates our foursquare URL

			var foursquareURL = 'http://api.foursquare.com/v2/venues/search?ll=' +lat+ ',' +lon+ '&oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare';

			return $.getJSON(foursquareURL, {
				format: "json", limit: 1
			});
		}, this);

		this.fsqid = this.getFoursquareInfo.response.venues[0].id;
	};

	/**
	* This should asynchronously fetch json from 4square
	* https://github.com/knockout/knockout/wiki/Asynchronous-Dependent-Observables
	*/
	function asyncComputed(evaluator, owner) {
		var result = ko.observable();

		ko.computed(function() {
			// Get the $.Deferred value, and then set up a callback so that when it's done,
			// the output is transferred onto our "result" observable
			evaluator.call(owner).done(result);
		});

		return result;
	}

	// this.getFoursquareInfo = asyncComputed(function() {
	// 	// creats our foursquare URL
	//
	// 	var foursquareURL = 'http://api.foursquare.com/v2/venues/search?ll=' +lat+ ',' +lng+ '&oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare';
	//
	// 	return $.getJSON(foursquareURL, {
	// 		format: "json"
	// 	});
	// }, this);

	/**
	* The CenterControl adds a control to the map that recenters the map on Neighborhood.
	* This constructor takes the control DIV as an argument.
	* constructor
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

		// Setup the click event listeners: simply reset the map to kapahulu
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
		// self.getFoursquareInfo();
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

	// This interfaces to bound values in view
	// self.query = ko.observable('');
	self.filterPins = ko.computed(function () {
			var search  = self.query().toLowerCase();

			return ko.utils.arrayFilter(self.pins(), function (pin) {
					var doesMatch = pin.name().toLowerCase().indexOf(search) >= 0;

					pin.isVisible(doesMatch);

					return doesMatch;
			});
	});
	/*
	Function to pre-populate the map with place types. nearbySearch retuns up to 20 places.
	*/
	function getPlaces() {
		var request1 = {
			location: kapahulu,
			radius: 500,
			types: ['restaurant', 'cafe', 'food'],
		};

		infowindow = new google.maps.InfoWindow();
		// service = new google.maps.places.PlacesService(map);
		service.nearbySearch(request1, callback);
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
				// getPlaceDetailInfo(place.place_id);
				// var placedetailURL = 'https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyCFkiiOKNiYCRYcVvH1pyINXrQ7dE6gmnU';
				//
				// $.getJSON(placedetailURL, {
				// 	placeid: place.place_id
				// });
			});

			// console.log(results);
			// console.log(https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyCFkiiOKNiYCRYcVvH1pyINXrQ7dE6gmnU&placeid=ChIJSanEMX9yAHwRYb7nn-OlbbU);
			// map.fitBounds(bounds);
		}
	}
	/**
	* This should asynchronously fetch json from place details
	* https://github.com/knockout/knockout/wiki/Asynchronous-Dependent-Observables
	*/
	// function asyncComputed(evaluator, owner) {
	// 	var result = ko.observable();
	//
	// 	ko.computed(function() {
	// 		// Get the $.Deferred value, and then set up a callback so that when it's done,
	// 		// the output is transferred onto our "result" observable
	// 		evaluator.call(owner).done(result);
	// 	});
	//
	// 	return result;
	// }
	//
	// this.getPlaceDetailInfo = asyncComputed(function() {
	// 	// creates our foursquare URL
	//
	// 	var placedetailURL = 'https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyCFkiiOKNiYCRYcVvH1pyINXrQ7dE6gmnU';
	//
	// 	return $.getJSON(placedetailURL, {
	// 		placeid: "ChIJSanEMX9yAHwRYb7nn-OlbbU"
	// 	});
	// }, this);

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

	// console.log(service.getDetails(id));

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
		// var marker;
		// var numMarkers = markersIdArray.length;
		var pos = new google.maps.LatLng(place.lat(), place.lon());
	// self.getFoursquareInfo(place);
	// self.getFoursquareInfo();
		var marker = place.marker();
		var contentString = '<div style="font-weight: bold">' + place.name() + '</div>';
		infowindow.setContent(contentString);
		infowindow.open(map, marker);
		map.panTo(pos);
	marker.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function(){marker.setAnimation(null);}, 1000);

	console.log(place.fsqid());
	};

	google.maps.event.addDomListener(window, 'load', initialize);
}

ko.applyBindings(new neighborhoodMapViewModel());
