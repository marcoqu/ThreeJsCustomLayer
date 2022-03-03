# Mapbox - ThreeJs Custom Layer

A minimal [Mapbox](https://github.com/mapbox/mapbox-gl-js) [custom layer](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) to add [Three.js](https://threejs.org/) models to a map.

If you need more advanced features, check out [ThreeBox](https://github.com/jscastro76/threebox).

## Basic usage
```js

const threeLayer = new ThreeJsCustomLayer(); 

const map = new mapboxgl.Map({
    container: 'map',
    center: [9.191383, 45.464211],
    zoom: 11,
    accessToken: 'your-access-token',
    style: 'mapbox://styles/mapbox/outdoors-v11',
});

map.once('load' () => {
    map.addLayer(threeLayer);

    const geometry = new THREE.BoxGeometry(100, 100, 100);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const cube = new THREE.Mesh(geometry, material);
    threeLayer.addObjectAtLocation(cube, map.getCenter());
});


```