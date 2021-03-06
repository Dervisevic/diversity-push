# Diversity Push <denis@dervisevic.se>
# A simple node script to update the version of Diversity <https://diversity.io/> components.
# More info in readme

fs    = require('fs');
exec  = require('child_process').exec;
push  = require('commander');
rls   = require('readline-sync');
shell = require('shelljs');

if not shell.which 'git'
  shell.echo 'Sorry, this script requires git'
  shell.exit 1

settings =
  diversityPath: process.cwd() + '/diversity.json',
  encoding: 'utf-8',
  jsonSpaces: 2, # Amount of spaces for indentation in output file (can also be \t)

push
  .version do ->
    packagePath = __dirname + '/../package.json'
    packageJson = JSON.parse fs.readFileSync(packagePath, {encoding: 'utf8'})
    packageJson.version
  .option('-r, --release [type]', 'Start up git flow release. Type can be major, minor or patch. Default is patch. Will not finish or push without asking.')
  .option('-j, --just-release', 'Just do the release part of the flow.')
  .parse(process.argv);

readDiversity = (path) ->
  fs.readFileSync path, settings.encoding, (err, data) ->
    throw err if err
    return JSON.parse data

writeDiversity = (path, data) ->
  fs.writeFileSync path, data, settings.encoding, (err) ->
    throw err if err
    return true

runCommand = (command) ->
  if (shell.exec command).code != 0
    shell.echo 'Error: ' + command + ' failed. Exiting.'
    shell.exit 1

runTest = (command) ->
  if (shell.exec command).code != 0
    question = """"#{command}" failed, do you want to abort the release and fix this? [Y/n]:"""
    if rls.question(question) != 'n'
      shell.exit 0

gitPullBranch = (branch) ->
  runCommand 'git checkout ' + branch
  if shell.exec('git pull').code != 0
    runCommand 'git reset --hard'
    shell.echo 'Error: master could not be automatically merged with origin/master. Please update master and try again'
    shell.exit 1


if push.release
    console.log 'Stashing any non-committed changes:'
    runCommand 'git stash'

    # Check out master and develop and make sure they are up-to-date with origin
    gitPullBranch 'master'
    gitPullBranch 'develop'

    # Run tests and lint tools
    if not push.justRelease
      try
        fs.statSync '.jscsrc'
        runTest 'gulp jscs'
      catch
        shell.echo 'INFO: Skipping JSCS. No .jscsrc file found.'
      runTest 'gulp jshint'
      runTest 'gulp lint-css:style-names'
      runTest 'gulp lint-css:doiuse'
      runTest 'gulp translations-update-fail-on-incomplete'
      runTest 'gulp protractor:single-run'
      runTest 'gulp karma:single-run'
    else
      console.log 'Just doing a release.'

    # Restore scripts.min.js
    if fs.existsSync 'scripts.min.js'
      runCommand 'git checkout scripts.min.js'

    # Are there changes in working tree? Than abort and ask the user to fix things.
    # Get number of total uncommited files
    dirty = shell.exec('expr $(git status --porcelain 2>/dev/null| egrep "^(M| M)" | wc -l)').output
    if parseInt dirty
      console.log 'You have unstaged changes that you must take care of. Fix and commit this and then run diversity-push again.'
      shell.exit 1

    diversityData = JSON.parse readDiversity(settings.diversityPath)
    versionArray = diversityData.version.split '.'

    # The default is patch, hence why position is default 2 below. Empty value is actually true.
    command = if push.release is true then 'patch' else push.release
    position = 2

    if command is 'major'
      position = 0
      versionArray[1] = '0'
      versionArray[2] = '0'

    if command is 'minor'
      position = 1
      versionArray[2] = '0'

    versionNumber = parseInt(versionArray[position], 10)
    versionNumber += 1
    versionArray[position] = versionNumber.toString()
    newVersion = versionArray.join '.'

    diversityData.version = newVersion;
    newDiversity = JSON.stringify(diversityData, null, settings.jsonSpaces) + '\n';
    updateString = 'Bumped ' + command + ' version to ' + newVersion + '.'
    console.log updateString + ' Proceeding.'

    # Start git flow release
    runCommand 'git flow release start ' + newVersion
    console.log 'Started git flow release.'

    # Write to diversity file.
    writeDiversity settings.diversityPath, newDiversity
    console.log 'Updated version in diversity.json'

    # gulp minify
    console.log 'Starting to minify, may take a few moments...'
    runCommand 'gulp minify'
    console.log 'Minified to scripts.min.js.'

    # Commit diversity.json scripts.min.js with message
    filelist = 'diversity.json'
    if fs.existsSync(process.cwd() + '/scripts.min.js')
      filelist += ' scripts.min.js'

      runCommand 'git commit ' + filelist + ' -m "' + updateString + ' and minified scripts."'
      console.log 'Commited diversity.json and scripts.min.js'

    # Run the custom 'release' task
    console.log 'Running the "release" task...'
    runCommand 'gulp release'
    console.log '..."release" task done!'

    runCommand 'git flow release finish -m "' + newVersion + '" ' + newVersion
    console.log 'Finishing git flow release.'

    runCommand 'git push --all && git push --tags'
    console.log 'Pushing release and tags.'
    console.log "Done!"
else
  push.outputHelp()
