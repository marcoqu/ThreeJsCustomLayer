import type { Map, CustomLayerInterface, LngLatLike } from 'mapbox-gl';
import type { Object3D } from 'three';
export declare class ThreeJsCustomLayer implements CustomLayerInterface {
    id: string;
    type: "custom";
    renderingMode: "3d";
    private _scene;
    private _camera;
    private _cameraTransform;
    private _enabled;
    private _map?;
    private _center?;
    private _renderer?;
    constructor(id?: string);
    onAdd(map: Map, gl: WebGLRenderingContext): void;
    render(gl: WebGLRenderingContext, matrix: number[]): void;
    /**
     * @param object ThreeJs object, with coordinates in meters
     * @param lnglat Coordinates at which to place the object
     * @param altitude altitude at which to place the object
     */
    addObjectAtLocation(object: Object3D, lnglat: LngLatLike, altitude?: number): void;
    /**
     * @param object ThreeJs object, with coordinates in Mercator Coordinates
     */
    addGeographicObject(object: Object3D): void;
    enable(): void;
    disable(): void;
    remove(obj: Object3D): void;
    private _setupLights;
}
