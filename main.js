// Packages
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import axios from 'axios';

// Styles
import './style.scss'

const loader = new OBJLoader();

let app = {
  initalized: false,
  resizeEnd: null,
  objectScale: new THREE.Vector3(8, 8, 8),

  // Three JS variables
  clock: new THREE.Clock(),
  cameraLastPos: new THREE.Vector3(0, 0, 0),
  cameraDefaultPos: new THREE.Vector3(0, 150, 50),
  cameraTargetDefaultPos: new THREE.Vector3(0, 150, 0),

  // Loaders
  loader: loader,
  textureLoader: new THREE.TextureLoader(),



  // Overlay
  loadedCount: 0,
  loadedMax: 140,
  showHelp: false,

  // Colors
  colorMuscle: new THREE.Color(0xe09a84),
  colorBone: new THREE.Color(0xd9d0b8),
  colorBg: 0xEEEEEE,


  // Dom selectors
  domContainer: document.getElementById('container'),
  domLoading: document.getElementById('loading'),
  domLoadingGroup: document.getElementById('loading-group'),
  domLoadingError: document.getElementById('loading-error'),
  domLoadingErrorMessage: document.getElementById('loading-error-message'),
  domPercentage: document.getElementById('loading-percentage'),
  domProgress: document.getElementById('loading-progress'),


  domSelectConditions: document.getElementById('select-conditions'),
  domSelectMuscles: document.getElementById('select-muscles'),
  domGroupMove: document.getElementById('group-move'),
  domInputMove: document.getElementById('input-move'),
  domGroupBtnSides: document.getElementById('group-btn-sides'),
  domSideName: document.getElementById('side-name'),
  domBtnSideLeft: document.getElementById('btn-side-left'),
  domBtnSideRight: document.getElementById('btn-side-right'),
  domBtnReset: document.getElementById('btn-reset'),
  domBtnHelp: document.getElementById('btn-help'),
  domBtnHelpClose: document.getElementById('btn-help-close'),


  domOverlayHelp: document.getElementById('overlay-help'),
  domOverlayMove: document.getElementById('overlay-move'),
  domOverlayMuscle: document.getElementById('overlay-muscle'),
  domOverlayCondition: document.getElementById('overlay-condition'),
  domOverlayScale: document.getElementById('overlay-scale'),
  domOverlayMisc: document.getElementById('overlay-misc'),

  domMetaCondition: document.getElementById('meta-condition'),
  domMetaPatients: document.getElementById('meta-condition-patients'),
  domMetaSessions: document.getElementById('meta-condition-sessions'),
  domMetaAge: document.getElementById('meta-condition-age'),
  domMetaMale: document.getElementById('meta-condition-male'),
  domMetaFemale: document.getElementById('meta-condition-female'),

  domMetaMuscle: document.getElementById('meta-muscle'),
  domMetaInjected: document.getElementById('meta-muscle-injected'),
  domMetaBotox: document.getElementById('meta-muscle-botox'),
  domMetaBotoxSessions: document.getElementById('meta-muscle-botox-sessions'),
  domMetaDysport: document.getElementById('meta-muscle-dysport'),
  domMetaDysportSessions: document.getElementById('meta-muscle-dysport-sessions'),

  domMetaMisc: document.getElementById('meta-misc'),

  // dom state variables
  conditionId: null,
  muscleGroupId: null,
  muscleIds: [],
  muscleId: null,

  leftVisible: true,
  rightVisible: true,



  modelList: null,
  textureList: null,

  meshList: [],
  objectList: [],





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



  // JSON data 
  conditions: {
    path: './data/conditions.json',
    downloading: null,
    loading: null,
    list: [],
    rawList: [],
  },
  models: {
    path: './data/muscles.json',
    downloading: null,
    loading: null,
    list: [],
    rawList: [],
  },
  modelsMisc: {
    path: './data/misc.json',
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

  initialize: function () {

    app.getConditions().then(() => {
      app.getTextures().then(() => {
        app.getModels().then(() => {
          app.getModelsMisc().then(() => {
            app.loadTextures().then(() => {
              app.loadModels().then(() => {
                app.initModels().then(() => {
                  app.updateDom();
                  app.hideLoading();
                  app.initalized = true;
                  console.log('Initialized');
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
    initRaycast();

    app.reset();
    app.loop();
  },
  reset: function () {
    console.log('Reset');

    app.resetCamera();

    app.resetSelectCondition();
    app.resetSelectMuscle();

    app.resetDom();

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
      app.controls.enableZoom = true;
    }
  },
  resetObjects: function () {
    for (let i in app.objectList) {
      let item = app.objectList[i];

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

  resetDom: function () {
    app.raycast.moveEnabled = false;
    app.controls.enabled = true;

    app.domInputMove.checked = false;


    app.updateSideName('All Muscles')

    app.showMusclesSelect(false);

    app.showOverlayHelp(false);
    app.showOverlayCondition(false);
    app.showOverlayScale(false);
    app.showOverlayMuscle(false);
    app.showOverlayMisc(false);

    app.showGroupMove(false);

  },
  resetSideBtnLeft: function () {
    app.leftVisible = true;
    app.showSideBtnLeft(app.leftVisible);
  },
  resetSideBtnRight: function () {
    app.rightVisible = true;
    app.showSideBtnRight(app.rightVisible);
  },
  loop: function () {
    let dt = 0.1;

    update(dt);

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

    app.renderer.clear();
    app.renderer.setClearColor(app.colorBg);
    app.renderer.render(app.scene, app.camera);
  },

  hideLoading: function () {
    window.setTimeout(() => {
      app.domLoading.classList.add('anim');
      window.setTimeout(() => {
        app.domLoading.classList.add('hide');
      }, 500);
    }, 2000);
  },

  getConditions: function () {
    return new Promise(function (resolve, reject) {
      app.conditions.downloading = true;

      axios.get(app.conditions.path).then(function (response) {

        console.log('app.conditions', response.data);
        if (response.data && response.data.length > 0) {
          app.conditions.downloading = false;
          app.conditions.loading = true;
          app.conditions.fullList = response.data;

          resolve();
        }
        else {
          console.log('invalid conditions');
          app.showLoadingError('Failed to load conditions.json, format or content may be invalid');
          reject();
        }
      });
    })
  },
  getTextures: function () {
    return new Promise(function (resolve, reject) {
      app.textures.downloading = true;

      axios.get(app.textures.path).then(function (response) {
        if (response.data && response.data.length > 0) {
          app.textures.downloading = false;
          app.textures.loading = true;
          app.textures.fullList = response.data;

          resolve();
        }
        else {
          console.log('invalid textures');
          app.showLoadingError('Failed to load textures.json, format or content may be invalid');
          reject();
        }

      });
    })
  },
  getModels: function () {
    return new Promise(function (resolve, reject) {
      app.models.downloading = true;

      axios.get(app.models.path).then(function (response) {
        if (response.data && response.data.length > 0) {
          app.models.downloading = false;
          app.models.loading = true;
          app.models.fullList = response.data;
          resolve();
        }
        else {
          console.log('invalid muscles');
          app.showLoadingError('Failed to load muscles.json, format or content may be invalid');
          reject();
        }
      });
    });
  },
  getModelsMisc: function () {
    return new Promise(function (resolve, reject) {
      app.modelsMisc.downloading = true;

      axios.get(app.modelsMisc.path).then(function (response) {
        if (response.data) {
          app.modelsMisc.downloading = false;
          app.modelsMisc.loading = true;
          app.modelsMisc.fullList = response.data;

          resolve();
        }
        else {
          console.log('invalid misc');
          app.showLoadingError('Failed to load misc.json, format or content may be invalid');
          reject();
        }
      });
    })
  },


  loadTextures: function () {
    return new Promise(function (resolve, reject) {
      if (app.textureLoader) {
        let promises = [];
        for (let i in app.textures.fullList) {
          let promise = new Promise(function (resolve, reject) {
            app.textureLoader.load('./tex/' + app.textures.fullList[i].path, function (texture) {
              app.textures.list.push({ name: app.textures.fullList[i].name, texture: texture });
              resolve();
            });
          });
          promises.push(promise);
        }
        Promise.all(promises).then(function () {
          resolve();
        })
      }
    });
  },
  loadModels: function () {
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

                app.updateLoadedCount();


                resolve();
              }, function (xhr) {

              },
                function (error) {
                  // console.log('Failed to load ', md.fileName);

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

                app.updateLoadedCount();


                resolve();
              }, function (xhr) {

              },
                function (error) {
                  // console.log('Failed to load ', md.fileName);

                  resolve();
                });
            });
            promises.push(promise);
          }
        }
        Promise.all(promises).then(function () {
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

  updateLoadedCount: function () {
    app.loadedCount += 1;

    app.domProgress.value = app.loadedCount;
    app.domProgress.max = app.loadedMax;

    app.domPercentage.innerText = Number(app.loadedCount / app.loadedMax * 100).toFixed(0);
  },




  updateSelectMuscles: function (list) {
    if (app.domSelectMuscles.options.length > 0) {
      for (let i in app.domSelectMuscles.options) {
        app.domSelectMuscles.remove(i);
      }
    }

    let option = document.createElement('option');
    option.text = 'All muscles'
    option.value = null;

    app.domSelectMuscles.add(option);

    for (let i = 0; i < list.length; i++) {

      // console.log(list[i]);

      let option = document.createElement('option');
      option.text = list[i].name;
      option.value = list[i].id;

      app.domSelectMuscles.add(option);
    }
  },
  updateSelectConditions: function (list) {
    for (let i in list) {
      let option = document.createElement('option');
      option.text = list[i].name;
      option.value = list[i].id;

      app.domSelectConditions.add(option);
    }
  },
  selectCondition: function (id) {
    // console.log('selectCondition', id);
    for (let i in app.conditions.fullList) {
      if (app.conditions.fullList[i].id === id) {
        // app.sele
        app.updateObjectsScale();
        app.updateMetaCondition(app.conditions.fullList[i]);
        app.updateDom();
      }
    }
  },
  selectMuscleGroup: function (id) {
    app.resetRaycast();

    app.showOverlayMuscle(true);


    app.showSidesButtons(true);


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

            app.updateSideName(muscleMeta.name);
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
            // console.log('item', item.id, item.name, item);
            item.state.groupSelected = true;


          }
        }
      }
    }



    app.updateObjects();
    app.updateMetaMuscle(muscleMeta)
  },

  selectMuscle: function (object) {

    app.showOverlayMuscle(true);
    app.showSidesButtons(false);

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
          // console.log(muscle);
          app.domSelectMuscles.value = app.combinedMuscles[i].id;

          muscleMeta.name = app.combinedMuscles[i].name;
          muscleMeta.percentageOfSessionsInjected = app.combinedMuscles[i].muscles[j].percentageOfSessionsInjected;
          muscleMeta.botoxAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].botoxAverageDosePerMuscle;
          muscleMeta.botoxAverageNumberOfSites = app.combinedMuscles[i].muscles[j].botoxAverageNumberOfSites;
          muscleMeta.dysportAverageDosePerMuscle = app.combinedMuscles[i].muscles[j].dysportAverageDosePerMuscle;
          muscleMeta.dysportAverageNumberOfSites = app.combinedMuscles[i].muscles[j].dysportAverageNumberOfSites;

        }
      }
    }
    app.updateMetaMuscle(muscleMeta);
  },

  selectMisc: function (object) {

    app.showOverlayMisc(true);
    app.showSidesButtons(false);

    let miscMeta = {
      name: object.name,
    };

    app.updateMetaMisc(miscMeta);
  },


  resetSelectCondition: function () {

    app.conditionId = null;
    app.domSelectConditions.selectedIndex = 0;

    app.showSidesButtons(false);
    app.showGroupMove(true);

    app.showOverlayCondition(false);
    app.showOverlayScale(false);
  },

  resetSelectMuscle: function () {
    app.muscleGroupId = null;
    app.muscleIds = [];
    app.muscleId = null;

    if (app.domSelectMuscles.options.length > 0) {
      for (let i = app.domSelectMuscles.options.length - 1; i >= 0; i--) {
        app.domSelectMuscles.remove(i);
      }
    }

    let option = document.createElement('option');
    option.text = 'No condition selected'
    option.value = null;

    app.domSelectMuscles.add(option);

    app.showOverlayMuscle(false);
    app.showOverlayMisc(false);
  },

  initModels: function () {
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
              // texture: app.models.list[i].texture,
              // textureGrey: app.models.list[i].textureGrey,
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


  updateMetaCondition: function (condition) {
    if (app.domMetaCondition && condition?.name) { app.domMetaCondition.innerHTML = condition.name }
    if (app.domMetaPatients && condition?.meta?.numberOfPatients) { app.domMetaPatients.innerHTML = condition.meta.numberOfPatients }
    if (app.domMetaSessions && condition?.meta?.numberOfSessions) { app.domMetaSessions.innerHTML = condition.meta.numberOfSessions }
    if (app.domMetaAge && condition?.meta?.averageAge) { app.domMetaAge.innerHTML = Number(condition.meta.averageAge) }
    if (app.domMetaMale && condition?.meta?.percentageMale) { app.domMetaMale.innerHTML = Number(condition.meta.percentageMale) }
    if (app.domMetaFemale && condition?.meta?.percentageFemale) { app.domMetaFemale.innerHTML = Number(condition.meta.percentageFemale) }
  },

  updateMetaMuscle: function (muscle) {
    if (app.domMetaMuscle) { app.domMetaMuscle.innerHTML = muscle.name }
    if (app.domMetaInjected) { app.domMetaInjected.innerHTML = Number(muscle.percentageOfSessionsInjected) }
    if (app.domMetaBotox && muscle?.botoxAverageDosePerMuscle) { app.domMetaBotox.innerHTML = muscle.botoxAverageDosePerMuscle }
    if (app.domMetaBotoxSessions && muscle?.botoxAverageNumberOfSites) { app.domMetaBotoxSessions.innerHTML = Number(muscle.botoxAverageNumberOfSites) }
    if (app.domMetaDysport && muscle?.dysportAverageDosePerMuscle) { app.domMetaDysport.innerHTML = Number(muscle.dysportAverageDosePerMuscle) }
    if (app.domMetaDysportSessions && muscle?.dysportAverageNumberOfSites) { app.domMetaDysportSessions.innerHTML = Number(muscle.dysportAverageNumberOfSites) }
  },

  updateMetaMisc: function (misc) {
    if (app.domMetaMisc) { app.domMetaMisc.innerHTML = misc.name }
  },

  updateSideName: function (name) {
    if (app.domSideName) {
      app.domSideName.innerHTML = name.length > 15 ? `${name.slice(0, 12)}..` : name;
    }
  },

  updateDom: function () {
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
      // console.log('check muscles', combinedMuscles);

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
      item.material.emissiveIntensity = 0.5;

      if (item.state.raycastSelected) {
        item.material.emissive.setHex(0xFF0000);
      }

      let color = new THREE.Color(0xFFFFFF);
      let emissive = new THREE.Color(0x000000);


      if (item.type === 'muscle') {
        color.copy(app.colorMuscle)
      }
      else if (item.type === 'misc') {
        color.copy(app.colorBone);
        item.material.map = item.texture;
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
          // color.copy(this.colorMuscle)
          // color = new THREE.Color(0xdd785a);
          // color = new THREE.Color(0xFFFFFF);
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
            // color.copy(this.colorMuscle)
            // item.material.emissive.setHex(0x000000);
          }
        }
        else {
          // item.transparent = true;
          // item.material.opacity = 0.2;
        }
      }
      item.material.color.copy(color);
      // item.material.emissive.copy(emissive);

    }
  },
  updateObjectsScale: function () {

    // Clear scale colours

    for (let m = 0; m < app.objectList.length; m++) {
      app.objectList[m].scaleColor = new THREE.Color(0xFFFFFF).copy(app.colorMuscle);
    }


    for (let c = 0; c < app.conditions.fullList.length; c++) {
      let cond = app.conditions.fullList[c];

      if (app.conditionId === cond.id) {
        for (let cm = 0; cm < cond.muscles.length; cm++) {
          let condMuscle = cond.muscles[cm];

          for (let m = 0; m < app.objectList.length; m++) {
            let muscle = app.objectList[m];



            if (muscle.id === condMuscle.id && muscle.name === condMuscle.name) {
              // console.log(muscle.id, muscle.name, condMuscle.percentageOfSessionsInjected);
              // if( )

              // muscle.scaleColor = new THREE.Color(0x00FF00);

              if (condMuscle.percentageOfSessionsInjected !== '' && condMuscle.percentageOfSessionsInjected > 0) {
                // console.log(muscle.name, condMuscle.percentageOfSessionsInjected);
                muscle.scaleColor.copy(app.colorMuscle)

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
                  muscle.scaleColor.copy(app.colorMuscle)
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
                muscle.scaleColor.copy(app.colorMuscle)
                // color.copy(this.colorMuscle)

              }
            }
          }
        }
      }
    }
  },

  toggleLeftMuscles: function () {
    // console.log("toggleLeftMuscles", app.leftVisible);

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
    // console.log("toggleRightMuscles", app.rightVisible);
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
    // console.log('raycastFromCamera', mouse);

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
          // console.log('intersected object', target.object);
          const intersectPos = new THREE.Vector3().copy(target.point);
          app.raycastPos.position.copy(intersectPos);
          // let firstObject  = 
          // console.log('raycast target', target.object);
          app.setRaycastTarget(target.object);

          if (app.raycast.moveEnabled && app.raycast.currentObject) {
            var offsetPos = new THREE.Vector3().copy(intersectPos);
            // console.log(target);
            offsetPos.sub(app.raycast.currentObject.object.position);

            app.raycast.positionOffset.copy(offsetPos);
            // console.log('offset', offsetPos);

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
    // console.log('setRaycastTarget', mesh);

    if (app.conditionId !== null) {
      // app.resetObjects();



      for (let i in app.objectList) {
        let item = app.objectList[i];

        if (item.mesh.name === mesh.name) {
          item.state.raycastSelected = true;

          app.raycast.currentObject = item;

          if (item.type === 'muscle') {
            app.selectMuscle(item);
          }
          else {
            app.selectMisc(item);
          }

        }
        else {
          item.state.raycastSelected = false;
        }
      }
    }

  },
  clearRaycastTarget: function () {
    // console.log('clearRaycastTarget');
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

            // console.log(intersects);
            var position = new THREE.Vector3().copy(intersects[0].point);

            app.raycastPos.position.copy(position);

            // console.log('offset move', app.raycast.positionOffset);

            position.sub(app.raycast.positionOffset);
            // let testPos = new THREE.Vector3(0,-5,0);
            // position.sub(testPos);

            // var offsetPos = new THREE.Vector3().copy(intersectPos);
            // console.log(target);
            // offsetPos.sub(target.object.position);

            // app.raycast.positionOffset.copy(offsetPos);

            // let testPos = new THREE.Vector3(0,0,0);
            // position.sub(testPos);

            // console.log('object', app.raycast.currentObject);
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
              // console.log('intersected object', target.object);
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

  showMusclesSelect: function (show) { show ? app.domSelectMuscles.classList.remove('hide') : app.domSelectMuscles.classList.add('hide') },

  showSidesButtons: function (show) { show ? app.domGroupBtnSides.classList.remove('hide') : app.domGroupBtnSides.classList.add('hide') },
  showSideBtnLeft: function (show) { show ? app.domBtnSideLeft.classList.remove('hide') : app.domBtnSideLeft.classList.add('hide') },
  showSideBtnRight: function (show) { show ? app.domBtnSideRight.classList.remove('hide') : app.domBtnSideRight.classList.add('hide') },

  showGroupMove: function (show) {
    if (show) {
      app.domGroupMove.classList.remove('hide')
      app.domInputMove.disabled = false;

    }
    else {
      app.domGroupMove.classList.add('hide')
      app.domInputMove.disabled = true;
    }
  },
  showButtonReset: function (show) { show ? app.domBtnReset.classList.remove('hide') : app.domBtnReset.classList.add('hide') },


  showOverlayCondition: function (show) { show ? app.domOverlayCondition.classList.remove('hide') : app.domOverlayCondition.classList.add('hide') },
  showOverlayScale: function (show) { show ? app.domOverlayScale.classList.remove('hide') : app.domOverlayScale.classList.add('hide') },

  showOverlayHelp: function (show) { show ? app.domOverlayHelp.classList.remove('hide') : app.domOverlayHelp.classList.add('hide') },

  showOverlayMuscle: function (show) {
    if (show) {
      app.domOverlayMuscle.classList.remove('hide');
      app.showOverlayMisc(false);
    }
    else {
      app.domOverlayMuscle.classList.add('hide')
    }
  },
  showOverlayMisc: function (show) {
    if (show) {
      app.domOverlayMisc.classList.remove('hide')
      app.showOverlayMuscle(false);
    }
    else {
      app.domOverlayMisc.classList.add('hide')
    }
  },

  showLoadingError: function (message) {

    app.domLoadingGroup.classList.add('hide');

    app.domLoadingErrorMessage.innerHTML = message ? message : 'Undefined error';
    app.domLoadingError.classList.remove('hide');
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

  // Event functions
  app.domSelectConditions.onchange = (event) => { handleSelectConditions(event) };
  app.domSelectMuscles.onchange = (event) => { handleSelectMuscles(event) };


  app.domBtnSideLeft.onclick = (event) => {
    event.preventDefault();

    if (app.conditionId) {
      app.toggleLeftMuscles();
      app.showSideBtnLeft(app.leftVisible);
    }

    return false;
  }

  app.domBtnSideRight.onclick = (event) => {
    event.preventDefault();
    if (app.conditionId) {
      app.toggleRightMuscles();
      app.showSideBtnRight(app.rightVisible);
    }
    return false;
  }

  app.domInputMove.onclick = (event) => {
    app.raycast.moveEnabled = !app.raycast.moveEnabled;

    app.controls.enabled = !app.raycast.moveEnabled;

    app.raycast.plane.visible = app.raycast.moveEnabled;
    app.raycastPos.visible = app.raycast.moveEnabled;
  }


  app.domBtnReset.onclick = (event) => {
    event.preventDefault();
    app.reset();
  }

  app.domBtnHelp.onclick = (event) => {
    event.preventDefault();

    app.showHelp = !app.showHelp;
    app.showOverlayHelp(app.showHelp);
  }

  app.domBtnHelpClose.onclick = (event) => {
    event.preventDefault();

    app.showHelp = false;
    app.showOverlayHelp(app.showHelp);
  }



  app.domContainer.addEventListener('mousedown', (event) => {
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


  function handleSelectConditions(event) {
    app.resetSelectMuscle();
    app.showSidesButtons(true);
    app.resetObjects();

    app.resetSideBtnLeft();
    app.resetSideBtnRight();

    let value = null;
    if (event.target.value !== '' && event.target.value !== 'null' && event.target.value !== null) {
      value = Number(event.target.value);
    }
    if (value !== null) {
      app.conditionId = value;
      app.selectCondition(value);
      app.showMusclesSelect(true);


      app.showOverlayCondition(true);
      app.showOverlayScale(true);

      app.showSidesButtons(true);
      app.showGroupMove(true);


      app.updateObjects();
    }
    else {
      app.resetSelectCondition();
      app.updateObjects();
      app.showMusclesSelect(false);



    }
  }

  function handleSelectMuscles(event) {

    let value = null;
    if (event.target.value !== '' && event.target.value !== 'null' && event.target.value !== null) {
      value = Number(event.target.value);
    }
    if (value !== null) {
      app.selectMuscleGroup(value);
    }
    else {
      app.resetSelectMuscle();
      app.selectCondition(app.conditionId);
      app.updateObjects();
      app.updateSideName('All Muscles');

    }
  }
};

const initDom = function () {

  app.showButtonReset(true);


}

// DOM EVENTS
const onResize = function (event) {
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
  resizeThree(event);
}

const resizeThree = function (event) {
  if (app.renderer) {

    let width = window.innerWidth - 20;
    let height = (window.innerWidth <= 768 ? window.innerHeight - 210 : window.innerHeight - 80);

    const cameraPos = app.camera.position;
    app.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 10000);
    app.camera.updateProjectionMatrix();
    app.camera.position.copy(cameraPos);

    const controlsTarget = app.controls ? app.controls.target : new THREE.Vector3(0, 0, 0);
    app.controls = new OrbitControls(app.camera, app.renderer.domElement)
    app.controls.target.copy(controlsTarget);
    app.controls.enableZoom = true;

    app.renderer.setSize(width, height);

    app.domRoot = app.domContainer;
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


  app.domRoot = app.domContainer;
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

  // app.lightObject = new THREE.Object3D();
  // let lightGeo = new THREE.BoxGeometry(1, 1, 1);
  // let lightMat = new THREE.MeshPhongMaterial({ color: 0xFF0000, flatShading: true, wireframe: false, visible: true, transparent: true });
  // app.lightCube = new THREE.Mesh(lightGeo, lightMat);
  // app.lightCube.update = () => {
  //   app.lightCube.position.copy(app.controls.target);
  // }
  // app.lightObject.add(app.lightCube);
  // app.scene.add(app.lightObject);

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
    // console.log('update');
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
    if (props.side) { data.side = props.side }

    let texture = app.getTexture(props.texture);
    let textureGrey = app.getTexture(props.textureGrey);

    let obj = props.mesh.clone();
    obj.scale.copy(app.objectScale);

    let mesh = obj.children[0];

    let color = new THREE.Color(0xFF0000);
    if (data.type === 'muscle') {
      color.copy(app.colorMuscle);
    }
    if (data.type === 'misc') {
      color.copy(app.colorBone);
    }


    let material = new THREE.MeshPhongMaterial({ color: color, map: texture ? texture : null, transparent: true, visible: data.state.visible });

    obj.name = props.name;
    if (mesh)
      mesh.material = material;
    data.object = obj;

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
  if (!app.initalized) {
    return;
  }
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
  // app.lightCube.update();
}

app.initialize();

