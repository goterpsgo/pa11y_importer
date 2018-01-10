'use strict';

var fs = require('fs');
var request = require('request');
var url = require('url');
var cheerio = require('cheerio');
var csv = require('csv-parser');
var json2csv = require('json2csv');

/**
 * Crawler for microsites. Collects all internal URLs it can find starting from a
 * base URL.
 *
 * queued: add if not exists
 * crawled: add if crawled
 * to pick URL to crawl, it loops through "queue", and skip ones found in "crawled"
 * {
 *   queue: [
 *     URL1,
 *     URL2,
 *     URL3
 *   ],
 *   crawled: [
 *     URL1,
 *     URL2
 *   ]
 * }
 */
function Crawler(baseUrl, abbreviation) {
  this.queue = [];
  this.crawled = [];
  this.baseUrl = baseUrl;
  this.abbreviation = abbreviation;
}

/**
 * Triggers the crawling actions.
 */
Crawler.prototype.startCrawl = function(callback) {
  var self = this;
  this.cb = callback;
  // Crawl base URL.
  this.crawl(self.baseUrl);
};

/**
 * Main crawler function.
 * 
 * Grabs all URLs from links on a page, places them in the queue, and triggers
 * crawlNext().
 */
Crawler.prototype.crawl = function(crawlUrl) {
  var self = this;
  // Crawl URL.
  console.log('Crawl: ' + crawlUrl);
  request(crawlUrl, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);
      var crawledUrl = '';
      $('a[href]').each(function(i, element) {
        // Create absolute paths.
        crawledUrl = url.resolve(crawlUrl, $(element).attr('href'));
        // Filter internal URLs, non-hash URLs.
        // You can add more restricions here if necessary.
        if (crawledUrl.indexOf(crawlUrl) === 0 && crawledUrl.indexOf('#') === -1) {
          // Push to queue if it isn't already in it.
          if (self.queue.indexOf(crawledUrl) === -1) {
            self.queue.push(crawledUrl);
          }
        }
      });
      // Add to crawled URLs list.
      self.crawled.push(crawlUrl);
      // Crawl next page.
      self.crawlNext();
    }
  });
};

/**
 * Crawl next URL from the queue.
 */
Crawler.prototype.crawlNext = function() {
  var self = this;
  var completed = true;
  // Loop over queued URLs.
  for (var i = 0; i < self.queue.length; i++) {
    // If URL in queue hasn't been crawled yet.
    if (self.crawled.indexOf(self.queue[i]) === -1 ) {
      self.crawl(self.queue[i]);
      completed = false;
      break;
    }
  }
  // Crawl completed.
  if (completed === true) {
    this.cb(self.crawled);
  }
};

/**
 * Create an iterator from an array.
 */
function makeIterator(array){
  var nextIndex = 0;
  return {
    next: function() {
      return nextIndex < array.length ? {value: array[nextIndex++], done: false} : {done: true};
    }
  };
}

/**
 * Read all microsites and iterate the crawler function over it.
 * 
 * The CSV file needs two columns: one named "url", containing the base URLs,
 * the second one named "abbreviation", which represents a unique identifier 
 * for the URL.
 */
var microsites = [];
fs.createReadStream('./data/microsites.csv')
  .pipe(csv())
  .on('data', function(data) {
    // Collect URLs
    microsites.push(data);
  }).on('end', function () {
    // Create iterator out of microsites array.
    var iterator = makeIterator(microsites);
    // Start crawling.
    crawlMicrosite(iterator);
  });

/**
 * Checks the iterator and triggers a microsite crawl.
 */
function crawlMicrosite(iterator) {
  // Crawl next microsite in iterator object.
  var microsite = iterator.next();
  if (microsite.done !== true) {

    var abbrCode = microsite.value.abbreviation.trim().replace(/\s+/g, '-').toLowerCase();
    // Check if file exists.
    fs.access('./data/microsite-' + abbrCode + '.csv', fs.F_OK, function(err) {
      if (err) {
        // if it doesn't exist, we can crawl.
        var crawler = new Crawler(microsite.value.url, microsite.value.abbreviation);
        crawler.startCrawl(function(results) {
          // Add to total URL collection.
          var urlCollection = [];
          for (var i = 0; i < results.length; i++) {
            urlCollection.push({
              'micrositeId': abbrCode,
              'baseurl': microsite.value.url,
              'url': results[i],
              'abbreviation': microsite.value.abbreviation
            });
          }
          // Store CSV.
          storeCSV(urlCollection, abbrCode);
          // Crawl next microsite.
          crawlMicrosite(iterator);
        });
      } else {
        // Move on if it isn't accessible.
        console.log('File exists. Skip crawling ' + microsite.value.url);
        crawlMicrosite(iterator);
      }
    });
  }
  else {
    console.log('All scraping done!');
  }
}

/**
 * Store crawl results in CSV file.
 */
function storeCSV(urlCollection, abbrCode) {
  var fields = ['baseurl', 'url', 'abbreviation'];
  var csvObject = json2csv({ data: urlCollection, fields: fields });
  fs.writeFile('./data/microsite-' + abbrCode + '.csv', csvObject, function(err) {
    if (err) throw err;
    console.log('File saved!');
  });
}

