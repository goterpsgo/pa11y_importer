var fs = require('fs');
var csv = require('csv-parser');
var createClient = require('pa11y-webservice-client-node');
var config = require('./config');
var client = createClient('http://' + config.webservice.host + ':' + config.webservice.port + '/');

// Read the CSV file.
fs.createReadStream('./data/pa11y-tasks.csv')
  .pipe(csv())
  .on('data', function(data) {
    // Create task.
    client.tasks.create({
      name: data.name,
      url: data.url,
      standard: data.standard,
      username: data.username,
      password: data.password
      // headers: {},
      // actions: [],
      // ignore: []
    }, function (error, task) {
      // Error and success handling.
      if (error) {
        console.error('Error:', error);
      }
      if (task) {
        console.log('Imported:', task.name);
      }
    });
  }).on('end', function () {
    console.log('All tasks imported!');
  });

