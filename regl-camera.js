var mouseChange = require('mouse-change')
var mouseWheel = require('mouse-wheel')
var identity = require('gl-mat4/identity')
var perspective = require('gl-mat4/perspective')
var lookAt = require('gl-mat4/lookAt')

module.exports = createCamera

var isBrowser = typeof window !== 'undefined'

var defaultProps = {
  // initial cameraState
  center: [0, 0, 0],
  theta: 0,
  phi: 0,
  distance: 10,
  up: [0, 1, 0],
  fovy: Math.PI / 4.0,
  near: 0.01,
  far: 1000,
  flipY: false,
  // properties
  damping: 0.9,
  minDistance: 0.1,
  maxDistance: 1000,
  mouse: true
}

function createCamera (regl, propsOverride) {
  var props = Object.assign({}, defaultProps, propsOverride)

  var cameraState = {
    view: identity(new Float32Array(16)),
    projection: identity(new Float32Array(16)),
    center: new Float32Array(props.center),
    theta: props.theta,
    phi: props.phi,
    distance: Math.log(props.distance),
    eye: new Float32Array(3),
    up: new Float32Array(props.up),
    fovy: props.fovy,
    near: props.near,
    far: props.far,
    flipY: Boolean(props.flipY),
    dtheta: 0,
    dphi: 0
  }

  var right = new Float32Array([1, 0, 0])
  var front = new Float32Array([0, 0, 1])

  var minDistance = Math.log(props.minDistance)
  var maxDistance = Math.log(props.maxDistance)

  var ddistance = 0

  if (isBrowser && props.mouse) {
    var prevX = 0
    var prevY = 0

    mouseChange(function (buttons, x, y) {
      if (buttons & 1) {
        var dx = (x - prevX) / window.innerWidth
        var dy = (y - prevY) / window.innerHeight
        var w = Math.max(cameraState.distance, 0.5)

        cameraState.dtheta += w * dx
        cameraState.dphi += w * dy
      }
      prevX = x
      prevY = y
    })

    mouseWheel(function (dx, dy) {
      ddistance += dy / window.innerHeight
    })
  }

  function damp (x) {
    var xd = x * props.damping
    if (Math.abs(xd) < 0.1) {
      return 0
    }
    return xd
  }

  function clamp (x, lo, hi) {
    return Math.min(Math.max(x, lo), hi)
  }

  function updateCamera (props) {
    Object.keys(props).forEach(function (prop) {
      cameraState[prop] = props[prop]
    })

    var center = cameraState.center
    var eye = cameraState.eye
    var up = cameraState.up
    var dtheta = cameraState.dtheta
    var dphi = cameraState.dphi

    cameraState.theta += dtheta
    cameraState.phi = clamp(
      cameraState.phi + dphi,
      -Math.PI / 2.0,
      Math.PI / 2.0)
    cameraState.distance = clamp(
      cameraState.distance + ddistance,
      minDistance,
      maxDistance)

    cameraState.dtheta = damp(dtheta)
    cameraState.dphi = damp(dphi)
    ddistance = damp(ddistance)

    var theta = cameraState.theta
    var phi = cameraState.phi
    var r = Math.exp(cameraState.distance)

    var vf = r * Math.sin(theta) * Math.cos(phi)
    var vr = r * Math.cos(theta) * Math.cos(phi)
    var vu = r * Math.sin(phi)

    for (var i = 0; i < 3; ++i) {
      eye[i] = center[i] + vf * front[i] + vr * right[i] + vu * up[i]
    }

    lookAt(cameraState.view, eye, center, up)
  }

  var injectContext = regl({
    context: Object.assign({}, cameraState, {
      projection: function (context) {
        perspective(cameraState.projection,
          cameraState.fovy,
          context.viewportWidth / context.viewportHeight,
          cameraState.near,
          cameraState.far)
        if (cameraState.flipY) { cameraState.projection[5] *= -1 }
        return cameraState.projection
      }
    }),
    uniforms: Object.keys(cameraState).reduce(function (uniforms, name) {
      uniforms[name] = regl.context(name)
      return uniforms
    }, {})
  })

  function setupCamera (props, block) {
    if (!block) {
      block = props
      props = {}
    }
    updateCamera(props)
    injectContext(block)
  }

  Object.keys(cameraState).forEach(function (name) {
    setupCamera[name] = cameraState[name]
  })

  return setupCamera
}
