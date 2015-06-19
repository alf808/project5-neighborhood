function neighborhoodMapViewModel() {
	var self = this;
	var map;
	var service;
	var infowindow;
	var lat = 21.2790587;
	var lng = -157.81368810000004;
	var kapahulu = new google.maps.LatLng(lat, lng);
	var markersArray = [];
	self.pins = ko.observableArray([]);

	// array to hold info for knockout
	self.allPlaces = ko.observableArray([]);
	// self.pins = ko.observableArray([]);
	// string to hold foursquare information
	self.foursquareInfo = '';
	self.query = ko.observable('');

	self.filterPins = ko.computed(function () {
		var search  = self.query().toLowerCase();

		return ko.utils.arrayFilter(self.pins(), function (pin) {
			var doesMatch = pin.name().toLowerCase().indexOf(search) >= 0;

			pin.isVisible(doesMatch);

			return doesMatch;
		});
	});


	// Finds the center of the map to get lat and lng values
	function computeCenter() {
		var latAndLng = map.getCenter();
		lat = latAndLng.lat();
		lng = latAndLng.lng();
	}

	/**
	* http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
	*/
	var Pin = function Pin(map, name, lat, lon, id, text) {
		var marker;

		this.name = ko.observable(name);
		this.lat  = ko.observable(lat);
		this.lon  = ko.observable(lon);
		this.text = ko.observable(text);

		marker = new google.maps.Marker({
			icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
			position: new google.maps.LatLng(lat, lon),
			place_id: id,
			animation: google.maps.Animation.DROP
		});

		this.isVisible = ko.observable(false);

		this.isVisible.subscribe(function(currentState) {
			if (currentState) {
				marker.setMap(map);
			} else {
				marker.setMap(null);
			}
		});

		this.isVisible(true);

		// var contentString = '<div style="font-weight: bold">' + name + '</div><br>' + self.foursquareInfo ;
		//
		// google.maps.event.addListener(marker, 'click', function() {
		// 	infowindow.setContent(contentString);
		// 	infowindow.open(map, this);
		// 	map.panTo(marker.position);
		// 	marker.setAnimation(google.maps.Animation.BOUNCE);
		// 	setTimeout(function(){marker.setAnimation(null);}, 1450);
		// });
		// markersArray.push(marker);
	};

	/**
	* The CenterControl adds a control to the map that recenters the map on Chicago.
	* This constructor takes the control DIV as an argument.
	* constructor
	*/
	function CenterControl(controlDiv, map) {

		// Set CSS for the control border
		var controlUI = document.createElement('div');
		controlUI.className = "reset-button";
		controlUI.title = 'Click to recenter the map';
		controlDiv.appendChild(controlUI);

		// Set CSS for the control interior
		var controlText = document.createElement('div');
		controlText.className = "reset-button-text";
		controlText.innerHTML = 'Center Map';
		controlUI.appendChild(controlText);

		// Setup the click event listeners: simply set the map to kapahulu
		google.maps.event.addDomListener(controlUI, 'click', function() {
			map.setCenter(kapahulu);
		});

	}

	/*
	Loads the map as well as position the search bar and list.	On a search, clearMarkers removes all markers already on the map and removes all info in allPlaces.	Then, once a search is complete, populates more markers and sends the info to getAllPlaces to populate allPlaces again. Zoom level 0-19; 0 for a planetary view and 19 to a very local view
	*/
	var mapDiv = document.getElementById('map-canvas');
	var mapOptions = {
		zoom: 13,
		maxZoom: 18,
		minZoom: 9,
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
		getPlaces();
		//		map.setCenter(kapahulu);
		computeCenter();
		self.getFoursquareInfo();


		// Create the DIV to hold the control and
		// call the CenterControl() constructor passing
		// in this DIV.
		var centerControlDiv = document.createElement('div');
		var centerControl = new CenterControl(centerControlDiv, map);

		centerControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(centerControlDiv);

		var list = (document.getElementById('list'));
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(list);
		var input = (document.getElementById('pac-input'));
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);


		// added defaultBounds to searchbox
		var searchBox = new google.maps.places.SearchBox(
			(input));
			google.maps.event.addListener(searchBox, 'places_changed', function() {
				var places = searchBox.getPlaces();
				clearMarkers();
				self.allPlaces.removeAll();
				var bounds = new google.maps.LatLngBounds();


				for(var i=0, place; i<10; i++){
					if (places[i] !== undefined){
						place = places[i];

						// getAllPlaces(place);
						// createMarker(place);
						var pin = new Pin(map, place.name, place.geometry.location.lat(), place.geometry.location.lng(), place.place_id, place.text);
						bounds.extend(place.geometry.location);
					}
				}
				map.fitBounds(bounds);
				computeCenter();
			});
			google.maps.event.addListener(map, 'bounds_changed', function(){
				var bounds = map.getBounds();
				searchBox.setBounds(bounds);
			});
			// Handles an event where Google Maps taks too long to load
			var timer = window.setTimeout(failedToLoad, 5000);
			google.maps.event.addListener(map, 'tilesloaded', function() {
				window.clearTimeout(timer);
			});
		}
		// end of initialize
		//
		//
		//  self.query = ko.observable('');
		// self.filterPins = ko.computed(function () {
		//     var search  = self.query().toLowerCase();
		//
		//     return ko.utils.arrayFilter(self.pins(), function (pin) {
		//         var doesMatch = pin.name().toLowerCase().indexOf(search) >= 0;
		//
		//         pin.isVisible(doesMatch);
		//
		//         return doesMatch;
		//     });
		// });

		// Will let the user know when Google Maps fails to load.
		function failedToLoad() {
			$('#map-canvas').html("<h1>Google Maps Failed to Load. Please try reloading the page.</h1>");
		}

		/*
		Function to pre-populate the map with place types.	nearbySearch retuns up to 20 places.
		*/
		function getPlaces() {
			var request1 = {
				location: kapahulu,
				radius: 700,
				types: ['meal_takeaway', 'restaurant', 'bar', 'cafe', 'food'],
				//				rankBy: 'DISTANCE'
			};

			var request2 = {
				location: kapahulu,
				radius: 700,
				types: ['meal_takeaway', 'restaurant', 'bar', 'cafe', 'food'],
				query: 'restaurant'
			};

			infowindow = new google.maps.InfoWindow();
			service = new google.maps.places.PlacesService(map);
			service.nearbySearch(request1, callback);
			service.textSearch(request2, callback);
		}

		/*
		Gets the callback from Google and creates a marker for each place.	Sends info to getAllPlaces.
		*/
		function callback(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				bounds = new google.maps.LatLngBounds();
				results.forEach(function (place){
					// place.marker = createMarker(place);
					// createMarker(place);
					var latitude = place.geometry.location.lat();
					var longitude = place.geometry.location.lng();

					var pin = new Pin(map, place.name, latitude, longitude, place.place_id, place.text);
					bounds.extend(new google.maps.LatLng(latitude,longitude));
				});
				map.fitBounds(bounds);
				results.forEach(getAllPlaces);
			}
		}

		/*
		Function to create a marker at each place.	This is called on load of the map with the pre-populated list, and also after each search.	Also sets the content of each place's infowindow.
		*/
		function createMarker(place) {
			var latitude = place.geometry.location.lat();
			var longitude = place.geometry.location.lng();
			var pin = new Pin(map, place.name, latitude, longitude, place.place_id, place.text);
			// var marker = new google.maps.Marker({
			// 	map: map,
			// 	icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
			// 	name: place.name.toLowerCase(),
			// 	position: place.geometry.location,
			// 	place_id: place.place_id,
			// 	animation: google.maps.Animation.DROP
			// });
			var address;
			if (place.vicinity !== undefined) {
				address = place.vicinity;
			} else if (place.formatted_address !== undefined) {
				address = place.formatted_address;
			}
			var contentString = '<div style="font-weight: bold">' + place.name + '</div><br>' + address + '<br>' + self.foursquareInfo ;

			// google.maps.event.addListener(marker, 'click', function() {
			// 	infowindow.setContent(contentString);
			// 	infowindow.open(map, this);
			// 	map.panTo(marker.position);
			// 	marker.setAnimation(google.maps.Animation.BOUNCE);
			// 	setTimeout(function(){marker.setAnimation(null);}, 1450);
			// });
			pins.push(pin);
			// markersArray.push(marker);
			// return marker;
		}


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

		this.getFoursquareInfo = asyncComputed(function() {
			// creats our foursquare URL

			var foursquareURL = 'http://api.foursquare.com/v2/venues/search?ll=' +lat+ ',' +lng+ '&oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare';

			return $.getJSON(foursquareURL, {
				format: "json"
			});
		}, this);


		/*
		Function that will pan to the position and open an info window of an item clicked in the list.
		*/
		self.clickMarker = function(place) {
			var marker;

			for(var e = 0; e < markersArray.length; e++) {
				if(place.place_id === markersArray[e].place_id) {
					marker = markersArray[e];
					break;
				}
			}
			// self.getFoursquareInfo(place);
			// self.getFoursquareInfo();
			map.panTo(marker.position);



			var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + self.foursquareInfo;
			infowindow.setContent(contentString);
			infowindow.open(map, marker);
			marker.setAnimation(google.maps.Animation.DROP);

		};


		/*
		function that gets the information from all the places that we are going to search and also pre-populate.	Pushes this info to the allPlaces array for knockout.
		*/
		function getAllPlaces(place){
			var myPlace = {};
			myPlace.place_id = place.place_id;
			myPlace.position = place.geometry.location.toString();
			myPlace.name = place.name;

			var address;
			if (place.vicinity !== undefined) {
				address = place.vicinity;
			} else if (place.formatted_address !== undefined) {
				address = place.formatted_address;
			}
			myPlace.address = address;

			self.pins = [

			];
			self.allPlaces.push(myPlace);
		}


		/*
		called after a search, this function clears any markers in the markersArray so that we can start with fresh map with new markers.
		*/
		function clearMarkers() {
			for (var i = 0; i < markersArray.length; i++ ) {
				markersArray[i].setMap(null);
			}
			markersArray.length = 0;
		}

		google.maps.event.addDomListener(window, 'load', initialize);
	}

	// $(function(){
	ko.applyBindings(new neighborhoodMapViewModel());
	// });
