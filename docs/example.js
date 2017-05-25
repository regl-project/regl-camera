'use strict'

var regl = require('regl')()
var camera = require('../regl-camera')(regl, {
  center: [0, 2.5, 0],
  damping: 0,
  noScroll: true
})

var bunny = require('bunny')
var normals = require('angle-normals')

var drawBunny = regl({
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    void main () {
      gl_FragColor = vec4(abs(vnormal), 1.0);
    }`,
  vert: `
    precision mediump float;
    uniform mat4 projection, view;
    attribute vec3 position, normal;
    varying vec3 vnormal;
    void main () {
      vnormal = normal;
      gl_Position = projection * view * vec4(position, 1.0);
    }`,
  attributes: {
    position: bunny.positions,
    normal: normals(bunny.cells, bunny.positions)
  },
  elements: bunny.cells
})

regl.frame(function () {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(function () {
    drawBunny()
  })
})
