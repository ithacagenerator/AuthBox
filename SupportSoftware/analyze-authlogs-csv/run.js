//jshint esversion: 6
const argv = require('minimist')(process.argv.slice(2));
const parse = require('csv-parse/lib/sync');
const moment = require('moment');
const fs = require('fs');

const inputFilename = argv.input || argv.i || argv.c || argv.csv || 'authbox-history.csv';
const start = argv.start || argv.s || argv.begin || argv.b;
const end = argv.end || argv.e || argv.finish || argv.f;
const help = argv.help || argv.h;

if(help) {
  console.log(`

  Possible Arguments:
    
    --start, --s, --begin, --b   starting date in ISO-8601 format YYYY-MM-DDTHH:mm:ssZZ
    --end, --e, --finish, --f    ending date in ISO-8601 format YYYY-MM-DDTHH:mm:ssZZ
    --input, --i, --csv, --c     input csv filename, defaults to authbox-history.csv
  `);

  process.exit(0);
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
    return v;
  } else {
    return null;
  }
})
.filter(v => !!v)
.map(v => {
  // calculate time differences
  v.sessionTime = v.deauthorized.diff(v.authorized, 'seconds');
  // calculate day of week
  v.weekday = v.authorized.format('dddd');
  return v;
});

console.log(JSON.stringify(parsedData, null, 2));