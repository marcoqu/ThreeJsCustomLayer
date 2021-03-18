"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapbox_gl_1 = require("mapbox-gl");
const three_1 = require("three");
const DEG2RAD = Math.PI / 180;
const CAMERA_FOV = 0.6435011087932844;
const TILE_SIZE = 512;
const WORLD_SIZE = 1024000;
const EARTH_CIRCUMFERENCE = 40075000;
class ThreeJsCustomLayer {
    constructor(id = 'ThreeJsCustomLayer', factor = 1) {
        this.id = id;
        // from https://codepen.io/danvk/pen/GRggjmg
        this.type = "custom";
        this.renderingMode = "3d";
        this._factor = factor;
        three_1.Object3D.DefaultUp.set(0, 0, 1);
        this._camera = new three_1.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);
        this._cameraTransform = new three_1.Matrix4().scale(new three_1.Vector3(1, -1, 1));
        this._world = new three_1.Object3D();
        this._world.scale.set(1 / factor, 1 / factor, 1 / factor);
        this._scene = new three_1.Scene();
        this._scene.name = 'world';
        this._scene.add(this._world);
    }
    get scene() { return this._scene; }
    onAdd(map, gl) {
        this._map = map;
        this._renderer = new three_1.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true, alpha: true });
        this._renderer.shadowMap.enabled = true;
        this._renderer.autoClear = false;
    }
    render(gl, matrix) {
        if (!this._renderer)
            return;
        this._camera.projectionMatrix = new three_1.Matrix4()
            .fromArray(matrix)
            .multiply(this._cameraTransform);
        this._renderer.state.reset();
        this._renderer.render(this._scene, this._camera);
    }
    addObject3D(obj, coords) {
        if (coords) {
            obj.position.set(coords.x * this._factor, -coords.y * this._factor, (coords.z || 0) * this._factor);
            obj.scale.setScalar(coords.meterInMercatorCoordinateUnits() * this._factor);
        }
        this._world.add(obj);
    }
    removeObject3D(obj) {
        this._world.remove(obj);
    }
    coordsToVector3(coords) {
        var _a;
        const m = mapbox_gl_1.MercatorCoordinate.fromLngLat([coords[0], coords[1]], coords[2]);
        return new three_1.Vector3(m.x * this._factor, -m.y * this._factor, ((_a = m.z) !== null && _a !== void 0 ? _a : 0) * this._factor);
    }
    zoomToAltitude(lat, zoom) {
        if (!this._map)
            throw new Error("Layer must be added to the map");
        const scale = this._zoomToScale(zoom);
        const pixelsPerMeter = this._projectedUnitsPerMeter(lat) * scale;
        return this._cameraToCenterDistance(this._map) / pixelsPerMeter;
    }
    altitudeToZoom(lat, height) {
        if (!this._map)
            throw new Error("Layer must be added to the map");
        const pixelsPerMeter = this._cameraToCenterDistance(this._map) / height;
        const scale = pixelsPerMeter / this._projectedUnitsPerMeter(lat);
        return this._scaleToZoom(scale);
    }
    cameraToVector3AndEuler(pos) {
        if (!pos.center || !pos.zoom)
            throw new Error("Camera must have a center and a zoom position");
        if (!this._map)
            throw new Error("Layer must be added to the map");
        const c = mapbox_gl_1.LngLat.convert(pos.center);
        const p = (pos.pitch || 0) * DEG2RAD;
        const b = (pos.bearing || 0) * DEG2RAD;
        const position = [c.lng, c.lat, this.zoomToAltitude(c.lat, pos.zoom)];
        const projected = this.coordsToVector3(position);
        projected.x += projected.z * Math.sin(-p) * Math.sin(b);
        projected.y += projected.z * Math.sin(-p) * Math.cos(b);
        projected.z = projected.z * Math.cos(-p);
        return [projected, new three_1.Euler(p, 0, b)];
    }
    meterInMercatorUnits(lat) {
        const m = mapbox_gl_1.MercatorCoordinate.fromLngLat([0, lat]);
        return m.meterInMercatorCoordinateUnits() * this._factor;
    }
    addDefaultLights() {
        const skyColor = 0xb1e1ff; // light blue
        const groundColor = 0xb97a20; // brownish orange
        const directionalLight = new three_1.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(-70, -70, 100).normalize();
        this._scene.add(new three_1.AmbientLight(0xffffff, 0.25));
        this._scene.add(new three_1.HemisphereLight(skyColor, groundColor, 0.25));
        this._scene.add(directionalLight);
    }
    _zoomToScale(zoom) {
        return Math.pow(2, zoom) * (TILE_SIZE / WORLD_SIZE);
    }
    _scaleToZoom(scale) {
        return Math.log(scale / (TILE_SIZE / WORLD_SIZE)) / Math.LN2;
    }
    _cameraToCenterDistance(map) {
        var t = map.transform;
        const halfFov = CAMERA_FOV / 2;
        return (0.5 / Math.tan(halfFov)) * t.height;
    }
    _projectedUnitsPerMeter(latitude) {
        return Math.abs(WORLD_SIZE * this._circumferenceAtLatitude(latitude));
    }
    _mercatorScale(latitude) {
        return 1 / Math.cos(latitude * DEG2RAD);
    }
    _circumferenceAtLatitude(latitude) {
        return this._mercatorScale(latitude) / EARTH_CIRCUMFERENCE;
    }
}
exports.ThreeJsCustomLayer = ThreeJsCustomLayer;
