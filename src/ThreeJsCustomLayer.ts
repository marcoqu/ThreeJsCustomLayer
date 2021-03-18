import { Map, MercatorCoordinate, CameraOptions, LngLat } from "mapbox-gl";
import { PerspectiveCamera, Matrix4, Scene, WebGLRenderer, Object3D, Vector3, AmbientLight, HemisphereLight, DirectionalLight, Euler } from "three";

const DEG2RAD = Math.PI / 180;
const CAMERA_FOV = 0.6435011087932844;
const TILE_SIZE = 512;
const WORLD_SIZE = 1024000;
const EARTH_CIRCUMFERENCE = 40075000;

export class ThreeJsCustomLayer {
  // from https://codepen.io/danvk/pen/GRggjmg

  public type: "custom" = "custom";
  public renderingMode: "3d" = "3d";
  private _camera: PerspectiveCamera;
  private _cameraTransform: Matrix4;
  private _world: Object3D;
  private _scene: Scene;
  private _renderer?: WebGLRenderer;
  private _factor: number;
  private _map?: Map;

  public get scene(): Scene { return this._scene; }

  constructor(public id = 'ThreeJsCustomLayer', factor = 1) {
    this._factor = factor;
    Object3D.DefaultUp.set(0, 0, 1);
    this._camera = new PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);
    this._cameraTransform = new Matrix4().scale(new Vector3(1, -1, 1));
    this._world = new Object3D();
    this._world.scale.set(1/factor, 1/factor, 1/factor);
    this._scene = new Scene();
    this._scene.name = 'world';
    this._scene.add(this._world);
  }
  
  public onAdd(map: Map, gl: WebGL2RenderingContext) {
    this._map = map;
    this._renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true, alpha: true });
    this._renderer.shadowMap.enabled = true;
    this._renderer.autoClear = false;
  }

  public render(gl: WebGLRenderingContext, matrix: number[]) {
    if (!this._renderer) return;
    this._camera.projectionMatrix = new Matrix4()
      .fromArray(matrix)
      .multiply(this._cameraTransform);
    this._renderer.state.reset();
    this._renderer.render(this._scene, this._camera);
  }

  public addObject3D(obj: Object3D, coords?: MercatorCoordinate): void {
    if (coords) {
      obj.position.set(coords.x * this._factor, -coords.y * this._factor, (coords.z || 0) * this._factor);
      obj.scale.setScalar(coords.meterInMercatorCoordinateUnits() * this._factor);
    }
    this._world.add(obj);
  }

  public removeObject3D(obj: Object3D): void {
    this._world.remove(obj);
  }

  public coordsToVector3(coords: [number, number, number?]): Vector3 {
    const m = MercatorCoordinate.fromLngLat([coords[0], coords[1]], coords[2]);
    return new Vector3(m.x * this._factor, -m.y * this._factor, (m.z ?? 0) * this._factor);
  }

  public zoomToAltitude(lat: number, zoom: number): number {
    if (!this._map) throw new Error("Layer must be added to the map");
    const scale = this._zoomToScale(zoom);
    const pixelsPerMeter = this._projectedUnitsPerMeter(lat) * scale;
    return this._cameraToCenterDistance(this._map) / pixelsPerMeter;
  }
  
  public altitudeToZoom(lat: number, height: number): number {
    if (!this._map) throw new Error("Layer must be added to the map");
    const pixelsPerMeter = this._cameraToCenterDistance(this._map) / height;
    const scale = pixelsPerMeter / this._projectedUnitsPerMeter(lat);
    return this._scaleToZoom(scale);
  }
  
  public cameraToVector3AndEuler(pos: CameraOptions): [Vector3, Euler] {
    if (!pos.center || !pos.zoom) throw new Error("Camera must have a center and a zoom position");
    if (!this._map) throw new Error("Layer must be added to the map");
    const c = LngLat.convert(pos.center);
    const p = (pos.pitch || 0) * DEG2RAD;
    const b = (pos.bearing || 0) * DEG2RAD;
    const position = [c.lng, c.lat, this.zoomToAltitude(c.lat, pos.zoom)] as [number, number, number];
    const projected = this.coordsToVector3(position);
    projected.x += projected.z * Math.sin(-p) * Math.sin(b);
    projected.y += projected.z * Math.sin(-p) * Math.cos(b);
    projected.z = projected.z * Math.cos(-p);
    return [projected, new Euler(p, 0, b)];
  }

  public meterInMercatorUnits(lat: number): number {
    const m = MercatorCoordinate.fromLngLat([0, lat]);
    return m.meterInMercatorCoordinateUnits() * this._factor;
  }

  public addDefaultLights() {
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange

    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(-70, -70, 100).normalize();

    this._scene.add(new AmbientLight(0xffffff, 0.25));
    this._scene.add(new HemisphereLight(skyColor, groundColor, 0.25));
    this._scene.add(directionalLight);
  }

  private _zoomToScale(zoom: number) {
    return Math.pow(2, zoom) * (TILE_SIZE / WORLD_SIZE);
  }
  
  private _scaleToZoom(scale: number) {
    return Math.log(scale / (TILE_SIZE / WORLD_SIZE)) / Math.LN2;
  }
  
  private _cameraToCenterDistance(map: Map): number {
    var t = (map as any).transform;
    const halfFov = CAMERA_FOV / 2;
    return (0.5 / Math.tan(halfFov)) * t.height;
  }
  
  private _projectedUnitsPerMeter(latitude: number) {
    return Math.abs(WORLD_SIZE * this._circumferenceAtLatitude(latitude));
  }
  
  private _mercatorScale(latitude: number) {
    return 1 / Math.cos(latitude * DEG2RAD);
  }
  
  private _circumferenceAtLatitude(latitude: number) {
    return this._mercatorScale(latitude) / EARTH_CIRCUMFERENCE;
  }
  
}