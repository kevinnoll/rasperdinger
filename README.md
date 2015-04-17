# heimerdinger

heimerdinger is a small application that collects, persists, and visualizes data accessed through the League of Legends API using [d3.js](http://d3js.org/).

### Install
You will need at least node.js including [npm](https://nodejs.org/), and a running postgreSQL instance.
You can download postgreSQL [here](http://www.postgresql.org/download/). Create a postgreSQL instance at localhost, using the standard port 5433. You will need the database schema. You can download it using this [link](database_schema/thresh).

Clone this repository and go into its local directory. Heimerdinger will make use of your API KEY key to access the riot API. We recommend using a bash like the OSX Terminal (if you are using Windows, we recommend the git bash). Add your API KEY to your .bash_profile using the following command: 
```
  export API_KEY=<<YOUR_API_KEY>>
```
Run the following commands:
```
  npm install -g grunt-cli
  npm install -g bower
  npm install pg
  npm install basic-logger
  npm install
  bower install
```
Note taht if you are behind a corporate proxy, you need to configure this in bowers [.bowerrc-file](http://stackoverflow.com/questions/21750804/bower-calls-blocked-by-corporate-proxy)

After that, you should be able to start the server using the following command, which starts the backend server: 
```
node src/server/server.js
```
If it is up and running, you can start the client, which connects to the backend and retrieves data through it:
```
grunt serve
```
The client starts your browser and shows the data. 
The experience is best using Google Chrome. Especially the Internet Explorer does not work properly with SVG.

# See it in action

We recorded a little video to show you the core features. Have fun watching! :)
https://drive.google.com/file/d/0B8FVKcbZXBvkaUtGM3cxek0tWlE/view?usp=sharing

# Further Information

We are using [Grunt](http://gruntjs.com/) to run tasks like [grunt-watch](https://github.com/gruntjs/grunt-contrib-watch), [grunt-connect](https://github.com/gruntjs/grunt-contrib-connect), [grunt-wiredep](https://github.com/stephenplusplus/grunt-wiredep). 
Furthermore we make use of [Bower](http://bower.io/) to keep the App clean from imported libraries.

CSS and page styling stuff is done using [Bootstrap](http://getbootstrap.com/).

Our backend is a simple Node Connect server using [http](https://nodejs.org/api/http.html).

Visualizations are done with the really great library [D3](http://d3js.org/).

We had tons of fun creating this project, I hope you enjoy it aswell! :)
