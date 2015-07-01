//'use strict';

var map; // sole global variable
//var mapCenter;
/**
* This is viewModel that interfaces with the view in index.html
*/
function neighborhoodMapViewModel() {
	var self = this;
	var service;
	var googleinfowin;
	var foursquareData = [];
	var kapahulu;

	// These variables help keep track of the visible markers and list of venues
	self.pins = ko.observableArray();
	self.query = ko.observable('');
	/**
	* The sole model in this application -- the Pin class. It is based on code from
	* http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
	*/
	var Pin = function(map, gname, lat, lon, fsid, pos) {
		var self = this;
		var marker;
		// The observables below are bound to the list in the view
		self.fsqid = ko.observable(fsid);
		self.googlename = ko.observable(gname);
		self.lat  = ko.observable(lat);
		self.lon  = ko.observable(lon);

		marker = new google.maps.Marker({
			icon: 'img/red-dot.png',
			position: pos
		});
		self.marker = ko.observable(marker);
		self.isVisible = ko.observable(false);

		self.isVisible.subscribe(function(currentState) {
			if (currentState) {
				marker.setMap(map);
			} else {
				marker.setMap(null);
			}
		});
		self.isVisible(true);

		// This adds the click listeners on each of the pin markers on the map
		google.maps.event.addListener(marker, 'click', function() {
			var fsdata = getFoursquareFromArray(fsid);
//			var tbounds = bounds;
			map.panTo(pos);
//			tbounds.extend(marker.position);
//			map.fitBounds(marker.position);
//			mapCenter = map.setCenter(pos);
//			map.setCenter(marker.position);
			prepareInfowin(gname,marker,fsdata);
		});
	};
	/**
	* This function prepares the infowindow's presentation both in the pins and the list.
	* It is possible to separate the styling of the infowindow if need be.
	*/
	function prepareInfowin(gname,marker,fsdata) {
		var fsqinfodetail = fsdata[1] + '<br>' + fsdata[2] + '<br>' + fsdata[3] + '<br>Rating: ' + fsdata[4] + '<br>URL: ' + fsdata[5];
		var googleinfowintext = '<strong>' + gname + '</strong>' + '<hr>FOURSQUARE Info:<br>' + fsqinfodetail;
		if (googleinfowin) googleinfowin.close();
		var infowindowDiv = document.createElement('div');
		infowindowDiv.className = "googleinfowindow";
		infowindowDiv.innerHTML = googleinfowintext;
		googleinfowin.setContent(infowindowDiv);
		googleinfowin.open(map, marker);
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){marker.setAnimation(null);}, 1000);
	}
	/**
	* The CenterControl adds a control to the map that recenters the map on Neighborhood.
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
		// Setup the click event listener to reset the map to kapahulu
		google.maps.event.addDomListener(controlUI, 'click', function() {
			map.setCenter(kapahulu);
			map.setZoom(16);
			if (googleinfowin) googleinfowin.close();
			self.query('');
		});
	}
	/*
	Loads the map as well as position the search bar and list, populates more markers. Zoom level 0-19; 0 for a planetary view and 19 to a very local view
	*/
	self.list = document.getElementById('list');
	var input = document.getElementById('pac-input');
	var mapDiv = document.getElementById('map-canvas');

	function initialize() {
		// Kapahulu area's latitude and longitude
		var latitude = kapalatitude;
		var longitude = kapalongitude;
		kapahulu = new google.maps.LatLng(latitude, longitude);
		var mapOptions = {
			zoom: 16, maxZoom: 16, minZoom: 10,
			center: kapahulu,
			disableDefaultUI: true,
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.RIGHT_TOP
			},
			scaleControl: true,
			streetViewControl: true,
			streetViewControlOptions: {
				position: google.maps.ControlPosition.RIGHT_TOP
			}
		};
		map = new google.maps.Map(mapDiv, mapOptions);
		getGooglePlaces();
		// Create the DIV to hold the control and call the CenterControl() constructor
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
		map.controls[google.maps.ControlPosition.LEFT_TOP].push(self.list);

		var centerControlDiv = document.createElement('div');
		var centerControl = new CenterControl(centerControlDiv, map);
		centerControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
//		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

		// Handles an event where Google Maps takes too long to load
		var timer = window.setTimeout(failedToLoad, 8000);
		google.maps.event.addListener(map, 'tilesloaded', function() {
			window.clearTimeout(timer);
		});
		google.maps.event.addListener(map, 'click', function() {
			googleinfowin.close();
		});
//		mapCenter = map.getCenter();
//		calculateCenter();
	}
	// Posts a message to let user know when Google Maps fails to load.
	function failedToLoad() {
		$('#map-canvas').html("<h1>Google Maps Failed to Load. Please try reloading the page.</h1>");
	}
	/**
	*  This interfaces to bound pin markers in view helping the Pin model to show or hide pins
	*  as user filters the location in search bar
	*/
	self.filterPins = ko.computed(function () {
			var search  = self.query().toLowerCase();
			return ko.utils.arrayFilter(self.pins(), function (pin) {
					var doesMatch = pin.googlename().toLowerCase().indexOf(search) >= 0;
					pin.isVisible(doesMatch);
					return doesMatch;
			});
	});
	/**
	*Loads the map as well as position the search bar and list, populates more markers.
	* Zoom level 0-19; 0 for a planetary view and 19 to a very local view
	* The function populates the map with markers with the helper data of
	* from googleplaces array
	*/
	function getGooglePlaces() {
		googleinfowin = new google.maps.InfoWindow({maxWidth:130});
		var bounds = new google.maps.LatLngBounds();
		var len = googleplaces.length;
		for(var i = 0; i < len; i++){
			var lat = googleplaces[i][0];
			var lon = googleplaces[i][1];
			var fsid = googleplaces[i][3];
			var gname = googleplaces[i][2];
			var pos = new google.maps.LatLng(lat,lon);
			var pin = new Pin(map, gname, lat, lon, fsid, pos);
			getFoursquareDetail(fsid);
			bounds.extend(pos);
//		map.fitBounds(bounds);
//		map.setCenter(bounds.getCenter());
			self.pins.push(pin);
		}
		map.fitBounds(bounds);
//		map.setCenter(bounds.getCenter());
	}

	function calculateCenter() {
	  mapCenter = map.getCenter();
	}
	/**
	* The async request to Foursquare: http://api.foursquare.com/v2/venues/VENUE_ID.
	* This is invoked as the map is being populated with pins.
	* Callback method is being used to assist with asynchronous fetch of data.
	* John at Udacity helped me with the syntax to make the callback work.
	* This venues/VENUE_ID requires the Foursquare ID as part of its URL. The other
	* parameters namely, v, m, and format are required for versioning and format return
	*/
	function getFoursquareDetail(fsid) {
		var foursquareURL = 'http://api.foursquare.com/v2/venues/' + fsid + '?oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare&format=json';
		$.getJSON(foursquareURL, function(data) {
				callbackFn(data,fsid);
		}).error(function(e){
				console.log('oops');
		});
	}
	// This callback pushes data to the foursquareData array which will be used at
	// on-click demand of Foursquare data
	function callbackFn(data,fsid) {
		var d = data.response.venue;
		foursquareData.push([fsid, d.contact.formattedPhone || " ", d.location.formattedAddress[0] || " ", d.location.formattedAddress[1] || " ", d.rating || " ", d.url || " "]);
	}
	/**
	* This is invoked to grab foursquare data from the array using the foursquare venue_id
	*/
	function getFoursquareFromArray(fsid) {
		var len = foursquareData.length;
		var result;
		for (var i = 0; i < len; i++ ) {
			if( foursquareData[i][0] === fsid ) {
				result = foursquareData[i];
				break;
			}
		}
		return result;
	}
	/**
	* This function will open infowindow of a venue clicked in the list.
	*/
	self.clickMarker = function(place) {
		var fsdata = getFoursquareFromArray(place.fsqid());
		var pos = new google.maps.LatLng(place.lat(), place.lon());

		map.panTo(pos);
//		calculateCenter();
//		mapCenter = map.setCenter(pos);
		prepareInfowin(place.googlename(),place.marker(),fsdata);
	};
	// The initialize function is invoked upon launching this application
//google.maps.event.addDomListener(window, 'load', initialize);
if (typeof google === 'object' && typeof google.maps === 'object') {
		// Google maps loaded
			google.maps.event.addDomListener(window, 'load', initialize);
} else {
		alert('oops');
}

//	window.mapBounds = new google.maps.LatLngBounds();
//	window.addEventListener('resize', function(e) {
//		map.fitBounds(mapBounds);
//		map.setCenter(window.mapBounds.getCenter());
//	});
//google.maps.event.addDomListener(self, 'idle', function() {
//  calculateCenter();
//});

google.maps.event.addDomListener(window, 'resize', function() {
	if (googleinfowin) googleinfowin.close();
	var center = map.getCenter();
	google.maps.event.trigger(map, "resize");
//		map.fitBounds(window.mapBounds);
		map.setCenter(center);
});
}

ko.applyBindings(new neighborhoodMapViewModel());
