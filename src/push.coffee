# Diversity Push <denis@dervisevic.se>
# A simple node script to update the version of Diversity <https:#diversity.io/> components.
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
  .version('2.0.0')
  .option('-r, --release [type]', 'Start up git flow release. Type can be major, minor or patch. Default is patch. Will not finish or push without asking.')
  .option('-n, --noscripts', 'If it shouldn\'t commit the scripts file')
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


if push.release
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
    newDiversity = JSON.stringify(diversityData, null, settings.jsonSpaces);
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
    if !push.noscripts
      filelist += ' scripts.min.js'

    runCommand 'git commit ' + filelist + ' -m "' + updateString + ' and minified scripts."'
    console.log 'Commited diversity.json and scripts.min.js'

    # Check if you should finish release
    askPush = false
    finish = rls.question 'Would you like to finish the release? [Y/n]: '
    if finish.toLowerCase() is 'n'
      console.log "Don't forget to finish the release after you're done."
    else
      askPush = true
      runCommand 'git flow release finish -m "' + newVersion + '" ' + newVersion
      console.log 'Finishing git flow release.'

    if askPush
      shouldPush = rls.question 'Would you like to push the release? [Y/n]: '
      if shouldPush.toLowerCase() is 'n'
        console.log "Don't forget to push after you're done."
      else
        runCommand 'git push --all && git push --tags'
        console.log 'Pushing release and tags.'
    console.log "Done!"
else
  push.outputHelp()
