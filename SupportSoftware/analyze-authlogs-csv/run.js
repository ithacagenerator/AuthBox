//jshint esversion: 6
const argv = require('minimist')(process.argv.slice(2));
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const moment = require('moment');
const fs = require('fs');

const inputFilename = argv.input || argv.i || argv.c || argv.csv || 'authbox-history.csv';
const outputFilename = argv.output || argv.o;
const start = argv.start || argv.s || argv.begin || argv.b;
const end = argv.end || argv.e || argv.finish || argv.f;
const help = argv.help || argv.h;

if(help) {
  console.log(`

  Possible Arguments:
    --input, --i, --csv, --c     input csv filename, defaults to authbox-history.csv
    --start, --s, --begin, --b   (optional) starting date in ISO-8601 format YYYY-MM-DDTHH:mm:ssZZ
    --end, --e, --finish, --f    (optional) ending date in ISO-8601 format YYYY-MM-DDTHH:mm:ssZZ
    --output, --o                (optional) output filename
    --json, --j                  (optional) supply flag to output json file (in addition to csv file) 
  `);

  process.exit(0);
}

let startMoment;
if(start) {
  startMoment = moment(start);
  if(!startMoment.isValid()) {
    startMoment = null;
    console.warn(`Supplied start date ${start} is not a valid ISO8601 format, ignoring it`);
  } else {
    console.log(`Filtering data before ${startMoment.format()}`);
  }
}

let endMoment;
if(end) {
  endMoment = moment(end);
  if(!endMoment.isValid()) {
    endMoment = null;
    console.warn(`Supplied end date ${end} is not a valid ISO8601 format, ignoring it`);
  } else {
    console.log(`Filtering data after ${endMoment.format()}`);
  }
}

let rawData;
try {
  rawData = fs.readFileSync(inputFilename);
} catch(e) {
  console.error(`Failed to open input CSV file named ${inputFilename}`);
  console.error(e.message);
  process.exit(1);
}

let parsedData;
try {
  parsedData = parse(rawData, {columns: true});
} catch(e) {
  console.error('Failed to parse CSV data');
  console.error(e.message);
  process.exit(2);
}
// turn dates into moments for subsequent date math
parsedData = parsedData.map(v => {
  // member	box_name	authorized	deauthorized
  if(v.authorized && v.deauthorized) {
    v.authorized = moment(v.authorized);
    v.deauthorized = moment(v.deauthorized);
    if(!v.authorized.isValid() || !v.deauthorized.isValid()) {
      v = null;
    }
    else if(startMoment && v.deauthorized.isBefore(startMoment)) {
      v = null;
    }
    else if(endMoment && v.authorized.isAfter(endMoment)) {
      v = null;
    }
  } else {
    // ignore data if it doesn't include both start and end dates
    v = null;
  }

  return v;
})
.filter(v => !!v)
.map(v => {
  // calculate time differences
  v.minutes = +((v.deauthorized.diff(v.authorized, 'seconds') / 60).toFixed(2));
  // calculate day of week
  v.weekday = v.authorized.format('dddd');
  v.month = v.authorized.format('MMMM');
  v.authorized = v.authorized.format();
  v.deauthorized = v.deauthorized.format();

  return v;
});

console.log(JSON.stringify(parsedData, null, 2));

if(outputFilename) {
  fs.writeFileSync(outputFilename, stringify(parsedData, {header: true}), 'utf8');
  if(argv.json) {
    fs.writeFileSync(outputFilename + '.json', JSON.stringify(parsedData, null, 2));
  }
}