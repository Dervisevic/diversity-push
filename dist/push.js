#!/usr/bin/env node
var askPush, command, diversityData, exec, filelist, finish, fs, gitPullBranch, karmaConfPath, karmaTestsExist, newDiversity, newVersion, position, push, readDiversity, rls, runCommand, settings, shell, shouldPush, skipKarmaTests, updateString, versionArray, versionNumber, writeDiversity;

fs = require('fs');

exec = require('child_process').exec;

push = require('commander');

rls = require('readline-sync');

shell = require('shelljs');

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

settings = {
  diversityPath: process.cwd() + '/diversity.json',
  encoding: 'utf-8',
  jsonSpaces: 2
};

push.version('2.0.0').option('-r, --release [type]', 'Start up git flow release. Type can be major, minor or patch. Default is patch. Will not finish or push without asking.').parse(process.argv);

readDiversity = function(path) {
  return fs.readFileSync(path, settings.encoding, function(err, data) {
    if (err) {
      throw err;
    }
    return JSON.parse(data);
  });
};

writeDiversity = function(path, data) {
  return fs.writeFileSync(path, data, settings.encoding, function(err) {
    if (err) {
      throw err;
    }
    return true;
  });
};

runCommand = function(command) {
  if ((shell.exec(command)).code !== 0) {
    shell.echo('Error: ' + command + ' failed. Exiting.');
    return shell.exit(1);
  }
};

gitPullBranch = function(branch) {
  runCommand('git checkout ' + branch);
  if (shell.exec('git pull').code !== 0) {
    runCommand('git reset --hard');
    shell.echo('Error: master could not be automatically merged with origin/master. Please update master and try again');
    return shell.exit(1);
  }
};

if (push.release) {
  console.log('Stashing any non-committed changes:');
  runCommand('git stash');
  gitPullBranch('master');
  gitPullBranch('develop');
  karmaConfPath = process.cwd() + '/test/karma.conf.js';
  karmaTestsExist = fs.existsSync(karmaConfPath);
  if (!karmaTestsExist) {
    skipKarmaTests = rls.question('Could not find any karma tests, do you want to proceed without running tests? [Y/n]: ');
  }
  if ((skipKarmaTests != null ? skipKarmaTests.toLowerCase() : void 0) === 'n') {
    console.log("Release canceled.");
    shell.exit(1);
  }
  if (karmaTestsExist) {
    runCommand('gulp karma:single-run');
  }
  diversityData = JSON.parse(readDiversity(settings.diversityPath));
  versionArray = diversityData.version.split('.');
  command = push.release === true ? 'patch' : push.release;
  position = 2;
  if (command === 'major') {
    position = 0;
    versionArray[1] = '0';
    versionArray[2] = '0';
  }
  if (command === 'minor') {
    position = 1;
    versionArray[2] = '0';
  }
  versionNumber = parseInt(versionArray[position], 10);
  versionNumber += 1;
  versionArray[position] = versionNumber.toString();
  newVersion = versionArray.join('.');
  diversityData.version = newVersion;
  newDiversity = JSON.stringify(diversityData, null, settings.jsonSpaces);
  updateString = 'Bumped ' + command + ' version to ' + newVersion + '.';
  console.log(updateString + ' Proceeding.');
  runCommand('git flow release start ' + newVersion);
  console.log('Started git flow release.');
  writeDiversity(settings.diversityPath, newDiversity);
  console.log('Updated version in diversity.json');
  console.log('Starting to minify, may take a few moments...');
  runCommand('gulp minify');
  console.log('Minified to scripts.min.js.');
  filelist = 'diversity.json';
  if (fs.existsSync(process.cwd() + '/scripts.min.js')) {
    filelist += ' scripts.min.js';
  }
  runCommand('git commit ' + filelist + ' -m "' + updateString + ' and minified scripts."');
  console.log('Commited diversity.json and scripts.min.js');
  askPush = false;
  finish = rls.question('Would you like to finish the release? [Y/n]: ');
  if (finish.toLowerCase() === 'n') {
    console.log("Don't forget to finish the release after you're done.");
  } else {
    askPush = true;
    runCommand('git flow release finish -m "' + newVersion + '" ' + newVersion);
    console.log('Finishing git flow release.');
  }
  if (askPush) {
    shouldPush = rls.question('Would you like to push the release? [Y/n]: ');
    if (shouldPush.toLowerCase() === 'n') {
      console.log("Don't forget to push after you're done.");
    } else {
      runCommand('git push --all && git push --tags');
      console.log('Pushing release and tags.');
    }
  }
  console.log("Done!");
} else {
  push.outputHelp();
}
