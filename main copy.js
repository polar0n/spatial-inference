import * as THREE from 'three';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';

let w = window.innerWidth;
let h = window.innerHeight;
let locked = false;
const direction = new THREE.Vector3;
const J_UNIT = new THREE.Vector3(0, 1, 0)


const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

let controls = {};
let player = {
    height: .5,
    turnSpeed: .1,
    speed: .1,
    jumpHeight: .2,
    gravity: .01,
    velocity: 0,
    playerJumps: false
  };

const camera = new THREE.PerspectiveCamera(55, w/h, .1, 1000);
camera.position.set(0, player.height, -5);
camera.lookAt(0, player.height, 0);

const pointercontrol = new PointerLockControls(camera, document.body);

pointercontrol.addEventListener('lock', function() {
    console.log('locked');
});
pointercontrol.addEventListener('unlock', function() {
    console.log('unlocked')
});

const scene = new THREE.Scene();
scene.background = new THREE.Color("black");

window.addEventListener('resize', () => {
    w = window.innerWidth,
    h = window.innerHeight;
    
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});

// Object:Box1
let BoxGeometry1 = new THREE.BoxGeometry(1, 1, 1);
let BoxMaterial1 = new THREE.MeshBasicMaterial({ color: "white", wireframe: false });
let Box1 = new THREE.Mesh(BoxGeometry1, BoxMaterial1);

Box1.position.y = 3;
Box1.scale.x = Box1.scale.y = Box1.scale.z = .25;
scene.add(Box1);

// Object:Box2
let BoxGeometry2 = new THREE.BoxGeometry(1, 1, 1);
let BoxMaterial2 = new THREE.MeshPhongMaterial({ color: "white", wireframe: false });
let Box2 = new THREE.Mesh(BoxGeometry2, BoxMaterial2);

Box2.position.y = .75;
Box2.position.x = 0;
Box2.receiveShadow = true;
Box2.castShadow = true;

scene.add(Box2);


// Object:Plane
let PlaneGeometry1 = new THREE.PlaneGeometry(10, 10);
let PlaneMaterial1 = new THREE.MeshPhongMaterial({ color: "white", wireframe: false });
let Plane1 = new THREE.Mesh(PlaneGeometry1, PlaneMaterial1);

Plane1.rotation.x -= Math.PI / 2;
Plane1.scale.x = 3;
Plane1.scale.y = 3;
Plane1.receiveShadow = true;
scene.add(Plane1);

// Object:Light:1
// let light1 = new THREE.PointLight("white", .8);
// light1.position.set(0, 3, 0);
// light1.castShadow = true;
// light1.shadow.camera.near = 2.5;
// scene.add(light1);

// Object:Light:2
let light2 = new THREE.AmbientLight("white", .15);
light2.position.set(10, 2, 0);
scene.add(light2);

// Object:Light3
let light3 = new THREE.PointLight("blue", 1);
light3.position.set(2, 2, 2);
light3.castShadow = true;
light3.shadow.camera.near = 2.5;
scene.add(light3);

document.addEventListener('keydown', ({keyCode}) => {controls[keyCode] = true});
document.addEventListener('keyup', ({keyCode}) => {controls[keyCode] = false});
document.addEventListener('click', (event) => {
    if (event.button == 0) {
        if (locked) {
            pointercontrol.unlock();
            locked = false;
        } else {
            pointercontrol.lock();
            locked = true;
        };
    } else if (event.button == 2) {
        // camera.setRotationFromQuaternion(new THREE.Quaternion(0, 0, 1, 0))
    };
});

function control() {
    camera.getWorldDirection(direction);
    // console.log(direction);
    if (controls[87]) { // w
        camera.position.addScaledVector(direction, player.speed);
    } else if (controls[83]) { // s
        direction.x = -direction.x;
        direction.z = -direction.z;
        camera.position.addScaledVector(direction, player.speed);
    } else if (controls[65]) { // a
        // camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        // camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
        direction.applyAxisAngle(J_UNIT, Math.PI / 2);
        camera.position.addScaledVector(direction, player.speed);
    } else if (controls[68]) { // d
        direction.applyAxisAngle(J_UNIT, -Math.PI / 2);
        camera.position.addScaledVector(direction, player.speed);
    };
    if (controls[32]) { // space
        if (player.jumps) return false;
        player.jumps = true;
        player.velocity = -player.jumpHeight;
    };
};

function ixMovementUpdate() {
    player.velocity += player.gravity;
    camera.position.y -= player.velocity;

    if (camera.position.y < player.height) {
        camera.position.y = player.height;
        player.jumps = false;
    };
};

function ixLightCubeAnimation() {
    let a = .01;
    Box1.rotation.x += a;
    Box1.rotation.y += a;
}

const material1 = new THREE.LineBasicMaterial({color: 0x0000ff});

const points1 = [];
points1.push(new THREE.Vector3(-10, 0, 0));
points1.push(new THREE.Vector3(0, 10, 0));
points1.push(new THREE.Vector3(10, 10, 0));

const linegeometry1 = new THREE.BufferGeometry().setFromPoints(points1);
const line1 = new THREE.Line(linegeometry1, material1);

scene.add(line1);

const material2 = new THREE.LineBasicMaterial({color: 0x00ff00});

const points2 = [];
points2.push(new THREE.Vector3(0, 0, -10));
points2.push(new THREE.Vector3(0, 10, 0));
points2.push(new THREE.Vector3(0, 10, 10));

const linegeometry2 = new THREE.BufferGeometry().setFromPoints(points2);
const line2 = new THREE.Line(linegeometry2, material2);

scene.add(line2);

function animate() {
    requestAnimationFrame(animate);
    control();
    ixMovementUpdate();
    ixLightCubeAnimation()
    renderer.render(scene, camera);
};
animate();