#Diversity Push
[![npm version](https://badge.fury.io/js/diversity-push.svg)](http://badge.fury.io/js/diversity-push)

This is a simple node script for automating the release flow for [Diversity](https://diversity.io/) components for [Textalk Webshop](http://www.textalk.se/webshop/).

Diversity Push expects a git-flow enabled repository and depends on several gulp tasks defined in [diversity-build](https://git.diversity.io/tooling/diversity-build).

## Install

    npm install --global diversity-push

## Use
Publish #develop with a new patch version:

    diversity-push -r
    # or
    diversity-push -r patch

Publish #develop with a new minor version:

    diversity-push -r minor

Publish #develop with a new major version:

    diversity-push -r major

Show version

    diversity-push --version
