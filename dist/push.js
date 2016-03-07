#!/usr/bin/env node
var askPush, command, dirty, diversityData, error, exec, filelist, finish, fs, gitPullBranch, newDiversity, newVersion, position, push, readDiversity, rls, runCommand, runTest, settings, shell, shouldPush, updateString, versionArray, versionNumber, writeDiversity;

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

push.version((function() {
  var packageJson, packagePath;
  packagePath = __dirname + '/../package.json';
  packageJson = JSON.parse(fs.readFileSync(packagePath, {
    encoding: 'utf8'
  }));
  return packageJson.version;
})()).option('-r, --release [type]', 'Start up git flow release. Type can be major, minor or patch. Default is patch. Will not finish or push without asking.').parse(process.argv);

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

runTest = function(command) {
  var question;
  if ((shell.exec(command)).code !== 0) {
    question = "\"" + command + "\" failed, do you want to abort the release and fix this? [Y/n]:";
    if (rls.question(question) !== 'n') {
      return shell.exit(0);
    }
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
  try {
    fs.statSync('.jscsrc');
    runTest('gulp jscs');
  } catch (error) {
    shell.echo('INFO: Skipping JSCS. No .jscsrc file found.');
  }
  runTest('gulp jshint');
  runTest('gulp lint-css:style-names');
  runTest('gulp lint-css:doiuse');
  runTest('gulp translations-update-fail-on-incomplete');
  runTest('gulp protractor:single-run');
  runTest('gulp karma:single-run');
  if (fs.existsSync('scripts.min.js')) {
    runCommand('git checkout scripts.min.js');
  }
  dirty = shell.exec('expr $(git status --porcelain 2>/dev/null| egrep "^(M| M)" | wc -l)').output;
  if (parseInt(dirty)) {
    console.log('You have unstaged changes that you must take care of. Fix and commit this and then run diversity-push again.');
    shell.exit(1);
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
  newDiversity = JSON.stringify(diversityData, null, settings.jsonSpaces) + '\n';
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
    runCommand('git commit ' + filelist + ' -m "' + updateString + ' and minified scripts."');
    console.log('Commited diversity.json and scripts.min.js');
  }
  console.log('Running the "release" task...');
  runCommand('gulp release');
  console.log('..."release" task done!');
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
