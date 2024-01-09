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
  domInputAll: document.getElementById('input-all'),



  domOverlayHelp: document.getElementById('overlay-help'),
  domOverlayMove: document.getElementById('overlay-move'),
  domOverlayMuscle: document.getElementById('overlay-muscle'),
  domOverlayCondition: document.getElementById('overlay-condition'),
  domOverlayScale: document.getElementById('overlay-scale'),
  domOverlayMisc: document.getElementById('overlay-misc'),

  domMetaScaleMin: document.getElementById('meta-scale-min'),
  domMetaScaleMax: document.getElementById('meta-scale-max'),

  domMetaCondition: document.getElementById('meta-condition'),
  domMetaPatients: document.getElementById('meta-condition-patients'),
  domMetaSessions: document.getElementById('meta-condition-sessions'),
  domMetaAge: document.getElementById('meta-condition-age'),
  domMetaMale: document.getElementById('meta-condition-male'),
  domMetaFemale: document.getElementById('meta-condition-female'),

  domMetaMuscle: document.getElementById('meta-muscle'),
  domMetaSide: document.getElementById('meta-side'),
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

  viewAllMuscles: false,

  objectList: [],
  muscleBtxIds: [],

  selectedMuscleGroup: null,
  selectedMuscle: null,

  scaleMin: 0,
  scaleMax: 100,

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

    mousePos: { x: 0, y: 0 }
  },
  raycastPos: null,
  raycaster: new THREE.Raycaster(),
  raycastList: [],

  // JSON data 
  conditions: {
    path: './data/conditions.json',
    list: [],
    fullList: [],
    subPath: './data/conditions/',
    subConditions: [],
  },
  meta: {
    path: './data/conditions/meta.json',
    list: [],
    fullList: [],
  },
  models: {
    path: './data/muscles.json',
    list: [],
    fullList: [],
  },
  modelsMisc: {
    path: './data/misc.json',
    list: [],
    fullList: [],
  },
  textures: {
    path: './data/textures.json',
    list: [],
    fullList: [],
  },

  initialize: function () {

    app.getConditions().then(() => {
      app.getConditionFiles().then(() => {
        app.getMeta().then(() => {
          app.initConditions().then(() => {
            app.getTextures().then(() => {
              app.getModels().then(() => {
                app.loadTextures().then(() => {
                  app.loadModels().then(() => {
                    app.initModels().then(() => {
                      app.updateDom();
                      app.hideLoading();
                      app.initalized = true;
                      console.log('Initialized all data loaded');
                    });
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
    initRaycast();

    app.reset();
    app.loop();
  },
  reset: function () {
    // console.log('Reset');
    app.resetCamera();
    app.resetSelectCondition();
    app.resetSelectMuscles();
    app.resetDom();

    resizeThree();
    app.resetObjects();
    app.resetRaycast();
  },
  resetCamera: function () {
    if (app.renderer) {
      let canvasPadding = 20;
      let canvasHeader = window.innerWidth <= 768 ? 60 : 190;

      let width = window.innerWidth - canvasPadding;
      let height = window.innerHeight - canvasHeader;
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
    app.domInputAll.checked = false;

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
    }, 500);
  },

  getConditions: function () {
    return new Promise(function (resolve, reject) {
      axios.get(app.conditions.path).then(function (response) {
        if (response.data && response.data.length > 0) {
          app.conditions.fullList = response.data;
          for (let i in app.conditions.fullList) {
            app.conditions.fullList[i].id = Number(i) + 1;
          }
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

  getConditionFiles: function () {
    return new Promise(function (resolve, reject) {
      let promises = [];
      if (app.conditions.fullList && app.conditions.fullList.length > 0) {
        for (let i in app.conditions.fullList) {
          let promise = new Promise(function (resolve, reject) {

            const path = `${app.conditions.subPath}${app.conditions.fullList[i].fileName}`;
            axios.get(path).then(function (response) {
              if (response.data && response.data.length > 0) {
                let condition = {
                  id: app.conditions.fullList[i].id,
                  muscles: response.data
                }
                app.conditions.subConditions.push(condition);
                resolve();
              }
              else {
                app.showLoadingError(`Failed to load ${app.conditions[i].fileName}, format or content may be invalid`);
                reject();
              }
            });
          });
          promises.push(promise);
        }
      }
      Promise.all(promises).then(function () {
        resolve();
      })
    });
  },

  getMeta: function () {
    return new Promise(function (resolve, reject) {
      axios.get(app.meta.path).then(function (response) {
        if (response.data && response.data.length > 0) {
          app.meta.fullList = response.data;
          for (let i in app.meta.fullList) {
            app.meta.fullList[i].id = Number(i) + 1;
          }
          resolve();
        }
        else {
          console.log('invalid meta.json');
          app.showLoadingError('Failed to load meta.json, format or content may be invalid');
          reject();
        }
      });
    })
  },

  initConditions: function () {
    return new Promise(function (resolve, reject) {
      if (app.conditions.fullList && app.conditions.fullList.length > 0) {
        if (app.conditions.subConditions && app.conditions.subConditions.length > 0) {
          if (app.meta.fullList && app.meta.fullList.length > 0) {

            let conditions = [];
            for (let i in app.conditions.fullList) {
              let condition = app.conditions.fullList[i];
              condition.muscles = [];
              condition.meta = {};

              for (let c in app.conditions.subConditions) {
                let subCondition = app.conditions.subConditions[c];

                if (condition.id === subCondition.id) {
                  condition.muscles = subCondition.muscles;
                }
              }
              for (let m in app.meta.fullList) {
                let meta = app.meta.fullList[m];
                if (condition.id === meta.id) {
                  condition.meta = meta;
                }
              }
              conditions.push(condition);
            }
            app.conditions.list = conditions;
            resolve();
          }
        }
      }
    });
  },

  getTextures: function () {
    return new Promise(function (resolve, reject) {
      axios.get(app.textures.path).then(function (response) {
        if (response.data && response.data.length > 0) {
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
      axios.get(app.models.path).then(function (response) {
        let max = 0;
        if (response.data) {
          if (response.data.muscles) {
            app.models.fullList = response.data.muscles;
            for (let i = 0; i < app.models.fullList.length; i++) {
              app.models.fullList[i].id = `${i}`;
              if (app.models.fullList[i].models?.length > 0) {
                for (let j = 0; j < app.models.fullList[i].models.length; j++) {
                  app.models.fullList[i].models[j].id = `${i}-${j}`;
                  app.models.fullList[i].models[j].displayName = app.models.fullList[i].displayName;

                  if (!app.models.fullList[i].skipLoad) {
                    max += 1;
                  }
                }
              }
            }
          }
          if (response.data.misc) {
            app.modelsMisc.fullList = response.data.misc;
            for (let i = 0; i < app.modelsMisc.fullList.length; i++) {
              if (app.modelsMisc.fullList[i].models?.length > 0) {
                for (let j = 0; j < app.modelsMisc.fullList[i].models.length; j++) {
                  if (!app.modelsMisc.fullList[i].skipLoad) {
                    max += 1;
                  }
                }
              }
            }
          }
          app.setLoadedMax(max);
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

          if (md.skipLoad) {
            // console.log("skip load -", md.name);
          }
          else if (md?.models && md?.models.length > 0) {
            for (let j in md.models) {
              const cm = md.models[j];
              if (cm.fileName) {
                let promise = new Promise(function (resolve, reject) {
                  app.loader.load(`./obj/${cm.fileName}`, function (model) {
                    app.models.list.push({
                      id: cm.id,
                      type: 'muscle',
                      name: md.name,
                      side: cm.side,
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
          }
        }

        for (let i in app.modelsMisc.fullList) {
          const md = app.modelsMisc.fullList[i];
          if (md?.models && md?.models.length > 0) {
            for (let j in md.models) {
              const cm = md.models[j];
              let promise = new Promise(function (resolve, reject) {
                app.loader.load(`./obj/${cm.fileName}`, function (model) {

                  let obj = {
                    id: md.id,
                    type: 'misc',
                    name: md.name,
                    mesh: model,
                  }
                  if (cm.texture) {
                    obj.texture = cm.texture;
                  }

                  app.modelsMisc.list.push(obj);
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

  setLoadedMax(value) {
    app.loadedMax = value;
    app.domProgress.max = app.loadedMax;
  },

  updateLoadedCount: function () {
    app.loadedCount += 1;

    app.domProgress.value = app.loadedCount;
    app.domProgress.max = app.loadedMax;
    app.domPercentage.innerText = Number(app.loadedCount / app.loadedMax * 100).toFixed(0);
  },

  updateSelectMuscles: function (list) {
    let optionList = [];
    for (let i in app.models.fullList) {

      let match = false;

      if (!app.viewAllMuscles && app.models.fullList[i]?.skipLoad) {
        // console.log('skipped -', app.models.fullList[i].name);
      }
      else {
        for (let j in app.models.fullList[i].children) {
          const child = app.models.fullList[i].children[j];

          for (let l in list) {
            if (child.btxId === list[l].id) {
              match = true;
            }
          }
        }
      }
      if (match) {
        optionList.push(app.models.fullList[i]);
      }
    }

    if (app.domSelectMuscles.options.length > 0) {
      for (let i in app.domSelectMuscles.options) {
        app.domSelectMuscles.remove(i);
      }
    }

    let option = document.createElement('option');
    option.text = app.viewAllMuscles ? 'All muscles' : 'All displayed muscles';
    option.value = null;

    app.domSelectMuscles.add(option);

    for (let i = 0; i < optionList.length; i++) {
      let option = document.createElement('option');

      option.text = `${app.viewAllMuscles && optionList[i].skipLoad ? '** ' : ''} ${optionList[i].displayName} `;
      option.value = optionList[i].id;

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
    for (let i in app.conditions.list) {
      if (app.conditions.list[i].id === id) {
        // app.sele
        let min = null;
        let max = null;
        for (let j in app.conditions.list[i].muscles) {
          if (min === null || app.conditions.list[i].muscles[j].percentageOfSessionsInjected < min) {
            min = app.conditions.list[i].muscles[j].percentageOfSessionsInjected;
          }
          if (max === null || app.conditions.list[i].muscles[j].percentageOfSessionsInjected > max) {
            max = app.conditions.list[i].muscles[j].percentageOfSessionsInjected;
          }
        }

        app.scaleMin = min;
        app.scaleMax = max;

        app.updateObjectsScale();
        app.updateMetaScale();
        app.updateMetaCondition(app.conditions.list[i]);
        app.updateDom();
      }
    }
  },
  selectMuscleGroup: function (idValue) {
    app.resetRaycast();

    app.showOverlayMuscle(true);
    app.showSideBtnLeft(true);
    app.showSideBtnRight(true);

    const id = `${idValue}`;
    app.muscleGroupId = id;

    let muscleMeta = app.getMuscleGroupMeta(id);

    for (let i in app.objectList) {
      let item = app.objectList[i];

      item.state.groupSelected = false;
      item.state.transparent = false;

      if (item.type === 'muscle') {
        if (item.id.indexOf(`${id}-`) === 0) {
          item.state.groupSelected = true;
        }
      }
    }

    app.updateObjects();
    app.updateMetaMuscle(muscleMeta)
    app.updateSideName(muscleMeta.displayName);
  },

  selectMuscle: function (object) {
    app.showOverlayMuscle(true);
    app.showSideBtnLeft(false);
    app.showSideBtnRight(false);

    let muscleMeta = app.getMuscleMeta(object);
    app.updateMetaMuscle(muscleMeta);
  },

  clearSelectedMuscle: function () {
    app.muscleGroupId = null;
    app.muscleBtxIds = [];
    app.muscleId = null;

    app.domSelectMuscles.value = null;

    app.showOverlayMuscle(false);
  },

  selectMisc: function (object) {

    app.showOverlayMisc(true);
    app.showSideBtnLeft(false);
    app.showSideBtnRight(false);

    let miscMeta = {
      name: object.name,
    };

    app.updateMetaMisc(miscMeta);
  },

  getMuscleGroupMeta(id) {

    let meta = {
      name: '',
      percentageOfSessionsInjected: 0,
      botoxAverageDosePerMuscle: 0,
      botoxAverageNumberOfSites: 0,
      dysportAverageDosePerMuscle: 0,
      dysportAverageNumberOfSites: 0
    }

    const _meta = app.calculateGroupMeta(id, meta);

    if (_meta) {
      meta = _meta;
    }
    return meta;
  },

  calculateGroupMeta(id, meta) {
    for (let i in app.models.fullList) {
      if (app.models.fullList[i].id === id) {
        const muscleGroup = app.models.fullList[i];
        meta.name = `${muscleGroup.displayName}`;

        let count = 0;

        let left = 0;
        let right = 0;
        let both = 0;

        for (let j in muscleGroup.children) {
          for (let c in app.conditions.list) {
            for (let m in app.conditions.list[c].muscles) {
              const cMuscle = app.conditions.list[c].muscles[m];

              if (cMuscle.id === muscleGroup.children[j].btxId) {
                if (left === 0 && cMuscle.side === 'left') {
                  left += 1;
                }
                if (right === 0 && cMuscle.side === 'right') {
                  right += 1;
                }
                if (both === 0 && cMuscle.side === 'both') {
                  both += 1;
                }

                count += 1;

                if (cMuscle.percentageOfSessionsInjected > meta.percentageOfSessionsInjected) {
                  meta.percentageOfSessionsInjected = cMuscle.percentageOfSessionsInjected;
                }
                // meta.percentageOfSessionsInjected += cMuscle.percentageOfSessionsInjected;
                meta.botoxAverageDosePerMuscle += cMuscle.botoxAverageDosePerMuscle;
                meta.botoxAverageNumberOfSites += cMuscle.botoxAverageNumberOfSites;
                meta.dysportAverageDosePerMuscle += cMuscle.dysportAverageDosePerMuscle;
                meta.dysportAverageNumberOfSites += cMuscle.dysportAverageNumberOfSites;
              }
            }
          }
        }

        // let count = left + right + both;
        if (count >= 1) {
          // const divide = muscleGroup.children.length > 1 ? 2 : 1;
          const divide = count;
          meta.percentageOfSessionsInjected = (meta.percentageOfSessionsInjected).toFixed(2);
          meta.botoxAverageDosePerMuscle = (meta.botoxAverageDosePerMuscle / divide).toFixed(2);
          meta.botoxAverageNumberOfSites = (meta.botoxAverageNumberOfSites / divide).toFixed(2);
          meta.dysportAverageDosePerMuscle = (meta.dysportAverageDosePerMuscle / divide).toFixed(2);
          meta.dysportAverageNumberOfSites = (meta.dysportAverageNumberOfSites / divide).toFixed(2);
        }
      }
    }
  },

  getMuscleMeta(muscle) {
    const id = muscle.id.slice(0, muscle.id.indexOf('-'));

    let meta = {
      name: '',
      percentageOfSessionsInjected: 0,
      botoxAverageDosePerMuscle: 0,
      botoxAverageNumberOfSites: 0,
      dysportAverageDosePerMuscle: 0,
      dysportAverageNumberOfSites: 0
    }

    let count = 0;

    for (let i in app.models.fullList) {
      if (app.models.fullList[i].id === id) {
        const muscleGroup = app.models.fullList[i];
        meta.name = `${muscleGroup.displayName} (${muscle.side})`;

        for (let j in muscleGroup.children) {
          for (let c in app.conditions.list) {
            if (app.conditionId === app.conditions.list[c].id)
              for (let m in app.conditions.list[c].muscles) {
                const cMuscle = app.conditions.list[c].muscles[m];

                if (cMuscle.id === muscleGroup.children[j].btxId) {
                  if (muscle.side === muscleGroup.children[j].side) {
                    count += 1;
                    if (cMuscle.percentageOfSessionsInjected > meta.percentageOfSessionsInjected) {
                      meta.percentageOfSessionsInjected = cMuscle.percentageOfSessionsInjected;
                    }
                    // meta.percentageOfSessionsInjected += cMuscle.percentageOfSessionsInjected;
                    meta.botoxAverageDosePerMuscle += cMuscle.botoxAverageDosePerMuscle;
                    meta.botoxAverageNumberOfSites += cMuscle.botoxAverageNumberOfSites;
                    meta.dysportAverageDosePerMuscle += cMuscle.dysportAverageDosePerMuscle;
                    meta.dysportAverageNumberOfSites += cMuscle.dysportAverageNumberOfSites;
                  }
                }
              }
          }
        }
      }
    }

    if (count >= 1) {
      const divide = count;
      meta.percentageOfSessionsInjected = (meta.percentageOfSessionsInjected).toFixed(2);
      meta.botoxAverageDosePerMuscle = (meta.botoxAverageDosePerMuscle / divide).toFixed(2);
      meta.botoxAverageNumberOfSites = (meta.botoxAverageNumberOfSites / divide).toFixed(2);
      meta.dysportAverageDosePerMuscle = (meta.dysportAverageDosePerMuscle / divide).toFixed(2);
      meta.dysportAverageNumberOfSites = (meta.dysportAverageNumberOfSites / divide).toFixed(2);
    }

    return meta;
  },

  resetSelectCondition: function () {

    app.conditionId = null;
    app.domSelectConditions.selectedIndex = 0;

    // app.showSidesButtons(false);
    app.showSideBtnLeft(false);
    app.showSideBtnRight(false);
    app.showGroupMove(true);

    app.showOverlayCondition(false);
    app.showOverlayScale(false);
  },

  resetSelectMuscles: function () {
    app.muscleGroupId = null;
    app.muscleBtxIds = [];
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
            if (app.models.list[i].multi) {
              objProps.multi = app.models.list[i].multi
            }

            let obj = createObject(objProps);
            // obj.object.scale
            app.objectList.push(obj);
            if (obj.mesh && obj.mesh.length > 0) {
              for (let i in obj.mesh) {
                app.raycastList.push(obj.mesh[i]);
              }
            }
            else {
              app.raycastList.push(obj.mesh);
            }

          }
        }
      }
      if (app.modelsMisc.list && app.modelsMisc.list.length > 0) {
        for (let i in app.modelsMisc.list) {
          let objProps = {
            id: app.modelsMisc.list[i].id,
            type: app.modelsMisc.list[i].type,
            name: app.modelsMisc.list[i].name,
            mesh: app.modelsMisc.list[i].mesh,
            texture: app.modelsMisc.list[i].texture,
          }
          if (app.models.list[i].multi) {
            objProps.multi = app.models.list[i].multi
          }

          let obj = createObject(objProps);
          // obj.object.scale.multiplyScalar(8.0);
          app.objectList.push(obj);
          if (obj.mesh && obj.mesh.length > 0) {
            for (let i in obj.mesh) {
              app.raycastList.push(obj.mesh[i]);
            }
          }
          else {
            app.raycastList.push(obj.mesh);
          }
        }
      }
      addObjectsToScene();
      resolve();
    });

  },

  updateMetaScale: function () {
    if (app.domMetaScaleMin && app.scaleMin !== null) { app.domMetaScaleMin.innerHTML = `${app.scaleMin.toFixed(2)}%` }
    if (app.domMetaScaleMax && app.scaleMax !== null) { app.domMetaScaleMax.innerHTML = `≥${app.scaleMax.toFixed(2)}%` }
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
    if (app.domMetaSide) { app.domMetaSide.innerHTML = muscle.side }
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
    if (app.domSideName && name) {
      app.domSideName.innerHTML = name.length > 15 ? `${name.slice(0, 12)}..` : name;
    }
  },

  updateDom: function () {
    let muscles = [];
    let conditions = [];

    // check conditions
    if (app.conditionId === null) {
      for (let i in app.conditions.list) {
        // app
        if (app.conditions.list[i].muscles && app.conditions.list[i].muscles.length > 0) {
          conditions.push(app.conditions.list[i]);
        }
      }
      app.resetSelectCondition();
      app.updateSelectConditions(conditions);
    }

    // check muscles
    let conditionMuscles = [];
    if (app.conditionId !== null) {

      for (let c in app.conditions.list) {
        if (app.conditions.list[c].id === app.conditionId) {
          for (let cm in app.conditions.list[c].muscles) {
            const condMuscle = app.conditions.list[c].muscles[cm];
            let match = true;
            if (condMuscle.percentageOfSessionsInjected === '') {
              match = false;
            }
            if (match) {
              let data = {
                id: condMuscle.id,
                name: condMuscle.name,
                muscles: [],
              };
              data.muscles.push(condMuscle);
              conditionMuscles.push(data);
            }
          }
        }
      }

      for (let i in conditionMuscles) {
        muscles.push(conditionMuscles[i]);
      }

      app.conditionMuscles = conditionMuscles;
      app.resetSelectMuscles();
      app.updateSelectMuscles(muscles);
    }
  },
  updateObjects: function () {
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

    for (let o = 0; o < app.objectList.length; o++) {
      let muscle = app.objectList[o];
      if (muscle.type === 'muscle') {

        const id = muscle.id.slice(0, muscle.id.indexOf('-'));
        let percentage = 0;
        let count = 0;

        for (let i in app.models.fullList) {
          const muscleGroup = app.models.fullList[i];

          if (id === muscleGroup.id) {
            for (let j in muscleGroup.children) {

              for (let c in app.conditions.list) {
                if (app.conditionId === app.conditions.list[c].id) {

                  for (let m in app.conditions.list[c].muscles) {
                    const cMuscle = app.conditions.list[c].muscles[m];

                    if (muscleGroup.children[j].btxId === cMuscle.id) {
                      if (muscleGroup.children[j].side === cMuscle.side) {

                        // count += 1;
                        if (cMuscle.percentageOfSessionsInjected > percentage) {
                          percentage = cMuscle.percentageOfSessionsInjected;
                        }
                        // percentage += cMuscle.percentageOfSessionsInjected;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        let colours = [
          new THREE.Color(0x01cdcb), // blue
          new THREE.Color(0x32b229), // green
          new THREE.Color(0xfccf2b), // yellow
          // new THREE.Color(0xff8c00), // orange
          new THREE.Color(0xe9542e), // red
        ];


        if (count >= 1) {
          percentage = (percentage / count);
        }


        if (percentage === 0) {
          // colour white 
          muscle.scaleColor.copy(app.colorMuscle)
        }
        else if (percentage <= (app.scaleMax / 33)) {
          muscle.scaleColor = new THREE.Color(colours[0]).lerp(colours[1], percentage / (app.scaleMax * 0.33));
          // console.log(muscle.name, percentage, app.scaleMax * 0.33, percentage / (app.scaleMax * 0.33));
        }
        else if (percentage <= (app.scaleMax / 66)) {
          muscle.scaleColor = new THREE.Color(colours[1]).lerp(colours[2], percentage / (app.scaleMax * 0.66));
          // console.log(muscle.name, percentage, app.scaleMax * 0.66, percentage / (app.scaleMax * 0.66));
        }
        else { //if (percentage <= 66) {
          muscle.scaleColor = new THREE.Color(colours[2]).lerp(colours[3], percentage / app.scaleMax);
          // console.log(muscle.name, percentage, app.scaleMax, percentage / app.scaleMax);
        }
      }
    }
  },

  toggleLeftMuscles: function () {

    app.leftVisible = !app.leftVisible;

    if (app.muscleGroupId !== null) {
      for (let i in app.objectList) {
        let item = app.objectList[i];
        for (let j in app.muscleBtxIds) {
          if (item.id === app.muscleBtxIds[j]) {
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
    app.rightVisible = !app.rightVisible;

    if (app.muscleGroupId !== null) {
      for (let i in app.objectList) {
        let item = app.objectList[i];
        for (let j in app.muscleBtxIds) {
          if (item.id === app.muscleBtxIds[j]) {
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
          const intersectPos = new THREE.Vector3().copy(target.point);
          app.raycastPos.position.copy(intersectPos);
          app.setRaycastTarget(target.object);

          if (app.raycast.moveEnabled && app.raycast.currentObject) {
            var offsetPos = new THREE.Vector3().copy(intersectPos);
            offsetPos.sub(app.raycast.currentObject.object.position);
            app.raycast.positionOffset.copy(offsetPos);

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
      }
      else {
        console.log('clear target');
        app.clearSelectedMuscle();
        app.clearRaycastTarget();
      }

      app.updateObjects();
    }
  },

  setRaycastTarget: function (mesh) {
    for (let i in app.objectList) {
      let item = app.objectList[i];
      item.state.raycastSelected = false;

      if (item.mesh && item.mesh.length > 0) {
        for (let j in item.mesh) {
          if (item.mesh[j].name === mesh.name) {
            item.state.raycastSelected = true;
            app.raycast.currentObject = item;

            if (item.type === 'muscle') {
              app.clearSelectedMuscle();
              app.selectMuscle(item);
            }
            else {
              app.selectMisc(item);
            }
          }
        }
      }
    }
  },
  clearRaycastTarget: function () {
    for (let i in app.objectList) {
      let item = app.objectList[i];
      item.state.raycastSelected = false;
    }
    app.raycast.currentObject = null;
  },

  // event handlers 
  mouseDown: function (event) {
    let mouse = getMousePosition(event, app.renderer.domElement);

    app.raycast.mouseDown = true;
    app.raycast.mousePos = mouse;

    if (app.raycast.moveEnabled) {
      app.raycastFromCamera(mouse);
    }
  },
  mouseMove: function (event) {
    let mouse = getMousePosition(event, app.renderer.domElement);

    if (app.raycast.moveEnabled) {
      // app.controls.enabled = false;
      if (app.raycast.mouseDown) {
        app.raycast.mouseMove = true;
        if (app.raycast.currentObject !== null) {
          // app.controls.enabled = false;

          var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(app.camera);
          var direction = new THREE.Vector3().copy(vector.sub(app.camera.position)).normalize();
          var raycaster = new THREE.Raycaster(app.camera.position, direction);

          var intersects = raycaster.intersectObject(app.raycast.plane);
          if (intersects.length > 0) {
            var position = new THREE.Vector3().copy(intersects[0].point);
            app.raycastPos.position.copy(position);
            position.sub(app.raycast.positionOffset);
            app.raycast.currentObject.object.position.copy(position);
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
              const intersectPos = new THREE.Vector3().copy(target.point);
              app.raycastPos.position.copy(intersectPos);
              app.setRaycastTarget(target.object);
            }
            app.updateObjects();
          }
        }
      }
    }

  },
  mouseUp: function (event) {
    let mouse = getMousePosition(event, app.renderer.domElement);
    var a = app.raycast.mousePos.x - mouse.x;
    var b = app.raycast.mousePos.y - mouse.y;

    let dist = Math.sqrt(a * a + b * b);
    if (!app.raycast.moveEnabled && dist < 0.05) {
      app.raycastFromCamera(mouse);
    }

    if (app.raycast.mouseDown && app.raycast.mouseMove) {
      console.log('clear target');
      app.clearSelectedMuscle();
      app.clearRaycastTarget();
    }

    app.raycast.mouseMove = false;
    app.raycast.mouseDown = false;
  },
  mouseOut: function (event) {

  },

  showMusclesSelect: function (show) { show ? app.domSelectMuscles.classList.remove('hide') : app.domSelectMuscles.classList.add('hide') },
  // showSidesButtons: function (show) { show ? app.domGroupBtnSides.classList.remove('hide') : app.domGroupBtnSides.classList.add('hide') },
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

  app.domInputAll.onclick = (event) => {
    app.viewAllMuscles = !app.viewAllMuscles;
    app.updateDom();
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
    app.resetSelectMuscles();
    app.showSideBtnLeft(true);
    app.showSideBtnRight(true);
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

      app.showSideBtnLeft(true);
      app.showSideBtnRight(true);
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
      app.clearRaycastTarget();
      app.selectMuscleGroup(value);
    }
    else {
      app.resetSelectMuscles();
      app.selectCondition(app.conditionId);
      app.updateObjects();
      app.updateSideName('All Muscles');
    }
  }
};

const initDom = function () {
  app.showButtonReset(true);
}

const onResize = function (event) {
  clearTimeout(app.resizeEnd);
  app.resizeEnd = setTimeout(function () {
    var evt = new Event('resize-end');
    window.dispatchEvent(evt);
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
  app.controls.enableDamping = true
  app.controls.dampingFactor = 0.25
  app.controls.enableZoom = true
};

const initScene = function () {
  var light = new THREE.AmbientLight(0x404040, 1); // soft white light
  app.scene.add(light);

  app.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  app.directionalLight.position.set(0, 5, 50);
  app.directionalLight.update = (dt) => {
    let normal = new THREE.Vector3().copy(app.controls.target);

    normal.add(app.camera.position);
    normal.normalize();
    normal.multiplyScalar(50);

    app.directionalLight.position.copy(app.camera.position);
    app.directionalLight.target.position.copy(app.controls.target);
  }
  app.scene.add(app.directionalLight);
  app.scene.add(app.directionalLight.target);

  app.spotLight = new THREE.SpotLight({ color: 0xffffff, intensity: 100, distance: 0, decay: 0 });
  app.spotLight.position.copy(app.cameraDefaultPos);
  app.spotLight.update = (dt) => {
    let normal = new THREE.Vector3().copy(app.controls.target);
    normal.add(app.camera.position);
    normal.normalize();
    normal.multiplyScalar(100);

    app.spotLight.position.copy(app.camera.position);
    app.spotLight.target.position.copy(app.controls.target);
  }

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

    let mesh = obj.children;

    let color = new THREE.Color(0xFF0000);
    if (data.type === 'muscle') {
      color.copy(app.colorMuscle);
    }
    if (data.type === 'misc') {
      color.copy(app.colorBone);
    }

    let material = new THREE.MeshPhongMaterial({ color: color, map: texture ? texture : null, transparent: true, visible: data.state.visible });

    obj.name = props.name;
    if (mesh) {
      for (let i in mesh) {
        mesh[i].material = material;
      }
    }

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

const addObjectsToScene = function () {
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

    // CLAMP MAX CAMERA DISTANCE
    // app.camera.position.copy(cameraPos);
    // if (cameraPos.distanceTo(targetPos) > 90) {
    //   let norm = cameraPos;
    //   norm.normalize();
    //   norm.multiplyScalar(90);
    //   app.camera.position.copy(norm);
    // }
  }

  app.cameraLastPos = new THREE.Vector3(0, 0, 0).copy(app.camera.position);

  app.directionalLight.update(app.clock.getDelta());
  app.spotLight.update(app.clock.getDelta());
  app.lightHelper.update();
}

app.initialize();

