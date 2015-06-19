function appOctopus() {
	var self = this;
	var map;
	var service;
	var infowindow;
	var lat = '21.2790587';
	var lng = '-157.81368810000004';
	var kapahulu = new google.maps.LatLng(21.2790587, -157.81368810000004);
	// waikiki zoo to begin of st louis heights/waialae
	// var defaultBounds = new google.maps.LatLngBounds(
	//	 new google.maps.LatLng(21.271141, -157.821438),
	//	 new google.maps.LatLng(21.289385, -157.811301));
	var markersArray = [];

	// array to hold info for knockout
	self.allPlaces = ko.observableArray([]);

	// string to hold foursquare information
	self.foursquareInfo = '';

	// Finds the center of the map to get lat and lng values
	function computeCenter() {
		var latAndLng = map.getCenter();
		lat = latAndLng.lat();
		lng = latAndLng.lng();
	}

	/**
	* The CenterControl adds a control to the map that recenters the map on Chicago.
	* This constructor takes the control DIV as an argument.
	* constructor
	*/
	function CenterControl(controlDiv, map) {

		// Set CSS for the control border
		var controlUI = document.createElement('div');
		controlUI.style.backgroundColor = 'yellow';
		controlUI.style.border = '2px solid #fff';
		controlUI.style.borderRadius = '3px';
		controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		controlUI.style.cursor = 'pointer';
		controlUI.style.marginBottom = '22px';
		controlUI.style.marginLeft = '5px';
		controlUI.style.textAlign = 'center';
		controlUI.title = 'Click to recenter the map';
		controlDiv.appendChild(controlUI);

		// Set CSS for the control interior
		var controlText = document.createElement('div');
		controlText.style.color = 'rgb(25,25,25)';
		controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
		controlText.style.fontSize = '16px';
		controlText.style.lineHeight = '38px';
		controlText.style.paddingLeft = '5px';
		controlText.style.paddingRight = '5px';
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
	function initialize() {
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

						getAllPlaces(place);
						createMarker(place);
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
		// Will let the user know when Google Maps fails to load.
		function failedToLoad() {
			$('#map-canvas').html("<h1>Google Maps Failed to Load. Please try reloading the page.</h1>");
		}

		/*
		Function to pre-populate the map with place types.	nearbySearch retuns up to 20 places.
		*/
		function getPlaces() {
			var request = {
				location: kapahulu,
				radius: 700,
				types: ['meal_takeaway', 'restaurant', 'bar', 'cafe', 'food']
			};

			infowindow = new google.maps.InfoWindow();
			service = new google.maps.places.PlacesService(map);
			service.nearbySearch(request, callback);
		}

		/*
		Gets the callback from Google and creates a marker for each place.	Sends info to getAllPlaces.
		*/
		function callback(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				bounds = new google.maps.LatLngBounds();
				results.forEach(function (place){
					place.marker = createMarker(place);
					bounds.extend(new google.maps.LatLng(
						place.geometry.location.lat(),
						place.geometry.location.lng()));
					});
					map.fitBounds(bounds);
					results.forEach(getAllPlaces);
				}
			}

			/*
			Function to create a marker at each place.	This is called on load of the map with the pre-populated list, and also after each search.	Also sets the content of each place's infowindow.
			*/
			function createMarker(place) {
				var marker = new google.maps.Marker({
					map: map,
					icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
					name: place.name.toLowerCase(),
					position: place.geometry.location,
					place_id: place.place_id,
					animation: google.maps.Animation.DROP
				});
				var address;
				if (place.vicinity !== undefined) {
					address = place.vicinity;
				} else if (place.formatted_address !== undefined) {
					address = place.formatted_address;
				}
				var contentString = '<div style="font-weight: bold">' + place.name + '</div><br>' + address + '<br>' + self.foursquareInfo ;

				google.maps.event.addListener(marker, 'click', function() {
					infowindow.setContent(contentString);
					infowindow.open(map, this);
					map.panTo(marker.position);
					marker.setAnimation(google.maps.Animation.BOUNCE);
					setTimeout(function(){marker.setAnimation(null);}, 1450);
				});

				markersArray.push(marker);
				return marker;
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

		$(function(){
			ko.applyBindings(new appOctopus());
		});
