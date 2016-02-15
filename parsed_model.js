import React from 'react';
import THREE from 'three';
import ColladaLoader from 'ColladaLoader';

export class ParsedModel{

  constructor(model, settings){
    this._colladaLoader = new THREE.ColladaLoader();
    this._objectLoader = new THREE.ObjectLoader();
    this._parseSettings(settings || {});
    if(typeof model !== 'undefined' && model !== null){
      this._parse(model);
    }
  }

  _parseSettings(settings){
    this.quaternion = settings.quaternion || new THREE.Quaternion();
    this.scale = settings.scale;
    if(typeof this.scale !== 'number'){
      this.scale = 1;
    }
  }

  _parse(model){
    this.model = model;
    this.name = model.name;
    this.geometries = new Map();
    this.materialIndices = new Map();
    this.materialsArray = [];

    // adjust the rotation of the model according to the rotation of the world
    this.model.quaternion.copy(this.quaternion);
    this.model.updateMatrix();

    let index = 0;
    this.model.traverse((child) => {
      if(child instanceof THREE.Mesh){
        // set initial scale of model by scaling its geometries
        child.geometry.scale(this.scale, this.scale, this.scale);
        // create an array of the use materials
        let uuid = child.material.uuid;
        this.materialIndices.set(uuid, index++);
        this.materialsArray.push(child.material);
        this.geometries.set(uuid, child.geometry);
      }
    });
    //console.log('number of geometries merged', index);

    // create multimaterial
    this.material = new THREE.MeshFaceMaterial(this.materialsArray);

    let merged = new THREE.Geometry();
    // merge the geometry and apply the matrix of the new position
    this.geometries.forEach((g, uuid) => {
      merged.merge(g, this.model.matrix, this.materialIndices.get(uuid));
    });

    this.mergedGeometry = new THREE.BufferGeometry().fromGeometry(merged);
  }

  load(url, settings){
    if(typeof settings !== 'undefined'){
      this._parseSettings(settings);
    }
    if(typeof url !== 'string'){
      url = 'none';
    }
    url = url || 'none';
    let p;
    let type = url.substring(url.lastIndexOf('.') + 1).toLowerCase();

    switch(type){
      case 'dae':
      case 'collada':
        p = this.loadCollada(url);
        break;
      case 'json':
        p = this.loadJSON(url);
        break;
      default:
        p = new Promise((resolve, reject) => {
          reject('wrong data provided');
        });
    }
    return p;
  }

  loadCollada(url, settings){
    if(typeof settings !== 'undefined'){
      this._parseSettings(settings);
    }

    return new Promise((resolve, reject) => {
      this._colladaLoader.load(
        url,
        // success callback
        (data) => {
          this._parse(data.scene);
          resolve();
        },
        // progress callback
        () => {},
        // error callback
        (error) => {
          reject(error);
        }
      );
    });
  }

  loadJSON(url, settings){
    if(typeof settings !== 'undefined'){
      this._parseSettings(settings);
    }

    return new Promise((resolve, reject) => {
      this._objectLoader.load(
        url,
        // success callback
        (data) => {
          this._parse(data);
          resolve();
        },
        // progress callback
        () => {},
        // error callback
        (error) => {
          reject(error);
        }
      );
    });
  }
}


// simple method that parses a Threejs material into a component (to be extended with other types of material)

export function createMaterial(material){
  let m;
  switch(material.type){
    case 'MeshBasicMaterial':
      m = (
        <meshBasicMaterial
          color={material.color}
        />
      );
      break;
    case 'MeshLambertMaterial':
      m = (
        <meshLambertMaterial
          transparent={material.transparent}
          alphaTest={material.alphaTest}
          side={material.side}
          opacity={material.opacity}
          visible={material.visible}
          color={material.color}
          emissive={material.emissive}
          wireframe={material.wireframe}
          wireframeLinewidth={material.wireframeLinewidth}
        />
      );
      break;
    default:
      m = null;
  }

  return m;
}
