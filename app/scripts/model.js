var map;
// var fsidArray = [];
var googleinfowin;

var googleplaces = [
[21.275936,-157.814551,'Rainbow Drive-In','4b058655f964a520ea5c22e3'],
[21.280072,-157.814183,'Ono Hawaiian Foods','4b058653f964a5208e5c22e3'],
[21.27885,-157.814144,'Side Street Inn','4c4a6bd8c668e21e95f898f8'],
[21.2786,-157.81370000000004,'Papa John\'s Pizza','4bbabd8653649c74406a49fb'],
[21.277741,-157.813856,'Uncle Bo\'s Pupu Bar & Grill','4b058656f964a5206a5d22e3'],
[21.281801,-157.81444699999997,'Haili\'s Hawaiian Food','4b36d86bf964a520543d25e3'],
[21.281342,-157.814256,'Yakitori Glad Hawaii','4f24fe9de4b0d10db11500b2'],
[21.279026,-157.81379100000004,'Starbucks Coffee','4b05fccbf964a520fae622e3'],
[21.280317,-157.81392,'Taco Bell','4d6dbaa732ab5941e5c680b9'],
[21.278312,-157.813671,'Zippy\'s Kapahulu','4aee4eaaf964a52077d321e3'],
[21.282899,-157.813576,'Waiola Shave Ice','4bb9276f3db7b713c110229a'],
[21.280828,-157.813852,'Ono Seafood Takeaway','4b902633f964a5209d7833e3'],
[21.279021,-157.813692,'Kozo Sushi','4bc7e89b8b7c9c742d6d37cf'],
[21.281363,-157.814347,'Pizza Hut','4b9f1fe0f964a520b51437e3'],
[21.278881,-157.813688,'Tenkaippin Hawaii','4b058656f964a520605d22e3'],
[21.277838,-157.81381999999996,'Irifune Restaurant','4b071fa2f964a520b2f722e3'],
[21.27691,-157.814208,'Sunrise Restaurant','4c1da836fcf8c9b6853aac0b']
];

var Pin = function(map, gname, lat, lon, fsqid) {
	(function() {
		var foursquareURL = 'http://api.foursquare.com/v2/venues/' + fsqid + '?oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare&format=json';
	  $.getJSON(foursquareURL, function(data) {
	    callbackFn(data);
	  }).error(function(e){
	    console.log('oops');
	  });
	})();

	function callbackFn(data) {
	    // console.log('yeah '+data.response.venues[0].name);
	    // fsidArray.push(data.response.venues[0].id);
			// console.log(data.response.venues[0].id);
			fsqinfodetail = data.response.venue.name;
	}

	var self = this;
	var marker;
	var fsqinfodetail;
	// self.getFoursquareInfo(lat, lon);
	self.fsqid = ko.observable(fsqid);
	self.googlename = ko.observable(gname);
	self.lat  = ko.observable(lat);
	self.lon  = ko.observable(lon);
	// self.fsqArrayPos = ko.observable(idx);

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
	// createMarker
	//
	// NEED TO DO CLICK LISTENER HERE BUT VIOLATES dry . I wrote this below too
	google.maps.event.addListener(marker, 'click', function() {
		var googleinfowintext = gname + '<br>4sq: ' + fsqinfodetail;
		console.log(gname + ' ' + fsqid);
		// var googleinfowintext = 'hello';
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
	* http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
	*/
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
		// var request = {
		// 	location: kapahulu,
		// 	radius: 500,
		// 	types: ['restaurant', 'cafe', 'food',],
		// };
		googleinfowin = new google.maps.InfoWindow();
		// service = new google.maps.places.PlacesService(map);
		// service.nearbySearch(request, callback);
		var bounds = window.mapBounds;

		for(var i = 0; i < googleplaces.length; i++){
			var lat = googleplaces[i][0];
			var lon = googleplaces[i][1];
			var fsqid = googleplaces[i][3];
			var gname = googleplaces[i][2];
			var pin = new Pin(map, gname, lat, lon, fsqid);
			bounds.extend(new google.maps.LatLng(latitude,longitude));
			self.pins.push(pin);
		}
		map.fitBounds(bounds);
		map.setCenter(bounds.getCenter());
	}

// SPECIFIC VENUE INFO: http://api.foursquare.com/v2/venues/VENUE_ID
	function getFoursquareDetail(fsid) {
		// console.log(fsidArray[pos]);
		var foursquareURL = 'http://api.foursquare.com/v2/venues/' + fsid + '?oauth_token=GQDPA05ROIS0UO5KO3YQEW4KGYBC2QOW1PCKD0HMQR5COFVH&v=20150830&m=foursquare&format=json';
		$.getJSON(foursquareURL, function(data) {
				callbackFn2(data);
		}).error(function(e){
				console.log('oops');
		});
	}
	function callbackFn2(data) {
			fsqinfodetail = data.response.venue.name;
	}
	/*
	Function that will open info window of an item clicked in the list.
	*/
	self.clickMarker = function(place) {
		getFoursquareDetail(place.fsqid());

		var pos = new google.maps.LatLng(place.lat(), place.lon());
		// var getFoursquareInfoDetail;
		var marker = place.marker();

		map.panTo(pos);
		if (googleinfowin) googleinfowin.close();
		// wait for a few milliseconds to get info from foursquare.
		setTimeout(function() {
			var googleinfowintext = place.googlename() + '<br>4sq: ' + place.fsqid();
			// console.log(place.googlename() + ' ' + place.fsqid());
			// var googleinfowintext = 'hello';
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
