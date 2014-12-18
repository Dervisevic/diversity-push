#Diversity Push
[![npm version](https://badge.fury.io/js/diversity-push.svg)](http://badge.fury.io/js/diversity-push)

This is a simple node script for updating a [Diversity](https://diversity.io/) component.

2.0 now is integrated with git flow. It currently only performs one task, and that is the release workflow. The --release flag takes the patch, minor or major option and updated diversity.json and minifies the scripts via gulp.
Midway through the process the user is prompted if he wants to finish the release, and if it's so another prompt is presented, whether to push or not.

Commander provides help for options. All concerns previously listed have been adressed. 2.0 is also now written in coffeescript, this was done in an educational purpose. 
