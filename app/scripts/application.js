var map; // sole global variable
/**
* This is viewModel that interfaces with the view in index.html
*/
function neighborhoodMapViewModel() {
	var self = this;
	var service;
	var googleinfowin;
	var foursquareData = [];

	// Kapahulu area's latitude and longitude
	var latitude = 21.2790587;
	var longitude = -157.81368810000004;
	var kapahulu = new google.maps.LatLng(latitude, longitude);

	// These variables help keep track of the visible markers and list of venues
	self.pins = ko.observableArray([]);
	self.query = ko.observable('');
	/**
	* The sole model in this application -- the Pin class. It is based on code from
	* http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
	*/
	var Pin = function(map, gname, lat, lon, fsid) {
		var self = this;
		var marker;
		// The observables below are bound to the list in the view
		self.fsqid = ko.observable(fsid);
		self.googlename = ko.observable(gname);
		self.lat  = ko.observable(lat);
		self.lon  = ko.observable(lon);

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

		// This adds the click listeners on each of the pin markers on the map
		google.maps.event.addListener(marker, 'click', function() {
			var fsdata = getFoursquareFromArray(fsid);
			map.panTo(marker.position);
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
		googleinfowin = new google.maps.InfoWindow();
		var bounds = window.mapBounds;
		var len = googleplaces.length;
		for(var i = 0; i < len; i++){
			var lat = googleplaces[i][0];
			var lon = googleplaces[i][1];
			var fsid = googleplaces[i][3];
			var gname = googleplaces[i][2];
			var pin = new Pin(map, gname, lat, lon, fsid);
			getFoursquareDetail(fsid);
			bounds.extend(new google.maps.LatLng(latitude,longitude));
			self.pins.push(pin);
		}
		map.fitBounds(bounds);
		map.setCenter(bounds.getCenter());
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
		prepareInfowin(place.googlename(),place.marker(),fsdata);
	};
	// The initialize function is invoked upon launching this application
	google.maps.event.addDomListener(window, 'load', initialize);
	window.mapBounds = new google.maps.LatLngBounds();
	window.addEventListener('resize', function(e) {
		map.fitBounds(mapBounds);
	});
}

ko.applyBindings(new neighborhoodMapViewModel());
