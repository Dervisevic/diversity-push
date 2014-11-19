#Diversity Push
[![npm version](https://badge.fury.io/js/diversity-push.svg)](http://badge.fury.io/js/diversity-push)

This is a simple node script for updating a [Diversity](https://diversity.io/) component.

Takes an argument, patch, minor or major. Updated the diversity.json file, commits it, tags it and pushes it. No argument is patch.

## Todo/Improvments
* Remove automatic patch, must specify what you want to update
* Add something like [commander](https://github.com/tj/commander.js), so it can provide help and take more robust arguments.
* Arguments to do sub tasks as well. Something like only modify diversity.json etc. Will open up for more workflows.
* Do a git pull or something to avoid conflicts.
