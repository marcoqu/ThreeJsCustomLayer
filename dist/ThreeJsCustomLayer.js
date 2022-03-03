"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreeJsCustomLayer = void 0;
var mapbox_gl_1 = require("mapbox-gl");
var three_1 = require("three");
var ThreeJsCustomLayer = /** @class */ (function () {
    function ThreeJsCustomLayer(id) {
        if (id === void 0) { id = 'threeLayer'; }
        this.type = 'custom';
        this.renderingMode = '3d';
        this._scene = new three_1.Scene();
        this._camera = new three_1.Camera();
        this._cameraTransform = new three_1.Matrix4();
        this._enabled = true;
        this.id = id;
    }
    ThreeJsCustomLayer.prototype.onAdd = function (map, gl) {
        this._map = map;
        this._center = mapbox_gl_1.MercatorCoordinate.fromLngLat(map.getCenter(), 0);
        this._cameraTransform = this._cameraTransform.makeTranslation(this._center.x, this._center.y, this._center.z);
        this._setupLights();
        this._renderer = new three_1.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
        });
        this._renderer.autoClear = false;
    };
    ThreeJsCustomLayer.prototype.render = function (gl, matrix) {
        if (!this._map || !this._renderer)
            throw new Error("Custom Layer has not been added to the map yet.");
        this._camera.projectionMatrix = new three_1.Matrix4().fromArray(matrix).multiply(this._cameraTransform);
        this._renderer.state.reset();
        if (!this._enabled)
            return;
        this._renderer.render(this._scene, this._camera);
        this._map.triggerRepaint();
    };
    /**
     * @param object ThreeJs object, with coordinates in meters
     * @param lnglat Coordinates at which to place the object
     * @param altitude altitude at which to place the object
     */
    ThreeJsCustomLayer.prototype.addObjectAtLocation = function (object, lnglat, altitude) {
        if (altitude === void 0) { altitude = 0; }
        if (!this._center)
            throw new Error("Custom Layer has not been added to the map yet.");
        var _a = this._center, x = _a.x, y = _a.y, z = _a.z;
        var coord = mapbox_gl_1.MercatorCoordinate.fromLngLat(lnglat, altitude);
        var scale = coord.meterInMercatorCoordinateUnits();
        var matrix = new three_1.Matrix4()
            .makeTranslation(coord.x - x, coord.y - y, coord.z - z)
            .scale(new three_1.Vector3(scale, -scale, scale));
        object.applyMatrix4(matrix);
        this._scene.add(object);
    };
    /**
     * @param object ThreeJs object, with coordinates in Mercator Coordinates
     */
    ThreeJsCustomLayer.prototype.addGeographicObject = function (object) {
        if (!this._center)
            throw new Error("Custom Layer has not been added to the map yet.");
        var _a = this._center, x = _a.x, y = _a.y;
        object.applyMatrix4(new three_1.Matrix4().makeTranslation(-x, -y, 0));
        this._scene.add(object);
    };
    ThreeJsCustomLayer.prototype.enable = function () {
        this._enabled = true;
    };
    ThreeJsCustomLayer.prototype.disable = function () {
        this._enabled = false;
    };
    ThreeJsCustomLayer.prototype.remove = function (obj) {
        this._scene.remove(obj);
    };
    ThreeJsCustomLayer.prototype._setupLights = function () {
        var hemiLight = new three_1.HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 20, 0);
        var dirLight = new three_1.DirectionalLight(0xffffff);
        dirLight.position.set(-3, 10, -10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 2;
        dirLight.shadow.camera.bottom = -2;
        dirLight.shadow.camera.left = -2;
        dirLight.shadow.camera.right = 2;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        this._scene.add(hemiLight);
        this._scene.add(dirLight);
    };
    return ThreeJsCustomLayer;
}());
exports.ThreeJsCustomLayer = ThreeJsCustomLayer;
