#!/usr/bin/env node

/**
 * Diversity Push <denis@dervisevic.se>
 * A simple node script to update the version of Diversity <https://diversity.io/> components.
 * Usage: Just run the npm command diversityPush from a components git archive with a single
 * argument, patch, minor, or major to update that part of the semver version string. If no argument
 * is supplied a patch update is assumed.
 */

var fs = require('fs');
var exec = require('child_process').exec;

var runCommand = function(command) {
  exec(command, function (error, stdout, stderr) {
    if (error) throw error;
    //console.log(stdout); // Hide this for now.
  });
};

var settings = {
  diversityPath: process.cwd() + '/diversity.json',
  encoding: 'utf-8',
  jsonSpaces: 2, // Amount of spaces for indentation in output file (can also be \t)
};

fs.readFile(settings.diversityPath, settings.encoding, function (err, data) {
  if (err) throw err;

  var diversityData = JSON.parse(data);
  var versionArray = diversityData.version.split('.');

  // The default is patch, hence why position is default 2 below.
  var command = process.argv[2] || 'patch';
  var updateString = 'Updated ' + command + ' version of diversity.json';

  var position = 2;

  if (command === 'major') {
    position = 0;
    versionArray[1] = '0';
    versionArray[2] = '0';
  }
  if (command === 'minor') {
    position = 1;
    versionArray[2] = '0';
  }

  var versionNumber = parseInt(versionArray[position], 10);
  versionNumber += 1;
  versionArray[position] = versionNumber.toString();
  var newVersion = versionArray.join('.');

  diversityData.version = newVersion;
  var newDiversity = JSON.stringify(diversityData, null, settings.jsonSpaces);

  fs.writeFile(settings.diversityPath, newDiversity, settings.encoding, function (err) {
    if (err) throw err;
    console.log(updateString); // Show what has been updated.
    // I would prefer to do it in separat commands but at this time i haven't found a simple
    // way to check if the previous task has completed before running the next.
    runCommand('git commit diversity.json -m "' + updateString + '"' +
      ' && git tag ' + newVersion + ' && git push' + '&& git push --tags');
  });
});
