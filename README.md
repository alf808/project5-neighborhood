## Neighborhood Map project

### Separation of Concerns

1. Although separation of concerns has already been intimated in previous projects -- from styling separation in project 1, JSON models in project 2, pseudo-classical object-orientation in project 3, and even in the optimization project with DOM manipulation in JS code --, it's not until project 5 in which it was explicit that the view and the controller be separated as illustrated in Ben Jaffe's JavaScript Design Patterns course.

1. The task was to use knockout to illustrate the MVVM principle in that we had to bind variables in the view which was manipulated in the viewModel. My code starts with a Pin class which is basically the application's sole model which corresponds to google map markers in the view.

1. There are some functions that could have been encapsulated in the Pin class as it was required in the OOP project. However scoping issues came up when I attempted to use the pseudo-classical OOP structure with prototypal methods when using Knockout. I need to do more research to accomplish this.

1. Google Map's InfoWindow does not lend itself easily to styling. It is possible to style it. I prepared my code to do a DOM manipulation in case it be required in the future to style InfoWindow more intricately.

### Functionality of the Neighborhood application

1. The application has the required components of a search bar, a list view and a Google map. The search bar has the feature to filter locations in the list view and the pin markers on the map. As user clicks on a pin marker or a venue name on the list, a Google InfoWindow pops up with Google and Foursquare data.

1. As the user loads the application, the Google markers are loaded both statically and dynamically. I initially coded the app with Google Map's Nearby Search (https://developers.google.com/maps/documentation/javascript/places#place_search_requests). I eventually discovered that the latitude and longitude do not match with those of Foursquare's. I used the code with Nearby Search to extract the latitude and longitude of venues in my vicinity. I then stored the location data in an array along with Foursquare venue IDs.

1. The Foursquare data is fetched using async requests to its venues/VENUE_ID API (https://developer.foursquare.com/docs/venues/venues). It is a no-nonsense straightforward API that only required an oauth_token. I used jQuery's getJSON method and a callback method so that while Foursquare data are being fetched asynchronously, the code can continue to execute.

1. There is one Reset control that recenters the map to my vicinity, clears the search bar, and places all the pin markers back to the original positions.

### Code base

#### This code used 3 sources for its basis

1. Pin class from http://stackoverflow.com/questions/29557938/removing-map-pin-with-search
1. Google map code from my Udacity Project 2 resume project.
1. Google's code at https://developers.google.com/maps/documentation/javascript/examples/control-custom

### Heavily Used Resources

* <a href="https://github.com/udacity/fend-office-hours/tree/master/Javascript%20Design%20Patterns">Udacity's Javascript Design Patterns documentation</a>
* <a href="https://developers.google.com/maps/documentation/javascript/">Google Maps JavaScript API</a>
* <a href="http://knockoutjs.com/documentation/introduction.html">Knockout JS Documentation</a>
* <a href="https://developer.foursquare.com/docs/">Foursquare's API docs</a>
* <a href="https://github.com/knockout/knockout/wiki/asynchronous-dependent-observables">An explanation of Asynchronous calls with Knockout</a>
* <a href="http://api.jquery.com/category/ajax/">jQuery's AJAX documentation</a>
* <a href="stackoverflow.com">Innumerable resources from stackoverflow.com</a>
* Udacity's AJAX course, Ben Jaffe's Javascript Design Patterns, an office hour with Udacity coach John on June 24 2015, and an appointment with Udacity coach John on June 25 2015.
