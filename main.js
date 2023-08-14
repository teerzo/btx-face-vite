import './style.scss'
// import javascriptLogo from './javascript.svg'
// import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.js'

// npm
// import * as THREE from 'three';

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import axios from 'axios';
import { FeatherIcon } from 'feather-icons';

const loader = new OBJLoader();


document.querySelector('#app').innerHTML = `
<div id="nav" class="nav">
<div id="btn-menu" class="btn-menu">
    <div id="btn-menu-off" class="menu-icon">
        <i data-feather="menu"></i>
    </div>
    <div id="btn-menu-on" class="menu-icon">
        <i data-feather="x"></i>
    </div>
</div>

<div id="nav-items" class="nav-items">
    <div id="groupCondition"class="select-group">
        <label> Conditions </label>
        <select id="navSelectConditions" class="select">
            <option value=""> Please select... </option>
        </select>
    </div>
    <div id="groupMuscle" class="select-group">
        <label> Muscles </label>
        <select id="navSelectMuscles" class="select">
            <option value=""> All muscles </option>
        </select>
    </div>
    <div id="groupSidesButtons" class="toggle-group">
        <div id="btnLeftMuscle" class="chkMuscleLeft" title="Hide left muscle"> L </div>
        <div id="btnRightMuscle" class="chkMuscleRight" title="Hide right muscle"> R </div>


        <!-- 
        <label for="chkToggleLeft"> Toggle Left Muscle </label>
        <input id="chkToggleLeft" type="checkbox" />
        <label for="chkToggleRight"> Toggle Right Muscle </label>
        <input id="chkToggleRight" type="checkbox" /> -->
    </div>
    <div class="toggle-group">

    </div>
    <div id="groupTextures" class="check-textures">
        <input id="chkToggleTextures" type="checkbox" />
        <label for="chkToggleTextures" class="label"> Toggle Greyscale </label>
    </div>



    <div id="btn-reset" class="btn-reset"> Reset </div>
    <div id="groupMove" class="check-move">
        <input id="chkMoveMuscles" type="checkbox" />
        <label for="chkMoveMuscles" class="label"> Move muscles </label>
    </div>
</div>
</div>

<div id="container" class="container">

</div>

<div id="overlay" class="overlay">

<div id="overlayScale" class="overlay-scale">
    <div class="scale-parent">
        <div class="scale-min"> 1% </div>
        <div class="scale-colour"> </div>
        <div class="scale-max"> 100% </div>
    </div>
</div>

<div id="overlayMuscle" class="overlay-muscle">
    <p id="metaMuscleName" class="muscle-name"> Muscle name </p>
    <div class="flex-row">
        <div class="flex-text"> 
            <b> Injected in <span id="metaInjectedPercentage"> 90% </span>% of sessions </b>
        </div>
    </div>
    <div class="flex-row">
        <div class="flex-text"> Botox, 
            <span id="metaBotoxValue"> 20 units</span> units, 
            <span id="metaBotoxSessions"> 5 sites </span> sites per session 
        </div>
    </div>
    <div class="flex-row">
        <div class="flex-text"> Dysport, 
            <span id="metaDysportValue"> 20 units</span> units, 
            <span id="metaDysportSessions"> 3 sites </span> sites per session 
        </div>
    </div>
</div>

<div id="overlayCondition" class="overlay-condition">
    <p id="metaConditionName" class="condition-name"> Belpharospasm </p>
    <div class="flex-row">
        <div class="flex-text"> Number of patients </div>
        <div id="metaNumPatients" class="flex-value"> 20 </div>
    </div>
    <div class="flex-row">
        <div class="flex-text"> Number of sessions </div>
        <div id="metaNumSessions" class="flex-value"> 99 </div>
    </div>
    <div class="flex-row">
        <div class="flex-text"> Average Age </div>
        <div id="metaAverageAge" class="flex-value"> 54 </div>
    </div>
    <div class="flex-row">
        <div class="flex-text"> Percentage Male </div>
        <div id="metaPercentageMale" class="flex-value"> 32 </div>
    </div>
    <div class="flex-row">
        <div class="flex-text"> Percentage Female </div>
        <div id="metaPercentageFemale" class="flex-value"> 68 </div>
    </div>
</div>
</div>
`



let app = {

  objectScale: new THREE.Vector3(8, 8, 8),

  // dom btn/select variables
  conditionId: null,
  muscleGroupId: null,
  muscleIds: [],
  muscleId: null,

  leftVisible: true,
  rightVisible: true,

  toggleTextures: false,

  clock: new THREE.Clock(),
  conditions: {
    path: './data/conditions.json',
    downloading: null,
    loading: null,
    list: [],
    rawList: [],
  },
  muscles: {
    path: './data/muscles.json',
    downloading: null,
    loading: null,
    list: [],
    rawList: [],
  },
  models: {
    path: './data/models.json',
    downloading: null,
    loading: null,
    list: [],
    rawList: [],
  },
  modelsMisc: {
    path: './data/modelsMisc.json',
    downloading: null,
    loading: null,
    list: [],
    rawList: [],
  },
  textures: {
    path: './data/textures.json',
    downloading: null,
    loading: null,
    list: [],
    fullList: [],
  },


  modelList: null,
  textureList: null,

  meshList: [],
  objectList: [],


  resizeEnd: null,


  menuToggle: false,

  raycast: {
    currentObject: null,
    plane: null,
    positionOffset: new THREE.Vector3(0, 0, 0),
    enabled: false,
    moveEnabled: false,
    mouseDown: false,
    mouseMove: false,
    mouseUp: false,
    mouseOut: false,
  },
  raycastPos: null,
  raycaster: new THREE.Raycaster(),
  raycastList: [],

  cameraLastPos: new THREE.Vector3(0, 0, 0),
  cameraDefaultPos: new THREE.Vector3(0, 150, 50),
  cameraTargetDefaultPos: new THREE.Vector3(0, 150, 0),
  // Loaders
  loader: loader,
  textureLoader: new THREE.TextureLoader(),


  initialize: function () {
    // replace icons
    // feather.replace({ class: '', width: '30', height: '30', color: '#333333' });



    app.getMuscles().then(() => {
      app.getConditions().then(() => {
        app.getTextures().then(() => {
          app.getModels().then(() => {
            app.getModelsMisc().then(() => {
              app.loadTextures().then(() => {
                app.loadModels().then(() => {
                  app.initModels().then(() => {
                    app.updateDom();
                    app.hideLoading();

                    console.log('initModels done');
                  });
                });
              });
            });
          });
        });
      });
    });

    initEventListeners();
    initDom();

    initThree();
    initScene();
    // initObjects();
    initRaycast();

    app.reset();
    app.loop();
  },
  reset: function () {
    console.log('reset');

    app.resetCamera();

    app.resetSelectCondition();
    app.resetSelectMuscle();

    app.resetDomTextureToggle();
    app.resetDomMoveMuscles();

    resizeThree();
    app.resetObjects();
    app.resetRaycast();
  },
  resetCamera: function () {
    if (app.renderer) {
      let width = window.innerWidth - 20;
      let height = (window.innerWidth <= 768 ? window.innerHeight - 60 : window.innerHeight - 60);
      app.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
      app.camera.position.copy(app.cameraDefaultPos);

      app.controls = new OrbitControls(app.camera, app.renderer.domElement)
      app.controls.target.copy(app.cameraTargetDefaultPos);
      // app.controls.enableDamping = true
      // app.controls.dampingFactor = 0.25
      app.controls.enableZoom = true;
    }
  },
  resetObjects: function () {
    console.log('resetObjects');
    for (let i in app.objectList) {
      let item = app.objectList[i];
      // console.log(item);

      item.state.visible = true;
      item.state.raycastSelected = false;
      item.state.groupSelected = false;

      item.object.position.set(0, 0, 0);
      item.object.scale.copy(app.objectScale);
    }
    app.updateObjects();
  },
  resetRaycast: function () {
    app.raycast.currentObject = null;
    app.raycastPos.position.set(0, 0, 0);
  },
  resetDomTextureToggle: function () {
    app.toggleTextures = false;

    document.getElementById("chkToggleTextures").checked = false;

  },
  resetDomMoveMuscles: function () {
    app.raycast.moveEnabled = false;
    app.controls.enabled = true;
    document.getElementById("chkMoveMuscles").checked = false;
  },
  loop: function () {
    let dt = 0.1;

    update(dt);

    // console.log('loop');
    requestAnimationFrame(app.loop);
    if (app.scene) {
      // console.log(app.scene.children);
      // if (app.scene.children && app.scene.children.length > 0) {
      //     for (var i = 0; i < app.scene.children.length; i++) {
      //         const child = app.scene.children[i];
      //         if (child.update) {
      //             child.update(dt);
      //         }
      //     }
      // }
    }

    let clearColour = 0xAAAAAA;
    app.renderer.clear();
    app.renderer.setClearColor(clearColour);
    app.renderer.render(app.scene, app.camera);

    app.renderer.render(app.scene, app.camera);
  },

  hideLoading: function () {
    let domLoading = document.getElementById('loading');

    window.setTimeout(() => {
      domLoading.classList.add('anim');
      window.setTimeout(() => {
        domLoading.classList.add('hide');
      }, 500);
    }, 2000);
  },

  clickStart: function (event) {
    // console.log('clickStart', event);
  },

  getMuscles: function () {
    return new Promise(function (resolve, reject) {
      app.muscles.downloading = true;

      axios.get(app.muscles.path).then(function (response) {
        // console.log(response);
        if (response.data) {
          console.log(response.data);
          app.muscles.downloading = false;
          app.muscles.loading = true;
          app.fullMuscles = response.data;

          // app.updateDom();
          console.log('getMuscles resolve');
          resolve();
        }
      });
    })
  },

  getConditions: function () {
    console.log('getConditions');
    return new Promise(function (resolve, reject) {
      app.conditions.downloading = true;

      axios.get(app.conditions.path).then(function (response) {
        // console.log(response);
        if (response.data) {
          console.log(response.data);
          app.conditions.downloading = false;
          app.conditions.loading = true;
          app.conditions.fullList = response.data;

          // app.updateDom();
          console.log('getConditions resolve');
          resolve();
        }
      });
    })
  },
  getTextures: function () {
    return new Promise(function (resolve, reject) {
      app.textures.downloading = true;

      axios.get(app.textures.path).then(function (response) {
        // console.log(response);
        if (response.data) {
          console.log(response.data);
          app.textures.downloading = false;
          app.textures.loading = true;
          app.textures.fullList = response.data;


          console.log('getTextures resolve');
          resolve();
        }
      });
    })
  },
  getModels: function () {
    console.log('getModels');
    return new Promise(function (resolve, reject) {
      app.models.downloading = true;

      axios.get(app.models.path).then(function (response) {
        // console.log(response);
        if (response.data) {
          console.log(response.data);
          app.models.downloading = false;
          app.models.loading = true;
          app.models.fullList = response.data;
          // app.textures.fullList = response.data.textureList;
          // app.updateDom();

          console.log('getModels resolve');
          resolve();
        }
      });
    });
  },
  getModelsMisc: function () {
    return new Promise(function (resolve, reject) {
      app.modelsMisc.downloading = true;

      axios.get(app.modelsMisc.path).then(function (response) {
        // console.log(response);
        if (response.data) {
          console.log(response.data);
          app.modelsMisc.downloading = false;
          app.modelsMisc.loading = true;
          app.modelsMisc.fullList = response.data;

          console.log('getModelsMisc resolve');
          resolve();
        }
      });
    })
  },


  loadTextures: function () {
    console.log('loadTextures');
    return new Promise(function (resolve, reject) {
      if (app.textureLoader) {
        let promises = [];
        for (let i in app.textures.fullList) {
          let promise = new Promise(function (resolve, reject) {
            app.textureLoader.load('./tex/' + app.textures.fullList[i].path, function (texture) {
              console.log('texture loaded', texture);
              app.textures.list.push({ name: app.textures.fullList[i].name, texture: texture });
              resolve();
            });
          });
          promises.push(promise);
        }
        Promise.all(promises).then(function () {
          console.log('loadTextures resolve');
          resolve();
        })
      }
    });
  },
  loadModels: function () {
    console.log('loadModels');
    return new Promise(function (resolve, reject) {
      if (app.loader) {

        let promises = [];
        for (let i in app.models.fullList) {
          const md = app.models.fullList[i];
          if (md.fileName !== '' && md.fileName !== null) {
            let promise = new Promise(function (resolve, reject) {
              app.loader.load('./obj/' + md.fileName + '.' + md.fileType, function (model) {
                app.models.list.push({
                  id: md.id,
                  type: 'muscle',
                  name: md.name,
                  side: md.side,
                  mesh: model,
                  texture: md.texture,
                  textureGrey: md.textureGrey,
                });
                console.log('loaded', md.fileName, model);

                resolve();
              }, function (xhr) {

              },
                function (error) {
                  console.log('Failed to load ', md.fileName);

                  resolve();
                });
            });
            promises.push(promise);
          }
        }
        for (let i in app.modelsMisc.fullList) {
          const md = app.modelsMisc.fullList[i];
          if (app.modelsMisc.fullList[i].fileName !== '') {
            let promise = new Promise(function (resolve, reject) {
              app.loader.load('./obj/' + md.fileName + '.' + md.fileType, function (model) {
                app.modelsMisc.list.push({ id: md.id, type: 'misc', name: md.name, mesh: model, texture: md.texture });
                console.log('loaded', md.fileName, model);

                resolve();
              }, function (xhr) {

              },
                function (error) {
                  console.log('Failed to load ', md.fileName);

                  resolve();
                });
            });
            promises.push(promise);
          }
        }
        Promise.all(promises).then(function () {
          console.log('loadModels resolve');
          resolve();
        })
      }
    });
  },

  getTexture: function (name) {
    var result;
    for (var i = 0; i < app.textures.list.length; i++) {
      if (app.textures.list[i].name === name) {
        result = app.textures.list[i].texture;
      }
    }
    return result;
  },
  updateSelectMuscles: function (list) {
    console.log('$ updateSelectMuscles');
    let domSelect = document.getElementById('navSelectMuscles');

    if (domSelect.options.length > 0) {
      for (let i in domSelect.options) {
        domSelect.remove(i);
      }
    }

    let option = document.createElement('option');
    option.text = 'All muscles'
    option.value = null;

    domSelect.add(option);

    for (let i = 0; i < list.length; i++) {

      // console.log(list[i]);

      let option = document.createElement('option');
      option.text = list[i].name;
      option.value = list[i].id;

      domSelect.add(option);
    }
  },
  updateSelectConditions: function (list) {
    let domSelect = document.getElementById('navSelectConditions');
    for (let i in list) {
      // console.log(list[i]);
      let option = document.createElement('option');
      option.text = list[i].name;
      option.value = list[i].id;

      domSelect.add(option);
    }
  },
  selectCondition: function (id) {
    console.log('selectCondition', id);
    for (let i in app.conditions.fullList) {
      if (app.conditions.fullList[i].id === id) {
        // app.sele
        app.updateObjectsScale();
        app.updateMetaDom(app.conditions.fullList[i]);
        app.updateDom();
      }
    }
  },
  selectMuscleGroup: function (id) {
    console.log('selectMuscleGroup', id);

    app.resetObjects();
    app.resetRaycast();

    let domOverlayMuscle = document.getElementById('overlayMuscle');
    domOverlayMuscle.classList.remove('hide');

    app.showSidesButtons(true);
    // let domGroupSidesButtons = document.getElementById('groupSidesButtons');
    // domGroupSidesButtons.classList.remove('hide');

    app.muscleGroupId = id;

    let muscleMeta = {
      name: ''
    };

    let ids = [];
    for (let i in app.combinedMuscles) {
      if (app.combinedMuscles[i].id === id) {

        console.log('$$$', app.combinedMuscles[i]);


        for (let j in app.combinedMuscles[i].muscles) {
          ids.push(app.combinedMuscles[i].muscles[j].id);

          // meta
          if (muscleMeta.percentageOfSessionsInjected !== '') {

            muscleMeta.name = app.combinedMuscles[i].name;
            muscleMeta.percentageOfSessionsInjected = app.combinedMuscles[i].muscles[j].percentageOfSessionsInjected;
            muscleMeta.botoxAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].botoxAverageDosePerMuscle;
            muscleMeta.botoxAverageNumberOfSites = app.combinedMuscles[i].muscles[j].botoxAverageNumberOfSites;
            muscleMeta.dysportAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].dysportAverageDosePerMuscle;
            muscleMeta.dysportAverageNumberOfSites = app.combinedMuscles[i].muscles[j].dysportAverageNumberOfSites;
          }
        }
      }
    }
    app.muscleIds = ids;

    for (let i in app.objectList) {
      let item = app.objectList[i];

      item.state.groupSelected = false;
      item.state.transparent = false;



      for (let j in ids) {
        if (item.type === 'muscle') {
          if (item.id === ids[j]) {
            console.log('item', item.id, item.name, item);
            item.state.groupSelected = true;


          }
        }
      }
    }



    app.updateObjects();
    app.updateMetaMuscleDom(muscleMeta)
  },

  selectMuscle: function (object) {
    console.log('selectMuscle', object);
    let domSelectCondition = document.getElementById('navSelectMuscles');

    let domOverlayMuscle = document.getElementById('overlayMuscle');
    domOverlayMuscle.classList.remove('hide');

    app.showSidesButtons(false);

    // let domGroupSidesButtons = document.getElementById('groupSidesButtons');
    // domGroupSidesButtons.classList.add('hide');

    let muscleMeta = {
      name: object.name,
      percentageOfSessionsInjected: 0,
      botoxAverageDosePerMuscle: 0,
      botoxAverageNumberOfSites: 0,
      dysportAverageDosePerMuscle: 0,
      dysportAverageNumberOfSites: 0,
    };


    for (let i in app.combinedMuscles) {
      for (let j in app.combinedMuscles[i].muscles) {
        let muscle = app.combinedMuscles[i].muscles[j];



        if (object.id === muscle.id) {
          console.log(muscle);
          domSelectCondition.value = app.combinedMuscles[i].id;

          muscleMeta.name = app.combinedMuscles[i].name;
          muscleMeta.percentageOfSessionsInjected = app.combinedMuscles[i].muscles[j].percentageOfSessionsInjected;
          muscleMeta.botoxAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].botoxAverageDosePerMuscle;
          muscleMeta.botoxAverageNumberOfSites = app.combinedMuscles[i].muscles[j].botoxAverageNumberOfSites;
          muscleMeta.dysportAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].dysportAverageDosePerMuscle;
          muscleMeta.dysportAverageNumberOfSites = app.combinedMuscles[i].muscles[j].dysportAverageNumberOfSites;

        }
      }
    }
    app.updateMetaMuscleDom(muscleMeta);
  },

  resetSelectCondition: function () {
    app.conditionId = null;

    let domSelectCondition = document.getElementById('navSelectConditions');
    domSelectCondition.selectedIndex = 0;

    let domGroupMuscle = document.getElementById('groupMuscle');
    domGroupMuscle.classList.add('hide');

    app.showSidesButtons(false);

    // let domGroupSidesButtons = document.getElementById('groupSidesButtons');
    // domGroupSidesButtons.classList.add('hide');

    let domGroupMove = document.getElementById('groupMove');
    domGroupMove.classList.add('hide');

    let domOverlayCondition = document.getElementById('overlayCondition');
    domOverlayCondition.classList.add('hide');

    let domOverlayScale = document.getElementById('overlayScale');
    domOverlayScale.classList.add('hide');
  },

  resetSelectMuscle: function () {
    app.muscleGroupId = null;
    app.muscleIds = [];
    app.muscleId = null;

    let domSelectCondition = document.getElementById('navSelectMuscles');
    // domSelectCondition.selectedIndex = 0;

    if (domSelectCondition.options.length > 0) {
      for (let i = domSelectCondition.options.length - 1; i >= 0; i--) {
        domSelectCondition.remove(i);
      }
    }

    let domOverlayMuscle = document.getElementById('overlayMuscle');
    domOverlayMuscle.classList.add('hide');


    // let domGroupSidesButtons = document.getElementById('groupSidesButtons');
    // domGroupSidesButtons.classList.remove('hide');
  },

  initModels: function () {
    console.log('initModels');
    return new Promise(function (resolve, reject) {
      if (app.models.list && app.models.list.length > 0) {
        for (let i in app.models.list) {
          if (app.models.list[i].name !== '' && app.models.list[i].name !== null) {
            let objProps = {
              id: app.models.list[i].id,
              type: app.models.list[i].type,
              name: app.models.list[i].name,
              side: app.models.list[i].side,
              mesh: app.models.list[i].mesh,
              texture: app.models.list[i].texture,
              textureGrey: app.models.list[i].textureGrey,
            }

            let obj = createObject(objProps);
            // obj.object.scale
            app.objectList.push(obj);
            app.raycastList.push(obj.mesh);
          }
        }
      }
      if (app.modelsMisc.list && app.modelsMisc.list.length > 0) {
        for (let i in app.modelsMisc.list) {
          // console.log(app.meshList[i]);
          let objProps = {
            id: app.modelsMisc.list[i].id,
            type: app.modelsMisc.list[i].type,
            name: app.modelsMisc.list[i].name,
            mesh: app.modelsMisc.list[i].mesh,

            texture: app.modelsMisc.list[i].texture,
          }

          let obj = createObject(objProps);
          // obj.object.scale.multiplyScalar(8.0);
          app.objectList.push(obj);
          app.raycastList.push(obj.mesh);
        }
      }
      updateScene();
      resolve();
    });

  },


  updateMetaDom: function (condition) {
    console.log('updateMetaDom', condition);


    // dom conditions
    let metaConditionName = document.getElementById('metaConditionName');
    let metaNumPatients = document.getElementById('metaNumPatients');
    let metaNumSessions = document.getElementById('metaNumSessions');
    let metaAverageAge = document.getElementById('metaAverageAge');
    let metaPercentageMale = document.getElementById('metaPercentageMale');
    let metaPercentageFemale = document.getElementById('metaPercentageFemale');

    metaConditionName.innerHTML = condition.name;
    metaNumPatients.innerHTML = condition.meta.numberOfPatients;
    metaNumSessions.innerHTML = condition.meta.numberOfSessions;
    metaAverageAge.innerHTML = condition.meta.averageAge;
    metaPercentageMale.innerHTML = condition.meta.percentageMale;
    metaPercentageFemale.innerHTML = condition.meta.percentageFemale;


  },
  updateMetaMuscleDom: function (muscle) {
    console.log('updateMetaMuscleDom', muscle);

    // dom muscles
    let metaMuscleName = document.getElementById('metaMuscleName');
    let metaInjectedPercentage = document.getElementById('metaInjectedPercentage');
    let metaBotoxValue = document.getElementById('metaBotoxValue');
    let metaBotoxSessions = document.getElementById('metaBotoxSessions');
    let metaDysportValue = document.getElementById('metaDysportValue');
    let metaDysportSessions = document.getElementById('metaDysportSessions');

    metaMuscleName.innerHTML = muscle.name;
    metaInjectedPercentage.innerHTML = muscle.percentageOfSessionsInjected;
    metaBotoxValue.innerHTML = muscle.botoxAverageDosePerMuscle;
    metaBotoxSessions.innerHTML = muscle.botoxAverageNumberOfSites;
    metaDysportValue.innerHTML = muscle.dysportAverageDosePerMuscle;
    metaDysportSessions.innerHTML = muscle.dysportAverageNumberOfSites;



    // muscleMeta.name = app.combinedMuscles[i].name;
    //             muscleMeta.percentageOfSessionsInjected = app.combinedMuscles[i].muscles[j].percentageOfSessionsInjected;
    //             muscleMeta.botoxAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].botoxAverageDosePerMuscle;
    //             muscleMeta.botoxAverageNumberOfSites = app.combinedMuscles[i].muscles[j].botoxAverageNumberOfSites;
    //             muscleMeta.dysportAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].dysportAverageDosePerMuscle;
    //             muscleMeta.dysportAverageNumberOfSites = app.combinedMuscles[i].muscles[j].dysportAverageNumberOfSites;


  },
  updateDom: function () {
    console.log('updateDom');



    let muscles = [];
    let conditions = [];


    // check conditions
    if (app.conditionId === null) {
      for (let i in app.conditions.fullList) {
        // app
        if (app.conditions.fullList[i].muscles && app.conditions.fullList[i].muscles.length > 0) {
          conditions.push(app.conditions.fullList[i]);
        }
      }
      app.updateSelectConditions(conditions);
    }


    // check muscles
    let combinedMuscles = [];
    console.log('condition check', app.conditionId);
    if (app.conditionId !== null) {

      for (let c in app.conditions.fullList) {
        if (app.conditions.fullList[c].id === app.conditionId) {
          for (let cm in app.conditions.fullList[c].muscles) {
            const condMuscle = app.conditions.fullList[c].muscles[cm];


            let match = true;

            if (condMuscle.percentageOfSessionsInjected === '') {
              match = false;
            }
            else {
              for (let i in app.fullMuscles) {
                const muscle = app.fullMuscles[i];

                // if (muscle.id === null || muscle.id === '') {
                //     match = false;
                // }
                if (condMuscle.id === muscle.id) {
                  // if (condMuscle.percentageOfSessionsInjected === '') {
                  //     match = false;
                  // }
                  // else {
                  //     // console.log(condMuscle.percentageOfSessionsInjected);
                  // }

                  for (let j in combinedMuscles) {
                    let combined = combinedMuscles[j];

                    // console.log(combined, muscle);
                    if (combined.name === muscle.name) {
                      match = false;
                      combined.muscles.push(condMuscle);
                      // console.log('add', combined.name, muscles);
                    }
                  }
                }
              }
            }
            if (match) {
              let data = {
                id: null,
                name: condMuscle.name,
                muscles: [],
              };
              // console.log('new', data);
              data.muscles.push(condMuscle);
              combinedMuscles.push(data);
            }
          }
        }
      }
      console.log('check muscles', combinedMuscles);

      for (let i in combinedMuscles) {
        // console.log(app.fullMuscles[i]);
        // app
        combinedMuscles[i].id = Number(i);
        muscles.push(combinedMuscles[i]);
      }

      // for (let i in app.fullMuscles) {
      //     console.log(app.fullMuscles[i]);
      //     let match = true;
      //     for (let j in combinedMuscles) {
      //         if (combinedMuscles[j].groupName === app.fullMuscles[i].groupName) {

      //             for( let cm in conditions ) {

      //             }

      //             match = false;
      //             combinedMuscles[j].muscles.push(app.fullMuscles[i]);
      //         }
      //     }
      //     if (match) {
      //         let group = {
      //             groupName: app.fullMuscles[i].groupName,
      //             muscles: [],
      //         }
      //         group.muscles.push(app.fullMuscles[i]);
      //         combinedMuscles.push(group);
      //     }

      //     // app
      // }
      // console.log(combinedMuscles);

      // for (let i in combinedMuscles) {
      //     // console.log(app.fullMuscles[i]);
      //     // app
      //     combinedMuscles[i].id = Number(i);
      //     muscles.push(combinedMuscles[i]);
      // }



      app.combinedMuscles = combinedMuscles;
      app.updateSelectMuscles(muscles);
    }
  },
  updateObjects: function () {
    // console.log('updateObjects', app.conditionId, app.objectList);
    for (let i in app.objectList) {
      let item = app.objectList[i];

      // set visiblity 
      item.material.visible = item.state.visible;
      item.material.opacity = 1;
      item.material.color.setHex(0xFFFFFF);
      item.material.emissive.setHex(0x000000);
      item.material.emissiveIntensity = 1.0;

      if (item.state.raycastSelected) {
        item.material.emissive.setHex(0xFF0000);
      }

      let color = new THREE.Color(0xFFFFFF);



      if (item.type === 'muscle') {
        color = new THREE.Color(0xdd785a);

        // item.material.map = null;

        // color = 0xdd785a;
        // item.material.color.setHex(0xFF0000);
        if (app.toggleTextures) {
          item.material.map = item.textureGrey;
        }
        else {
          item.material.map = item.texture;
        }
      }



      if (app.conditionId !== null && app.muscleGroupId === null) {
        if (item.type === 'muscle') {
          color = item.scaleColor;
          // item.material.color.copy(item.scaleColor);
        }
      }
      else if (app.conditionId !== null && app.muscleGroupId !== null && app.raycast.currentObject !== null) {
        if (item.type === 'muscle') {
          color = item.scaleColor;
          // item.material.color.copy(item.scaleColor);
        }
      }
      else {
        if (item.type === 'muscle') {
          // color = new THREE.Color(0xdd785a);
          color = new THREE.Color(0xFFFFFF);
          // item.material.color.setHex(0xFFFFFF);
        }
      }

      if (app.muscleGroupId !== null && app.raycast.currentObject === null) {
        if (item.type === 'muscle') {
          if (item.state.groupSelected) {
            item.material.opacity = 1;
            color = item.scaleColor;
            // item.material.color.copy(item.scaleColor);
          }
          else {
            item.material.opacity = 0.2;
            // item.material.emissive.setHex(0x000000);
          }
        }
        else {
          // item.transparent = true;
          item.material.opacity = 0.2;
        }
      }
      item.material.color.copy(color);
    }
  },
  updateObjectsScale: function () {

    // Clear scale colours

    for (let m = 0; m < app.objectList.length; m++) {
      app.objectList[m].scaleColor = new THREE.Color(0xFFFFFF);
    }


    for (let c = 0; c < app.conditions.fullList.length; c++) {
      let cond = app.conditions.fullList[c];

      if (app.conditionId === cond.id) {
        for (let cm = 0; cm < cond.muscles.length; cm++) {
          let condMuscle = cond.muscles[cm];

          for (let m = 0; m < app.objectList.length; m++) {
            let muscle = app.objectList[m];



            if (muscle.id === condMuscle.id && muscle.name === condMuscle.name) {
              console.log(muscle.id, muscle.name, condMuscle.percentageOfSessionsInjected);
              // if( )

              // muscle.scaleColor = new THREE.Color(0x00FF00);

              if (condMuscle.percentageOfSessionsInjected !== '' && condMuscle.percentageOfSessionsInjected > 0) {
                // console.log(muscle.name, condMuscle.percentageOfSessionsInjected);
                muscle.scaleColor = new THREE.Color(0xFFFFFF);

                let percentage = condMuscle.percentageOfSessionsInjected;
                let colours = [
                  new THREE.Color(0x01cdcb), // blue
                  new THREE.Color(0x32b229), // green
                  new THREE.Color(0xfccf2b), // yellow
                  // new THREE.Color(0xff8c00), // orange
                  new THREE.Color(0xe9542e), // red
                ];

                if (percentage === 0) {
                  // colour white 
                  muscle.scaleColor = new THREE.Color(0xFFFFFF);
                  // muscle.scaleColor = new THREE.Color(0x000000);
                }
                else if (percentage <= 33) {
                  muscle.scaleColor = new THREE.Color(colours[0]).lerp(colours[1], percentage / 33);
                }
                else if (percentage <= 66) {
                  muscle.scaleColor = new THREE.Color(colours[1]).lerp(colours[2], percentage / 66);
                }
                else { //if (percentage <= 66) {
                  muscle.scaleColor = new THREE.Color(colours[2]).lerp(colours[3], percentage / 100);
                }
              }
              else {
                muscle.scaleColor = new THREE.Color(0xFFFFFF);
              }
            }
          }
        }
      }
    }
  },

  toggleLeftMuscles: function () {
    console.log("toggleLeftMuscles", app.leftVisible);

    app.leftVisible = !app.leftVisible;



    if (app.muscleGroupId !== null) {
      for (let i in app.objectList) {
        let item = app.objectList[i];
        for (let j in app.muscleIds) {
          if (item.id === app.muscleIds[j]) {
            if (item.side === 'left') {
              item.state.visible = app.leftVisible;
            }
            else if (item.side === 'both') {
              if (!app.rightVisible && app.leftVisible === app.rightVisible) {
                item.state.visible = false;
              }
              else {
                item.state.visible = true;
              }
            }
          }
        }
      }
    }
    else {
      for (let i in app.objectList) {
        let item = app.objectList[i];
        if (item.side === 'left') {
          item.state.visible = app.leftVisible;
        }
        else if (item.side === 'both') {
          if (!app.rightVisible && app.leftVisible === app.rightVisible) {
            item.state.visible = false;
          }
          else {
            item.state.visible = true;
          }
        }
      }
    }
    app.updateObjects();
  },
  toggleRightMuscles: function () {
    console.log("toggleRightMuscles", app.rightVisible);
    app.rightVisible = !app.rightVisible;

    if (app.muscleGroupId !== null) {
      for (let i in app.objectList) {
        let item = app.objectList[i];
        for (let j in app.muscleIds) {
          if (item.id === app.muscleIds[j]) {
            if (item.side === 'right') {
              item.state.visible = app.rightVisible;
            }
            else if (item.side === 'both') {
              if (!app.rightVisible && app.leftVisible === app.rightVisible) {
                item.state.visible = false;
              }
              else {
                item.state.visible = true;
              }
            }
          }
        }
      }
    }
    else {
      for (let i in app.objectList) {
        let item = app.objectList[i];
        if (item.side === 'right') {
          item.state.visible = app.rightVisible;
        }
        else if (item.side === 'both') {
          if (!app.rightVisible && app.leftVisible === app.rightVisible) {
            item.state.visible = false;
          }
          else {
            item.state.visible = true;
          }
        }
      }

    }
    app.updateObjects();
  },

  // Raycast 
  raycastFromCamera: function (mouse) {
    console.log('raycastFromCamera', mouse);

    if (app.camera) {

      app.raycaster.setFromCamera(mouse, app.camera);
      const intersects = app.raycaster.intersectObjects(app.raycastList);

      if (intersects.length > 0) {
        let target = null;
        for (let i = 0; i < intersects.length; i++) {
          if (target === null && !intersects[i].object.material.wireframe) {
            target = intersects[i];
          }
        }
        if (target !== null) {
          console.log('intersected object', target.object);
          const intersectPos = new THREE.Vector3().copy(target.point);
          app.raycastPos.position.copy(intersectPos);
          // let firstObject  = 
          app.setRaycastTarget(target.object);

          if (app.raycast.moveEnabled) {
            var offsetPos = new THREE.Vector3().copy(intersectPos);
            console.log(target);
            offsetPos.sub(app.raycast.currentObject.object.position);

            app.raycast.positionOffset.copy(offsetPos);
            console.log('offset', offsetPos);

            var cameraQuat = new THREE.Quaternion().copy(app.camera.quaternion);
            var normalX = new THREE.Vector3(1, 0, 0);
            normalX.applyQuaternion(cameraQuat);
            normalX.normalize();
            var normalY = new THREE.Vector3(0, 1, 0);
            normalY.applyQuaternion(cameraQuat);
            normalY.normalize();
            var normalZ = new THREE.Vector3(0, 0, 1);
            normalZ.applyQuaternion(cameraQuat);
            normalZ.normalize();

            var lookPosition = new THREE.Vector3().copy(intersectPos).add(normalZ);
            app.raycast.plane.position.copy(intersectPos);
            app.raycast.plane.lookAt(lookPosition);
          }
        }
        else {
          app.clearRaycastTarget();

        }
        // app.raycast.plane.lookAt( lookPosition );
      }

      app.updateObjects();
    }
  },

  setRaycastTarget: function (mesh) {
    console.log('setRaycastTarget', mesh);

    if (app.conditionId !== null) {
      // app.resetObjects();



      for (let i in app.objectList) {
        let item = app.objectList[i];

        if (item.mesh.name === mesh.name) {
          item.state.raycastSelected = true;

          app.raycast.currentObject = item;
          app.selectMuscle(item);

        }
        else {
          item.state.raycastSelected = false;
        }
      }
    }

  },
  clearRaycastTarget: function () {
    console.log('clearRaycastTarget');
    for (let i in app.objectList) {
      let item = app.objectList[i];
      item.state.raycastSelected = false;
    }
    app.raycast.currentObject = null;
  },

  // event handlers 
  mouseDown: function (event) {
    app.raycast.mouseDown = true;
    let mouse = getMousePosition(event, app.renderer.domElement);
    app.raycastFromCamera(mouse);

    // console.log(mouse);
  },
  mouseMove: function (event) {
    let mouse = getMousePosition(event, app.renderer.domElement);
    // app.raycastFromCamera(mouse);

    if (app.raycast.moveEnabled) {
      // app.controls.enabled = false;
      if (app.raycast.mouseDown) {
        if (app.raycast.currentObject !== null) {
          // app.controls.enabled = false;

          var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(app.camera);
          var direction = new THREE.Vector3().copy(vector.sub(app.camera.position)).normalize();
          var raycaster = new THREE.Raycaster(app.camera.position, direction);

          var intersects = raycaster.intersectObject(app.raycast.plane);
          if (intersects.length > 0) {

            console.log(intersects);
            var position = new THREE.Vector3().copy(intersects[0].point);

            app.raycastPos.position.copy(position);

            console.log('offset move', app.raycast.positionOffset);

            position.sub(app.raycast.positionOffset);
            // let testPos = new THREE.Vector3(0,-5,0);
            // position.sub(testPos);

            // var offsetPos = new THREE.Vector3().copy(intersectPos);
            // console.log(target);
            // offsetPos.sub(target.object.position);

            // app.raycast.positionOffset.copy(offsetPos);

            // let testPos = new THREE.Vector3(0,0,0);
            // position.sub(testPos);

            console.log('object', app.raycast.currentObject);
            app.raycast.currentObject.object.position.copy(position);
            // app.raycast.currentObject.mesh.position.copy(position);



          }

        }


        if (app.camera) {
          if (!app.raycast.moveEnabled) {
            app.raycaster.setFromCamera(mouse, app.camera);
            const intersects = app.raycaster.intersectObjects(app.raycastList);

            if (intersects.length > 0) {
              let target = null;
              for (let i = 0; i < intersects.length; i++) {
                if (target === null && !intersects[i].object.material.wireframe) {
                  target = intersects[i];
                }
              }
              console.log('intersected object', target.object);
              const intersectPos = new THREE.Vector3().copy(target.point);

              app.raycastPos.position.copy(intersectPos);
              // let firstObject  = 
              app.setRaycastTarget(target.object);
            }

            app.updateObjects();
          }
        }
      }
    }

  },
  mouseUp: function (event) {
    window.setTimeout(function () {
      // app.controls.enabled = true;
    }, 1000);


    app.raycast.mouseDown = false;
  },
  mouseOut: function (event) {

  },

  // dom show/hide 
  showSidesButtons: function (show) {
    let domGroupSidesButtons = document.getElementById('groupSidesButtons');
    if (show) {
      domGroupSidesButtons.classList.remove('hide');
    }
    else {
      domGroupSidesButtons.classList.add('hide');
    }
  }

};



const getElementPosition = function (element) {
  var xPosition = 0;
  var yPosition = 0;

  while (element) {
    xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
    yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
    element = element.offsetParent;
  }
  return { x: xPosition, y: yPosition };
};

const getMousePosition = function (event, element) {
  var ele = getElementPosition(element);
  const mouse = {
    x: ((event.clientX - ele.x) / element.clientWidth) * 2 - 1,
    y: -((event.clientY - ele.y) / element.clientHeight) * 2 + 1,
  };
  // Interact3D.mousePosition.x = ((event.clientX - ele.x) / element.clientWidth) * 2 - 1;
  // Interact3D.mousePosition.y = -((event.clientY - ele.y) / element.clientHeight) * 2 + 1;
  return mouse;
};

const initEventListeners = function () {
  window.addEventListener('resize', onResize);
  window.addEventListener('resize-end', onResizeEnd);






  // this.domContainer3D.addEventListener('mousedown', function(event) { Interact3D.Raycast(Interact3D.Input.states.MOUSE_DOWN, event);}, true );
  // this.domContainer3D.addEventListener('mousemove', function(event) { Interact3D.Raycast(Interact3D.Input.states.MOUSE_MOVE, event);}, false );
  // this.domContainer3D.addEventListener('mouseup',  function(event) { Interact3D.Raycast(Interact3D.Input.states.MOUSE_UP, event); }, false);
  // this.domContainer3D.addEventListener('mouseout',  function(event) { Interact3D.Raycast(Interact3D.Input.states.MOUSE_UP, event); }, false);

  let container = document.getElementById('container');

  let btnReset = document.getElementById('btn-reset');
  let btnMenuOff = document.getElementById('btn-menu-off');
  let btnMenuOn = document.getElementById('btn-menu-on');
  let btnLeftMuscle = document.getElementById('btnLeftMuscle');
  let btnRightMuscle = document.getElementById('btnRightMuscle');

  let selectConditions = document.getElementById('navSelectConditions');
  let selectMuscles = document.getElementById('navSelectMuscles');

  let chkToggleTextures = document.getElementById('chkToggleTextures');
  let chkMoveMuscles = document.getElementById('chkMoveMuscles');

  container.addEventListener('mousedown', (event) => {
    event.preventDefault();
    app.mouseDown(event);
  });
  window.addEventListener('mousemove', (event) => {
    event.preventDefault();
    app.mouseMove(event);
  });
  window.addEventListener('mouseup', (event) => {
    event.preventDefault();
    app.mouseUp(event);
  });
  // window.addEventListener('mouseout', (event) => {
  //     event.preventDefault();
  //     app.mouseOut(event);
  // });



  btnReset.onclick = (event) => {
    event.preventDefault();


    app.reset();

    return false;
  }

  btnMenuOff.onclick = (event) => {
    event.preventDefault();
    onToggleMenu(event);
    return false;
  }
  btnMenuOn.onclick = (event) => {
    event.preventDefault();
    onToggleMenu(event);
    return false;
  }
  btnLeftMuscle.onclick = (event) => {
    event.preventDefault();
    app.toggleLeftMuscles();

    if (app.leftVisible) {
      btnLeftMuscle.classList.remove('active');
    }
    else {
      btnLeftMuscle.classList.add('active');
    }



    return false;
  }
  btnRightMuscle.onclick = (event) => {
    event.preventDefault();
    app.toggleRightMuscles();

    if (app.rightVisible) {
      btnRightMuscle.classList.remove('active');
    }
    else {
      btnRightMuscle.classList.add('active');
    }
    return false;
  }

  selectConditions.onchange = (event) => {
    console.log('selectCondition', event.target.value);

    app.resetSelectMuscle();
    app.showSidesButtons(true);
    app.resetObjects();

    let value = null;
    if (event.target.value !== '' && event.target.value !== 'null' && event.target.value !== null) {
      value = Number(event.target.value);
    }
    if (value !== null) {
      app.conditionId = value;
      app.selectCondition(value);

      let domOverlayCondition = document.getElementById('overlayCondition');
      domOverlayCondition.classList.remove('hide');
      let domOverlayScale = document.getElementById('overlayScale');
      domOverlayScale.classList.remove('hide');

      let domGroupMuscle = document.getElementById('groupMuscle');
      domGroupMuscle.classList.remove('hide');

      app.showSidesButtons(true);
      // let domGroupSidesButtons = document.getElementById('groupSidesButtons');
      // domGroupSidesButtons.classList.remove('hide');

      let domGroupMove = document.getElementById('groupMove');
      domGroupMove.classList.remove('hide');

      app.updateObjects();
    }
    else {
      console.log('clear overlay');
      app.resetSelectCondition();
      app.updateObjects();
    }
  }

  selectMuscles.onchange = (event) => {
    console.log('selectMuscles', event.target.value);

    let value = null;
    if (event.target.value !== '' && event.target.value !== 'null' && event.target.value !== null) {
      value = Number(event.target.value);
    }
    if (value !== null) {
      app.selectMuscleGroup(value);
    }
    else {
      console.log('RESET');
      app.resetSelectMuscle();
      app.selectCondition(app.conditionId);
      app.updateObjects();
    }
  }

  chkToggleTextures.onchange = (event) => {
    app.toggleTextures = !app.toggleTextures;
    app.updateObjects();
  }
  chkMoveMuscles.onchange = (event) => {
    app.raycast.moveEnabled = !app.raycast.moveEnabled;

    app.controls.enabled = !app.raycast.moveEnabled;

    app.raycast.plane.visible = app.raycast.moveEnabled;
    app.raycastPos.visible = app.raycast.moveEnabled;
  }
};

const initDom = function () {
  let menuOff = document.getElementById('btn-menu-off');
  let menuOn = document.getElementById('btn-menu-on');

  menuOff.classList.add('active');
  menuOff.classList.remove('inactive');
  menuOn.classList.remove('active');
  menuOn.classList.add('inactive');
}

// DOM EVENTS

const onToggleMenu = function (event) {
  console.log('onToggleMenu', event);

  let menuOff = document.getElementById('btn-menu-off');
  let menuOn = document.getElementById('btn-menu-on');

  let navItems = document.getElementById('nav-items');

  if (!app.menuToggle) {
    menuOff.classList.remove('active');
    menuOff.classList.add('inactive');

    menuOn.classList.add('active');
    menuOn.classList.remove('inactive');

    navItems.classList.add('active');
  }
  else {
    menuOff.classList.add('active');
    menuOff.classList.remove('inactive');
    menuOn.classList.remove('active');
    menuOn.classList.add('inactive');

    navItems.classList.remove('active');
  }
  app.menuToggle = !app.menuToggle;
}

const onResize = function (event) {
  // console.log('onResize', event);
  clearTimeout(app.resizeEnd);
  app.resizeEnd = setTimeout(function () {
    // option 1
    var evt = new Event('resize-end');
    window.dispatchEvent(evt);
    // option 2: old-fashioned
    /*var evt = document.createEvent('Event');
    evt.initEvent('resize-end', true, true);
    window.dispatchEvent(evt);*/
  }, 100);
};
const onResizeEnd = function (event) {
  console.log('onResizeEnd', event);
  resizeThree(event);
}

const resizeThree = function (event) {
  if (app.renderer) {

    let width = window.innerWidth - 20;
    let height = (window.innerWidth <= 768 ? window.innerHeight - 80 : window.innerHeight - 80);

    const cameraPos = app.camera.position;
    app.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 10000);
    app.camera.updateProjectionMatrix();
    app.camera.position.copy(cameraPos);

    const controlsTarget = app.controls ? app.controls.target : new THREE.Vector3(0, 0, 0);
    app.controls = new OrbitControls(app.camera, app.renderer.domElement)
    app.controls.target.copy(controlsTarget);
    app.controls.enableZoom = true;
    // app.controls.enableDamping = true
    // app.controls.dampingFactor = 0.25

    app.renderer.setSize(width, height);

    // app.controls.enableDamping = true
    // app.controls.dampingFactor = 0.25



    app.domRoot = document.getElementById('container');
    app.domRoot.innerHTML = '';
    app.domRoot.appendChild(app.renderer.domElement);
  }

};


// Data requests
const initThree = function () {
  let width = window.innerWidth - 20;
  let height = (window.innerWidth <= 768 ? window.innerHeight - 60 : window.innerHeight - 60);

  app.scene = new THREE.Scene();



  app.renderer = new THREE.WebGLRenderer();
  app.renderer.antialias = true;
  app.renderer.setPixelRatio(window.devicePixelRatio);
  app.renderer.setSize(width, height);


  app.domRoot = document.getElementById('container');
  app.domRoot.appendChild(app.renderer.domElement);

  app.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  app.camera.position.copy(app.cameraDefaultPos);


  app.controls = new OrbitControls(app.camera, app.renderer.domElement)
  app.controls.target.copy(app.cameraTargetDefaultPos);
  // app.controls.enableDamping = true
  // app.controls.dampingFactor = 0.25
  app.controls.enableZoom = true
};

const initScene = function () {


  app.lightObject = new THREE.Object3D();

  let lightGeo = new THREE.BoxGeometry(1, 1, 1);
  let lightMat = new THREE.MeshPhongMaterial({ color: 0xFF0000, flatShading: true, wireframe: false, visible: true, transparent: true });
  app.lightCube = new THREE.Mesh(lightGeo, lightMat);
  app.lightCube.update = () => {
    app.lightCube.position.copy(app.controls.target);
  }
  // app.scene.add(app.lightCube);
  app.lightObject.add(app.lightCube);
  app.scene.add(app.lightObject);

  var light = new THREE.AmbientLight(0x404040, 1); // soft white light
  app.scene.add(light);
  // const ambient = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.15);
  // app.scene.add(ambient);

  app.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  app.directionalLight.position.set(0, 5, 50);
  app.directionalLight.update = (dt) => {
    let normal = new THREE.Vector3().copy(app.controls.target);

    normal.add(app.camera.position);
    normal.normalize();
    normal.multiplyScalar(50);
    // console.log(normal);

    let tar = new THREE.Vector3(0, 0, 0);

    app.directionalLight.position.copy(app.camera.position);
    app.directionalLight.target.position.copy(app.controls.target);

  }
  app.scene.add(app.directionalLight);
  app.scene.add(app.directionalLight.target);


  app.spotLight = new THREE.SpotLight({ color: 0xffffff, intensity: 100, distance: 0, decay: 0 });
  app.spotLight.position.copy(app.cameraDefaultPos);
  // app.spotLight.target(app.controls);
  app.spotLight.update = (dt) => {
    console.log('update');
    let normal = new THREE.Vector3().copy(app.controls.target);
    normal.add(app.camera.position);
    normal.normalize();
    normal.multiplyScalar(100);
    // console.log(normal);

    let tar = new THREE.Vector3(0, 0, 0);

    // console.log('update spotlight', app.controls.target, app.camera.position);




    // app.spotLight.position.copy(tar.add(normal));
    // app.spotLight.position.copy(app.controls.target);
    app.spotLight.position.copy(app.camera.position);
    app.spotLight.target.position.copy(app.controls.target);


    // app.spotLight.position.x = Math.cos(dt) * 20;
    // app.spotLight.position.z = Math.sin(dt) * 20;
  }
  // app.scene.add(app.spotLight);
  // app.scene.add(app.spotLight.target);

  app.lightHelper = new THREE.SpotLightHelper(app.spotLight);
  app.scene.add(app.lightHelper);

}

const initRaycast = function () {
  const raycastObj = new THREE.BoxGeometry(1, 1, 1);
  const raycastObjMat = new THREE.MeshPhongMaterial({ color: 0xFF0000, flatShading: true, wireframe: false, visible: false, transparent: false });
  app.raycastPos = new THREE.Mesh(raycastObj, raycastObjMat);
  app.scene.add(app.raycastPos);

  const raycastPlane = new THREE.PlaneGeometry(150, 150, 32, 32);
  const raycastPlaneMat = new THREE.MeshPhongMaterial({ color: 0xff00ff, opacity: 1.0, transparent: true, wireframe: true, visible: false });
  app.raycast.plane = new THREE.Mesh(raycastPlane, raycastPlaneMat);
  app.raycast.plane.name = 'RaycastPlane';
  app.scene.add(app.raycast.plane);

  app.raycastList.push(app.raycast.plane);
};

const createObject = function (props) {
  // console.log('createObject', props);
  if (props === undefined) { props = {}; }
  if (props.name && props.name !== '' && props.mesh) {
    let data = {};

    data.id = props.id;
    data.name = props.name;
    data.type = props.type;
    data.state = {
      visible: true,
      transparent: false,
      groupSelected: false,
      raycastSelected: false,
    }


    if (props.side) {
      data.side = props.side;
    }




    let texture = app.getTexture(props.texture);
    let textureGrey = app.getTexture(props.textureGrey);


    let obj = props.mesh.clone();
    obj.scale.copy(app.objectScale);

    // add test object

    const testObj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0x00FF00, flatShading: true, wireframe: false, visible: true, transparent: false }));
    // obj.children[0].children.push(testObj);
    // obj.children.push(testObj);


    let mesh = obj.children[0];
    // let material = new THREE.MeshPhongMaterial({ color: 0xFF0000, map: texture });
    let material = new THREE.MeshPhongMaterial({ map: texture, transparent: true, visible: data.state.visible });



    obj.name = props.name;



    mesh.material = material;

    data.object = obj;
    // data.object.children.push(mesh);

    data.mesh = mesh;
    data.material = material;
    data.texture = texture;
    data.textureGrey = textureGrey;

    return data;
  }
  else {
    return null;
  }
}

const updateScene = function () {
  // console.log('updateScene');

  // console.log(app.objectList);
  if (app.scene) {
    if (app.objectList && app.objectList.length > 0) {
      for (let i in app.objectList) {

        app.scene.add(app.objectList[i].object);
      }
    }
  }
};

const update = function () {
  app.controls.update(app.clock.getDelta());

  const cameraPos = app.cameraLastPos ? app.cameraLastPos : new THREE.Vector3(0, 0, 0).copy(app.camera.position);
  const targetPos = new THREE.Vector3(0, 0, 0).copy(app.controls.target);

  if (cameraPos.distanceTo(targetPos) > 100) {
    // console.log(cameraPos, targetPos, cameraPos.distanceTo(targetPos));

    // let norm = cameraPos;
    // norm.normalize();
    // norm.multiplyScalar(100);
    // app.camera.position.copy(norm);


    // $$$ CLAMP MAX CAMERA DISTANCE
    // app.camera.position.copy(cameraPos);
    // if (cameraPos.distanceTo(targetPos) > 90) {
    //   let norm = cameraPos;
    //   norm.normalize();
    //   norm.multiplyScalar(90);
    //   app.camera.position.copy(norm);
    // }
  }
  // if( cameraPos.distanceTo(targetPos) < 90 ) {
  //     app.controls.update(app.clock.getDelta());
  // }

  app.cameraLastPos = new THREE.Vector3(0, 0, 0).copy(app.camera.position);


  app.directionalLight.update(app.clock.getDelta());
  app.spotLight.update(app.clock.getDelta());
  app.lightHelper.update();
  app.lightCube.update();
}

app.initialize();

