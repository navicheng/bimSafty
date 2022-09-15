<template>
  <div>
    <el-dialog
      title="提示"
      :visible.sync="dialogVisible"
      width="400px">
      <span>点击按钮选择模型文件</span>
      <span slot="footer" class="dialog-footer">
    <el-button type="primary">
            <label id="fileInputGLTF" for="fileGLTF" title="Import glb from File">打开GLB文件
        <input id="fileGLTF" name="fileGLTF" type="file" accept=".glb" multiple style="display:none"
               @change="doLoadModel()"/>
      </label>
    </el-button>
  </span>
    </el-dialog>

    <el-row style="z-index: 9000; position:fixed; bottom:150px; left:50px;">
      <el-col>
        <el-button type="primary" icon="el-icon-circle-plus-outline" circle
                   @click="addRiskInGlb"></el-button>
      </el-col>
      <el-col>
        <el-button type="primary" icon="el-icon-location" circle
                   @click="resetCamera"></el-button>
      </el-col>
      <el-col>
        <el-button type="primary" icon="el-icon-download" circle
                   @click="exportGltf"></el-button>
      </el-col>

    </el-row>

    <div id="model">
    </div>
  </div>
</template>
<style>
  .el-col {
    margin-bottom: 15px;
  }
</style>

<script async src="https://unpkg.com/es-module-shims@1.3.6/dist/es-module-shims.js"></script>

<script type="importmap">
			{
				"imports": {
					"three": "./vendor/three/build/three.module.js"
				}
			}



</script>

<script>

  import * as THREE from 'three';
  import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
  import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
  import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
  import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js';
  import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';


  var scene = new THREE.Scene();
  var raycaster = new THREE.Raycaster();
  var controls;
  export default {
    name: "viewBimModels",
    data() {
      return {
        camera: null,
        renderer: null,
        file: null,
        dracoLoader: null,
        manager: null,
        INTERSECTED: null,
        intersects: null,
        pointer: null,
        loader: null,
        dialogVisible: false,
        panel: null,
        container: null,
        activeIndex: '1',
        left: null,
        top: null,
        group: null
      };
    },

    methods: {
      doLoadModel() {
        this.dialogVisible = false;
        this.file = document.getElementById('fileGLTF').files[0];
        this.init();
      },

      init() {
        this.container = document.getElementById('model');

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 70);
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(0, 0, 0);

        // this.scene = new THREE.Scene();
        scene.background = new THREE.Color('#eee');

        this.manager = new THREE.LoadingManager();

        const url = URL.createObjectURL(this.file);


        // model
        this.loader = new GLTFLoader(this.manager);


        // Optional: Provide a DRACOLoader instance to decode compressed mesh data
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('/three/js/libs/draco/gltf/');
        this.loader.setDRACOLoader(this.dracoLoader);
        this.dracoLoader.preload();

        this.loader.load(url, (gltf) => {

          gltf.scene.traverse(function (child) {
            if (child.isMesh) {
              child.frustumCulled = false;
              //模型阴影
              child.castShadow = true;
              //模型自发光
              child.material.emissive = child.material.color;
              child.material.emissiveMap = child.material.map;
            }
          })
          scene.add(gltf.scene);

          URL.revokeObjectURL(url);
          this.render();

        });

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.addEventListener('change', this.render); // use if there is no animation loop
        controls.minDistance = 1;
        controls.maxDistance = 500;
        controls.target.set(0, 0, 0);

        window.addEventListener('resize', this.onWindowResize);
        document.addEventListener('dblclick', this.onPointerdblClick);


      },

      onWindowResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.render();

      },

      onPointerdblClick(event) {
        this.pointer = new THREE.Vector2()
        this.left = this.offsetLeft(this.container)
        this.top = this.offsetTop(this.container)
        this.pointer.x = ((event.clientX - this.left) / this.container.clientWidth) * 2 - 1;
        this.pointer.y = -((event.clientY - this.top) / this.container.clientHeight) * 2 + 1;
        raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.pointer, this.camera);
        // calculate objects intersecting the picking ray

        this.intersects = raycaster.intersectObjects(scene.children);
        if (this.intersects.length > 0) {

          if (this.INTERSECTED !== this.intersects[0].object) {

            if (this.INTERSECTED) this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);

            this.INTERSECTED = this.intersects[0].object;
            this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
            this.INTERSECTED.material.emissive.setHex(0xff0000);

          }

        } else {

          if (this.INTERSECTED) this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);

          this.INTERSECTED = null;

        }

        this.createPanel(this.intersects[0].object.parent.userData.Parameters);
        this.render();
        this.intersects = null;
      },

      createPanel(revitprops) {
        if (!(this.panel === null)) {
          this.panel.destroy();
        }
        this.panel = new GUI({width: 310, autoPlace: true});
        var revitproperty = {};
        for (let p of revitprops) {
          let folder = this.panel.addFolder(p.GroupName);
          for (let r of p.Parameters) {
            revitproperty[r.name] = r.value
            folder.add(revitproperty, r.name,)
          }
          folder.open();
        }
      },

      render() {
        this.renderer.render(scene, this.camera);
      },

      offsetTop(elements) {
        var top = elements.offsetTop;
        var parent = elements.offsetParent;
        while (parent != null) {
          top += parent.offsetTop;
          parent = parent.offsetParent;
        }
        return top;
      },

      offsetLeft(elements) {
        var left = elements.offsetLeft;
        var parent = elements.offsetParent;
        while (parent != null) {
          left += parent.offsetLeft;
          parent = parent.offsetParent;
        }
        return left;
      },

      handleSelect(key, keyPath) {
      },

      resetCamera() {
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(0, 0, 0);
        this.render()
      },

      addRiskInGlb() {
        this.container.addEventListener("click", this.mouseClick);

      },

      mouseClick() {
        this.pointer = new THREE.Vector2()
        this.left = this.offsetLeft(this.container)
        this.top = this.offsetTop(this.container)
        this.pointer.x = ((event.clientX - this.left) / this.container.clientWidth) * 2 - 1;
        this.pointer.y = -((event.clientY - this.top) / this.container.clientHeight) * 2 + 1;
        raycaster.setFromCamera(this.pointer, this.camera);
        this.intersects = raycaster.intersectObjects(scene.children);
        if (this.intersects.length) {
          var map = new THREE.TextureLoader().load('textures/pin.png');
          var material = new THREE.SpriteMaterial({map: map});
          var sprite = new THREE.Sprite(material);
          sprite.position.set(this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z);
          sprite.scale.set(1, 1, 1);
          scene.add(sprite);
        }
        this.render();
        this.container.removeEventListener("click", this.mouseClick);
      },

      exportGltf(){
        this.doExportGltf(scene);
      },

      doExportGltf(input ) {
        const gltfExporter = new GLTFExporter();
        const downloadName= this.file.name
        const options = {
          trs: false,
          onlyVisible: true,
          truncateDrawRange: true,
          binary: true,
          maxTextureSize: Infinity,
        };
        gltfExporter.parse(
          input ,
          function (result) {

            if (result instanceof ArrayBuffer) {
              const link = document.createElement('a');
              link.style.display = 'none';
              document.body.appendChild(link); // Firefox workaround, see #6594
              link.href = URL.createObjectURL(new Blob([result]));
              link.download = downloadName;
              link.click();

              URL.revokeObjectURL( link.href );

            } else {
              console.log('An error happened during parsing');
            }

          },
          function (error) {

            console.log('An error happened during parsing', error);

          },
          options
        );
      }

    },


    mounted() {
      this.dialogVisible = true;
    }

  };

</script>

