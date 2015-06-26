## Neighborhood Map project

### Separation of Concerns
Although separation of concerns has already been intimated in previous projects -- from styling separation in project 1, JSON models in project 2, pseudo-classical object-orientation in project 3, and even in the optimization project with DOM manipulation in JS code --, it's not until project 5 in which it was explicit that the view and the controller be separated as illustrated in Ben Jaffe's JavaScript Design Patterns course.

The task was to use knockout to illustrate the MVVM principle in that we had to bind variables in the view which was manipulated in the viewModel JS code. My code starts with a Pin class which is basically the app's sole model which corresponds to google map markers in the view.

### Part 1

#### Getting started: Things done before optimization begins

1. Checked out the repository

1. Installed nodejs and npm

1. Installed bower (thru npm install -g within app folder) for web app dependencies;
  did bower init to create bower.json config and bower_components directory within app folder;
  used bower [...] --save to edit bower.json config

1. Installed knockout (thru bower) for JavaScript mvc framework. I did not have to use for this project but I wanted to practice use of bower for upcoming projects.

1. npm init within project folder
  used npm install [...] --save-dev to edit package.json config and install locally in project

1. installed GULP and gulp plugins npm install [...] --save-dev. This is to automate optimization process, e.g. image compression and minimification of CSS, JavaScript, and HTML files

#### Optimize PageSpeed Insights measurements

1. To inspect the site on your phone, you can run a local server
  ```bash
  $> cd /path/to/your-project-folder
  $> python -m SimpleHTTPServer 8080
  ```

1. Open a browser and visit localhost:8080

1. Download and install [ngrok](https://ngrok.com/) to make your local server accessible remotely.
  ``` bash
  $> cd /path/to/your-project-folder
  $> ngrok 8080
  ```


### Customization with Bootstrap
The portfolio was built on Twitter's <a href="http://getbootstrap.com/">Bootstrap</a> framework. All custom styles are in `dist/css/portfolio.css` in the portfolio repo.

* <a href="http://getbootstrap.com/css/">Bootstrap's CSS Classes</a>
* <a href="http://getbootstrap.com/components/">Bootstrap's Components</a>
