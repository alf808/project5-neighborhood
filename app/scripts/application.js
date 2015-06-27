var map;
var googleinfowin;
// var fsqinfodetail;
var foursquareData = [];

/**
* The basis of this code is the Pin class below. It is based on code below
* http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
*/
var Pin = function(map, gname, lat, lon, fsqid, idx) {
	var fsqinfodetail;
	// Function below is used to help the asynchronous fetch of Foursquare data.
	// function callbackFn(data) {
	// 		// fsqinfodetail = data.response.venue.name;
	// 	var d = data.response.venue;
	// 	fsqinfodetail = d.contact.formattedPhone + '<br>' + d.location.formattedAddress[0] + '<br>' + d.location.formattedAddress[1] + '<br>Rating: ' + d.rating + '<br>' + d.url;
	// }

	var self = this;
	var marker;
	// self.fsqid = ko.observable(fsqid);
	self.googlename = ko.observable(gname);
	self.lat  = ko.observable(lat);
	self.lon  = ko.observable(lon);
	self.idx = ko.observable(idx);

	marker = new google.maps.Marker({
		icon: 'img/red-dot.png',
		position: new google.maps.LatLng(lat, lon)
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

	/**
	* The IFFE is immediately invoked as a pin object is instantiated. It fetches
	* information on the on a specific Foursquare venue.
	*/
	(function() {
		var foursquareURL = 'http://api.foursquare.com/v2/venues/' + fsqid + '?oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare&format=json';
	  $.getJSON(foursquareURL, function(data) {
	    callbackFn(data,idx);
	  }).error(function(e){
	    console.log('oops');
	  });
	})();

	// Function below is used to help the asynchronous fetch of Foursquare data.
	function callbackFn(data,idx) {
		var d = data.response.venue;
		var phone = d.contact.formattedPhone || " ";
		var street = d.location.formattedAddress[0] || " ";
		var city = d.location.formattedAddress[1] || " ";
		var rate = d.rating || " ";
		var u = d.url || " ";
		fsqinfodetail = phone + '<br>' + street + '<br>' + city + '<br>Rating: ' + rate + '<br>' + u;
		var tarray = [phone, street, city, rate, u];
		console.log(tarray);
		foursquareData.push(tarray);
	}

	// createMarker
	// NEED TO DO CLICK LISTENER HERE BUT VIOLATES dry . I wrote this below too
	google.maps.event.addListener(marker, 'click', function() {
		var googleinfowintext = gname + '<br>Foursquare Info:<br>' + fsqinfodetail;
		// console.log(gname + ' ' + fsqid);
		if (googleinfowin) googleinfowin.close();
		googleinfowin.setContent(googleinfowintext);
		googleinfowin.open(map, marker);
		map.panTo(marker.position);
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){marker.setAnimation(null);}, 1000);
	});

};

function neighborhoodMapViewModel() {
	var self = this;
	var service;
	var fsqinfodetail;

	// kapahulu area's latitude and longitude
	var latitude = 21.2790587;
	var longitude = -157.81368810000004;
	var kapahulu = new google.maps.LatLng(latitude, longitude);

	// array to hold info for knockout
	self.pins = ko.observableArray([]);
	self.query = ko.observable('');
	// self.googleinfowintext = '';

	// string to hold foursquare information
	self.foursquareInfo = '';
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
	var mapOptions = {
		zoom: 16, maxZoom: 16, minZoom: 10,
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
		getGooglePlaces();
		// Create the DIV to hold the control and call the CenterControl() constructor
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(self.list);

		var centerControlDiv = document.createElement('div');
		var centerControl = new CenterControl(centerControlDiv, map);
		centerControlDiv.index = 1;
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

		// Handles an event where Google Maps takes too long to load
		var timer = window.setTimeout(failedToLoad, 8000);
		google.maps.event.addListener(map, 'tilesloaded', function() {
			window.clearTimeout(timer);
		});
		google.maps.event.addListener(map, 'click', function() {
			googleinfowin.close();
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
					var doesMatch = pin.googlename().toLowerCase().indexOf(search) >= 0;
					pin.isVisible(doesMatch);
					return doesMatch;
			});
	});
	/*
	Function to pre-populate the map -- nearbySearch retuns up to 20 places.
	*/
	function getGooglePlaces() {
		googleinfowin = new google.maps.InfoWindow();
		var bounds = window.mapBounds;

		for(var i = 0; i < googleplaces.length; i++){
			var lat = googleplaces[i][0];
			var lon = googleplaces[i][1];
			var fsqid = googleplaces[i][3];
			var gname = googleplaces[i][2];
			var pin = new Pin(map, gname, lat, lon, fsqid, i);
			bounds.extend(new google.maps.LatLng(latitude,longitude));
			self.pins.push(pin);
		}
		map.fitBounds(bounds);
		map.setCenter(bounds.getCenter());
	}

// SPECIFIC VENUE INFO: http://api.foursquare.com/v2/venues/VENUE_ID
	function getFoursquareDetail(fsid) {
		var d = foursquareData[fsid];
		// var foursquareURL = 'http://api.foursquare.com/v2/venues/' + fsid + '?oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare&format=json';
		// $.getJSON(foursquareURL, function(data) {
		// 		callbackFn2(data);
		// }).error(function(e){
		// 		console.log('oops');
		// });
		fsqinfodetail = d[0] + '<br>' + d[1] + '<br>' + d[2] + '<br>' + d[3] + '<br>' + d[4];
	}
	// function callbackFn2(data) {
	// 		var d = data.response.venue;
	// 		fsqinfodetail = d.contact.formattedPhone + '<br>' + d.location.formattedAddress[0] + '<br>' + d.location.formattedAddress[1] + '<br>Rating: ' + d.rating + '<br>' + d.url;
	// }
	/*
	Function that will open info window of an item clicked in the list.
	*/
	self.clickMarker = function(place) {
		getFoursquareDetail(place.idx());
		var pos = new google.maps.LatLng(place.lat(), place.lon());
		var marker = place.marker();

		map.panTo(pos);
		if (googleinfowin) googleinfowin.close();
		// wait for a few milliseconds to get info from foursquare.
		setTimeout(function() {
			var googleinfowintext = place.googlename() + '<br>Foursquare Info:<br>' + fsqinfodetail;
			var infowindowDiv = document.createElement('div');
			infowindowDiv.innerHTML = googleinfowintext;
			googleinfowin.setContent(infowindowDiv);
			googleinfowin.open(map, marker);
			marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){marker.setAnimation(null);}, 1000);
		}, 500);

	};
	google.maps.event.addDomListener(window, 'load', initialize);
	window.mapBounds = new google.maps.LatLngBounds();
	// map.setZoom(16);
	window.addEventListener('resize', function(e) {
		map.fitBounds(mapBounds);
		// map.setCenter(kapahulu);
	});
}

ko.applyBindings(new neighborhoodMapViewModel());
