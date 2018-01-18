# pa11y_importer
This is a series of files to ease the import of multiple URLs and parameters/conditions into [Pa11y Dashboard](https://github.com/pa11y/pa11y-dashboard).

Scripts and files in this repo are based on content from [here](https://www.lullabot.com/articles/monitoring-web-accessibility-compliance-with-pa11y-dashboard).

## Setup
- [Install mongo](https://docs.mongodb.com/manual/installation/).
- Install [pa11y-dashboard](https://github.com/pa11y/pa11y-dashboard).
	- In the `config/` directory, use one of the sample files as your config file template. The host will default to `localhost` and that should suffice for your initial testing needs.
- run `npm install` to download all needed dependencies
- Use the config settings in pa11y-dashboard as the basis for the values in your new config file.

## Spidering
- Update the contents in `data/microsites.csv` with your URLs of interest.
- Run `node crawler.js` - results will be saved in `data/microsite-*.csv` files.

## Importing
- Update `data/pa11y-tasks.csv` with entries of interest.
	- NOTE: the data format used by `data/microsite-*.csv` is incompatible with `data/pa11y-tasks.csv` - importing rows is currently a manual process.
	- Columns used in import file:
		- name: Human-readable name for each test
		- url: location for each page to test
		- standard: document validation standard, examples default to `Section508`
		- username, password: used for HTTP basic authentication

