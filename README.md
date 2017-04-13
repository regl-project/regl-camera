# regl-camera
A basic reusable "turntable" camera component for [regl](http://regl.party).  (Secretly just [spherical coordinates](https://en.wikipedia.org/wiki/Spherical_coordinate_system).)

## Example

```javascript
const regl = require('regl')()
const camera = require('regl-camera')(regl, {
  center: [0, 2.5, 0]
})

const bunny = require('bunny')
const normals = require('angle-normals')

const drawBunny = regl({
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

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(() => {
    drawBunny()
  })
})
```

## Install

```
npm i regl-camera
```

## API

### Constructor

#### `var camera = require('regl-camera')(regl[, options])`
`module.exports` of `regl-camera` is a constructor for the camera.  It takes the following arguments:

* `regl` is a handle to the regl instance
* `options` is an object with the following optional properties:
  + `center` which is the center of the camera
  + `theta` the theta angle for the camera
  + `phi` the phi angle for the camera
  + `distance` the distance from the camera eye to the center
  + `up` the up vector for the camera
  + `mouse` set to `false` to turn off mouse events
  + `damping` multiplier for inertial damping (default 0.9). Set to 0 to disable inertia.
  + `preventDefault` boolean flag to prevent mouse wheel from scrolling the whole window. Default is false.

### Command usage

#### `camera(block)`
`regl-camera` sets up an environment with the following variables in both the context and uniform blocks:

| Variable | Type | Description |
|----------|------|-------------|
| `view`   | `mat4` | The view matrix for the camera |
| `projection` | `mat4` | The projection matrix for the camera |
| `center` | `vec3` | The center of the camera |
| `eye` | `vec3` | The eye coordinates of the camera |
| `up` | `vec3` | The up vector for the camera matrix |
| `theta` | `float` | Latitude angle parameter in radians |
| `phi` | `float` | Longitude angle parameter in radians |
| `distance` | `float` | Distance from camera to center of objective |

**Note**
These properties can also be accessed and modified directly by accessing the object

## License
(c) 2016 Mikola Lysenko. MIT License
