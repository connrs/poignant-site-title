# Barnacle Mode [![Build Status](https://secure.travis-ci.org/connrs/node-barnacle-mode.png?branch=master)](http://travis-ci.org/connrs/node-barnacle-mode)

A shorthand for creating object mode streams. The intention is to have an object mode stream that receives an object, appends keys, and then pipes it on. Almost like middleware but streaming.

## Getting Started

Install the module with: `npm install barnacle-mode`

## Usage

Create a new stream with:

    var helloWorld = barnacleMode(function (obj, done) {
      obj.hello = 'world';
      done(null, obj);
    });

The returned function can be called to create new instances of this stream:

    hw = helloWorld();
    someOtherObjectStream.pipe(hw);

If you have a stream which you intend to output a buffer (ie. not object mode) on the readable side, pass true as the second parameter when calling barnacleMode:

    var callback = function (obj, done) { done(null, obj); };
    var outputsBuffer = barnacleMode(callback, true);

This will allow you to provide an object mode stream which eventually passes its data through to a standard stream.
