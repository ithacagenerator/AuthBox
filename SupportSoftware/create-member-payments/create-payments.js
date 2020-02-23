// jshint esversion: 8
const argv = require('minimist')(process.argv.slice(2));
const moment = require('moment');
const inputfile = argv.input || './input.json';
const outputfile = argv.output || './output.json';
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const from = moment(argv.from, 'YYYY-MM');
const to = moment(argv.to, 'YYYY-MM');

if (!from.isValid()) {
  console.error(`Argument --from must be formatted 'YYYY-MM' but was '${argv.from}'`);
  process.exit();
}

if (!to.isValid()) {
  console.error(`Argument --to must be formatted 'YYYY-MM' but was '${argv.to}'`);
  process.exit();
}

if (to.isBefore(from)) {
  console.error('Argument --to must be after argument --from');
  process.exit();
}

async function run() {
  const input = await readFile(inputfile, 'utf8');
  const inputJSON = JSON.parse(input);
  if (inputJSON.txn_type !== 'subscr_payment') {
    console.error('Failed to find payment in input file');
    process.exit();
  }

  if (!inputJSON.payment_date) {
    console.error('Failed to find payment date in input file');
    process.exit();
  }

  const templateMoment = moment(inputJSON.payment_date, 'HH:mm:ss MMM DD, YYYY Z');
  if (!templateMoment.isValid()) {
    console.error(`Template moment '${inputJSON.payment_date}' is not valid format`);
    process.exit();
  }

  outputData = [];
  while(from.isSameOrBefore(to)) {
    templateMoment.month(from.month());
    templateMoment.year(from.year());
    inputJSON.payment_date = templateMoment.format('HH:mm:ss MMM DD, YYYY Z');
    outputData.push(JSON.parse(JSON.stringify(inputJSON)));
    from.add(1, 'month');
  }

  await writeFile(outputfile, JSON.stringify(outputData, null, 2), 'utf8');
}

run();


