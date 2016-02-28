### Loading 3D models into React applications

This code makes it easier to create React components from imported 3D-models. To be used in applications using react-three or react-three-renderer and Three.js. It consists of 3 files:

 - `parsed_model.js`: contains the class ParsedModel, the main code.
 - `create_material.js`: converts THREE.Material instances to react-three-renderer components, needs to be extended with more types of material which is fairly straight-forward. This file is only needed in projects that use react-three-renderer.
 - `ColladaLoader.js`: only necessary if your project needs to load Collada files.

### ParsedModel

```
  let model = new ParsedModel();
  model.load('path/to/model').then(
    function resolve(m){
      console.log('loaded:', m);
    },
    function reject(e){
      console.error('error:', e);
    }
  );

```

If your application does not need to be able to load Collada files you can uncomment the lines:

```
import ColladaLoader from './ColladaLoader';
```
and in the constructor:
```
this._colladaLoader = new THREE.ColladaLoader();
```


#### constructor
You can pass an optional settings object to the constructor:

```
  let model = new ParsedModel({
    scale: 1,
    rotation: new THREE.Quaternion()
  });
```

The settings object sets the rotation and the scale of the model itself, not the rotation and the scale of the THREE.Object3D instance that contains the model.


#### load(url, [settings])
You can load both JSON and Collada files. Files with the extension `.dae` and `.collada` will be loaded using the ColladaLoader and files with a `.json` extension will be loaded with the THREE.ObjectLoader.
Like in the constructor the settings object is optional and allows you to set the scale and rotation of the loaded model itself.


#### loadCollada(url, [settings])
Allows you to load Collada files that have a different extension.


#### loadJSON(url, [settings])
Allows you to load JSON files that have a different extension.


#### parse(Object3D, [settings])
Parses an instance of Object3D (or subclasses thereof). This method is particularly handy if you want to use an external model that has already been loaded by another method.


#### properties
After you have loaded or parsed an external 3D model, an instance of `ParsedModel` has the following properties:

 - `model`: reference to the loaded 3D model
 - `name`: name of the loaded 3D model
 - `geometries`: a Map of all geometries of the loaded 3D model
 - `mergedGeometry`: all geometries merged into a single instance of THREE.BufferGeometry
 - `materialArray`: an Array containing all used materials
 - `material`: an instance of THREE.MeshFaceMaterial made of all used materials



### Rendering a 3D model with React
Example with react-three using the merged geometry and the multi-material:
```
  let geometry = this.props.parsedModel.mergedGeometry;
  let material = this.props.parsedModel.material;
  return(
    <Mesh
      geometry={geometry}
      material={material}
      key={THREE.Math.generateUUID()}
      position={this.props.position}
      scale={this.props.scale}
    />
  );
```

Currently multi-materials are not yet supported in react-three-renderer so we need a bit more code here:

```
  let meshes = [];
  let geometries = this.props.parsedModel.geometries;
  let materialsArray = this.props.parsedModel.materialsArray;
  let materialIndices = this.props.parsedModel.materialIndices;

  geometries.forEach((geometry, uuid) => {
    // get the right material for this geometry using the material index
    let material = materialsArray[materialIndices.get(uuid)];
    // create a react-three-renderer material component
    material = createMaterial(material);

    meshes.push(
      <mesh
        key={uuid}
      >
        <geometry
          vertices={geometry.vertices}
          faces={geometry.faces}
        />
        {material}
      </mesh>
    );
  });

  return(
    <group>
      {meshes}
    </group>
  );

```


### Examples

In this [repository](https://github.com/tweedegolf/parsed_model_examples) you can find 2 working examples of how to use `ParsedModel` with react-three and react-three-renderer. As mentioned above if your application does not need to load collada's you don't have to add the file ColladaLoader.js to your project, and the file create_material.js is only needed in projects that use react-three-renderer.