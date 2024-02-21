import * as THREE from 'three';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';

let canvas = document.getElementById('three');
let overlay_start;
let overlay_tutorial;
let overlay_reading;
let overlay_end;
let timer_text;
let score_text;
let form_id;

let timesg1 = [];
let timesg2 = [];
let inference_time2 = -1;
let inference_made2 = -1;
let inference_time1 = -1; // Time taken to make an inference
let inference_made1 = -1; // Whether an inference was made
let choice_time1 = -1; // Time taken to make a choice before test
let choice_time2 = -1;
let age;
let sex;
let colorbl;
let mistakes = 0;
let mistakes1 = 0;
let mistakes2 = 0;

var _group = _group = Math.floor(Math.random() * 2);

window.onload = () => {
    overlay_start = document.getElementById('agreement');
    overlay_tutorial = document.getElementById('tutorial');
    document.getElementById('agree').onclick = () => {
        document.getElementById('info').style.display = 'none';
        document.getElementById('disagree').style.display = 'none';
        document.getElementById('agree').style.display = 'none';
        document.getElementById('questionnaire').style.display = 'block';
        document.getElementById('submit').style.display = 'block'
    };
    document.getElementById('submit').onclick = () => {
        age = document.getElementById('age').value;
        sex = document.getElementById('sex').value;
        colorbl = document.getElementById('colorblindness').value;
        update_score();
        if (!age) {
            return;
        }
        overlay_start.style.display = 'none';
        overlay_tutorial.style.display = 'block';
    };
    document.getElementById('start').onclick = () => {
        overlay_tutorial.style.display = 'none';
        add_pointer_control();
        controls_enabled = true;
        animate();
    };
    document.getElementById('disagree').onclick = () => { window.close() };
    overlay_reading = document.getElementById('reading');
    overlay_end = document.getElementById('endmsg');
    timer_text = document.getElementById('time');
    score_text = document.getElementById('score');
    form_id = document.getElementById('form_id').innerText;
    let try_group = document.getElementById('group').innerText;
    if (!isNaN(try_group)) { _group = Number(try_group) };
};

let end;
let timer;
let controls_enabled = false;
let state = 0;
let phase = 0; // 0
// const _group = Math.floor(Math.random() * 2);
let group = _group;
const TIME = 600; // 600
let time = group ? TIME : TIME / 2;
const COLOR_DISCS = {
    blue: 0x0394fc, 
    pink: 0xf00078, 
    yellow: 0xf0e500
};

// var item = items[Math.floor(Math.random() * items.length)];

const BASE_COLOR_PAIRS_CIRCLE = [
    [false, COLOR_DISCS.blue, -1],
    [false, COLOR_DISCS.pink, 1],
    [false, COLOR_DISCS.yellow, -1]
];
const BASE_COLOR_PAIRS_TRIANGLE = [
    [true, COLOR_DISCS.blue, 1],
    [true, COLOR_DISCS.pink, -1]
];

let COLOR_LIST_G1P1 = [];
while (COLOR_LIST_G1P1.length <= 33) {
    COLOR_LIST_G1P1 = COLOR_LIST_G1P1.concat(BASE_COLOR_PAIRS_CIRCLE);
};
let color_list_g1p1 = Array.from(COLOR_LIST_G1P1);

let COLOR_LIST_G1P2 = [];
while (COLOR_LIST_G1P2.length <= 22) {
    COLOR_LIST_G1P2 = COLOR_LIST_G1P2.concat(BASE_COLOR_PAIRS_TRIANGLE);
};
while (COLOR_LIST_G1P2.length <= 33) {
    COLOR_LIST_G1P2 = COLOR_LIST_G1P2.concat(BASE_COLOR_PAIRS_CIRCLE);
};
let color_list_g1p2 = Array.from(COLOR_LIST_G1P2);

const _SUCCESSES_G2 = 66; // 66
const _SUCCESSES_G1 = _SUCCESSES_G2 / 2; // 33
let success_goal = group ? _SUCCESSES_G2 : _SUCCESSES_G1;
let successes = 0; // 0
let chosen_direction = 0; // -1 for left, 1 for right, and 0 for undefined
let choice_correct = 0;
let stimulus_pair = color_list_g1p1.splice(0, 1)[0];
let switched_group = false;
let exposed = false;

let w = window.innerWidth;
let h = window.innerHeight;
let locked = false;
const direction = new THREE.Vector3;
let cam_pos = new THREE.Vector3;
const J_UNIT = new THREE.Vector3(0, 1, 0);
const LIGHTS = {
    blue: new THREE.Color(0x0000ff),
    magenta: new THREE.Color(0xff00ff),
    yellow: new THREE.Color(0xc2c200)
}

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(w, h);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

let controls = {87: false, 83: false, 65: false, 68: false, 37: false, 39: false};
let player = {
    height: 5,
    turnSpeed: .1,
    speed: 1.4, // .6
    jumpHeight: .9,
    gravity: .08,
    velocity: 0,
    playerJumps: false
};
let clock = new THREE.Clock(false);

const START = new THREE.Vector3(0, player.height, -85);

const camera = new THREE.PerspectiveCamera(55, w/h, .1, 1000);
camera.position.set(START.x, START.y, START.z);
camera.lookAt(0, player.height, 0);

// --- Pointer Control ---
let pointercontrol;
function add_pointer_control() {
    pointercontrol = new PointerLockControls(camera, document.body);
};
// --- Pointer Control END ---

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
// Phase 3 background
scene.fog = new THREE.Fog(scene.background, 100, 300);

window.addEventListener('resize', () => {
    w = window.innerWidth,
    h = window.innerHeight;
    
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});

// PHASE 1 and 2 ENVIRONMENT
let first_phase_meshes = [];
let plane_geometry1 = new THREE.PlaneGeometry(1028, 1028);
let plane_material1 = new THREE.MeshPhongMaterial(0xffffff);
let plane1 = new THREE.Mesh(plane_geometry1, plane_material1);

plane1.rotation.x -= Math.PI / 2;
plane1.receiveShadow = true;
first_phase_meshes.push(plane1);

const circle_geom = new THREE.CircleGeometry(1);
const triangle_geom = new THREE.CircleGeometry(1.5, 3, -Math.PI/2);

const stimuli_material = new THREE.MeshBasicMaterial();
let color_disc = new THREE.Mesh(new THREE.CircleGeometry(1), stimuli_material);
color_disc.position.set(0, 5, 9.9);
first_phase_meshes.push(color_disc);

const wall_material1 = new THREE.MeshPhongMaterial(); // 0x878170
wall_material1.color.set(0x878170);
const wall_material2 = new THREE.MeshPhongMaterial(); // 0x878170
wall_material2.color.set(0x827e65);
const choice_wall_material = new THREE.MeshPhongMaterial();
choice_wall_material.color.set(0x73221d);

const wall_geometry = new THREE.PlaneGeometry(90, 10);
const small_wall_geometry = new THREE.PlaneGeometry(20, 10);


let start_arm_wall_right = new THREE.Mesh(wall_geometry.clone(), wall_material1.clone());
start_arm_wall_right.position.set(-10, 5, -55)
start_arm_wall_right.rotation.y += Math.PI / 2;
first_phase_meshes.push(start_arm_wall_right);

let start_arm_wall_left = new THREE.Mesh(wall_geometry.clone(), wall_material1.clone());
start_arm_wall_left.position.set(10, 5, -55)
start_arm_wall_left.rotation.y -= Math.PI / 2;
first_phase_meshes.push(start_arm_wall_left);

let start_arm_wall_back = new THREE.Mesh(small_wall_geometry.clone(), wall_material1.clone());
start_arm_wall_back.position.set(0, 5, -100);
first_phase_meshes.push(start_arm_wall_back);

let far_end_wall_geometry = new THREE.PlaneGeometry(200, 10);
let far_end_wall = new THREE.Mesh(far_end_wall_geometry, wall_material2.clone());
far_end_wall.position.set(0, 5, 10);
far_end_wall.rotation.x += Math.PI;
first_phase_meshes.push(far_end_wall);

let right_arm = new THREE.Mesh(wall_geometry.clone(), wall_material2.clone());
right_arm.position.set(55, 5, -10);
first_phase_meshes.push(right_arm);

let right_arm_end = new THREE.Mesh(small_wall_geometry.clone(), wall_material1.clone());
right_arm_end.position.set(-100, 5, 0);
right_arm_end.rotation.y += Math.PI / 2;
first_phase_meshes.push(right_arm_end);

let left_arm = new THREE.Mesh(wall_geometry.clone(), wall_material1.clone());
left_arm.position.set(-55, 5, -10);
first_phase_meshes.push(left_arm);

let left_arm_end = new THREE.Mesh(small_wall_geometry.clone(), wall_material1.clone());
left_arm_end.position.set(100, 5, 0);
left_arm_end.rotation.y -= Math.PI / 2;
first_phase_meshes.push(left_arm_end);

let left_arm_choice_wall = new THREE.Mesh(small_wall_geometry.clone(), choice_wall_material.clone());
left_arm_choice_wall.position.set(11, 5, 0);
left_arm_choice_wall.rotation.y -= Math.PI / 2;
first_phase_meshes.push(left_arm_choice_wall);

let right_arm_choice_wall = new THREE.Mesh(small_wall_geometry.clone(), choice_wall_material.clone());
right_arm_choice_wall.position.set(-11, 5, 0);
right_arm_choice_wall.rotation.y += Math.PI / 2;
first_phase_meshes.push(right_arm_choice_wall);

let start_arm_choice_wall = new THREE.Mesh(small_wall_geometry.clone(), choice_wall_material.clone());
start_arm_choice_wall.position.set(0, 5, -11);
first_phase_meshes.push(start_arm_choice_wall);

first_phase_meshes.forEach((mesh) => {scene.add(mesh)});

// PHASE 3 ENVIRONMENT
let last_phase_meshes = [];
let traffic_meshes = [];
let TRAFFIC_COLOR = 0x858585;
let POLE_HEIGHT = 12;
const pole_geometry = new THREE.CylinderGeometry(.25, .25, POLE_HEIGHT, 32);
const pole_material = new THREE.MeshPhongMaterial({color:TRAFFIC_COLOR});
const pole = new THREE.Mesh(pole_geometry, pole_material);
pole.position.y = POLE_HEIGHT / 2;
pole.position.z = 10;
pole.receiveShadow = true;
pole.castShadow = true;
traffic_meshes.push(pole);

const box_geometry = new THREE.BoxGeometry(3, 6, 3);
const box_material = new THREE.MeshPhongMaterial({color: TRAFFIC_COLOR});
const box = new THREE.Mesh(box_geometry, box_material);
box.position.z = 10;
box.position.y = 6 / 3 + POLE_HEIGHT; 
box.receiveShadow = true;
box.castShadow = true;
traffic_meshes.push(box);

let traffic_light_circle1;
if (group == 0) {
    traffic_light_circle1 = new THREE.SphereGeometry(1.4, 32, 16);
} else {
    traffic_light_circle1 = new THREE.CylinderGeometry(1.4, 1.4, 2, 3, 1, false, -Math.PI/2);
};
const traffic_light_material1 = new THREE.MeshPhongMaterial({color: LIGHTS.magenta});
const traffic_light1 = new THREE.Mesh(traffic_light_circle1, traffic_light_material1);
traffic_light1.position.y = POLE_HEIGHT + 0.8;
traffic_light1.position.z = 10 - 3/2 + 0.5;
if (group != 0) {
    traffic_light1.rotateY(-Math.PI/2);
    traffic_light1.rotateZ(-Math.PI/2);
};
traffic_meshes.push(traffic_light1);

let traffic_light_circle2;
if (group == 0) {
    traffic_light_circle2 = new THREE.SphereGeometry(1.4, 32, 16);
} else {
    traffic_light_circle2 = new THREE.CylinderGeometry(1.4, 1.4, 2, 3, 1, false, -Math.PI/2);
};
const traffic_light_material2 = new THREE.MeshPhongMaterial({color: LIGHTS.yellow});
const traffic_light2 = new THREE.Mesh(traffic_light_circle2, traffic_light_material2);
traffic_light2.position.y = POLE_HEIGHT + 3.6;
traffic_light2.position.z = 10 - 3/2 + 0.5;
if (group != 0) {
    traffic_light2.rotateY(-Math.PI/2);
    traffic_light2.rotateZ(-Math.PI/2);
};
traffic_meshes.push(traffic_light2);

const grass_material = new THREE.MeshStandardMaterial({
    roughness: 1,
    color: 0xffffff,
    bumpScale: 1
});

const textureloader = new THREE.TextureLoader();
textureloader.load('assets/wildgrass.png', function (map) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    map.repeat.set(100, 100);
    map.colorSpace = THREE.SRGBColorSpace;
    grass_material.map = map;
    grass_material.needsUpdate = true;
});

// Object:Plane
let plane_geometry2 = new THREE.PlaneGeometry(1028, 1028);
let plane2 = new THREE.Mesh(plane_geometry2, grass_material);

plane2.rotation.x -= Math.PI / 2;
plane2.receiveShadow = true;
last_phase_meshes.push(plane2);

const asphalt_material = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    color: 0xffffff,
    bumpScale: 1
});

const center_asphalt_material = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    color: 0xffffff,
    bumpScale: 1
});

textureloader.load('assets/asphalt.jpg', function (map) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    map.repeat.set(4, 50);
    map.colorSpace = THREE.SRGBColorSpace;
    asphalt_material.map = map;
    asphalt_material.needsUpdate = true;
});

textureloader.load('assets/asphalt.jpg', function (map) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    map.repeat.set(2, 2);
    map.colorSpace = THREE.SRGBColorSpace;
    center_asphalt_material.map = map;
    center_asphalt_material.needsUpdate = true;
});

textureloader.load('assets/asphalt_normal.jpg', function (map) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    map.repeat.set(4, 4);
    map.colorSpace = THREE.SRGBColorSpace;
    asphalt_material.normalMapmap = map;
    asphalt_material.needsUpdate = true;
});

const asphalt_geometry = new THREE.PlaneGeometry(20, 490);
const asphalt_mesh = new THREE.Mesh(asphalt_geometry, asphalt_material);
asphalt_mesh.receiveShadow = true;
asphalt_mesh.rotation.x = - Math.PI / 2;
asphalt_mesh.position.y = 0.1;
asphalt_mesh.position.z = -255;
last_phase_meshes.push(asphalt_mesh);

const asphalt_mesh_right = new THREE.Mesh(asphalt_geometry, asphalt_material);
asphalt_mesh_right.receiveShadow = true;
asphalt_mesh_right.rotation.x = - Math.PI / 2;
asphalt_mesh_right.rotation.z = - Math.PI / 2;
asphalt_mesh_right.position.y = 0.1;
asphalt_mesh_right.position.x = -255;
last_phase_meshes.push(asphalt_mesh_right);

const asphalt_mesh_left = new THREE.Mesh(asphalt_geometry, asphalt_material);
asphalt_mesh_left.receiveShadow = true;
asphalt_mesh_left.rotation.x = - Math.PI / 2;
asphalt_mesh_left.rotation.z = Math.PI / 2;
asphalt_mesh_left.position.y = 0.1;
asphalt_mesh_left.position.x = 255;
last_phase_meshes.push(asphalt_mesh_left);

const asphalt_geometry_center = new THREE.PlaneGeometry(20, 20)
const asphalt_mesh_center = new THREE.Mesh(asphalt_geometry_center, center_asphalt_material);
asphalt_mesh_center.receiveShadow = true;
asphalt_mesh_center.rotation.x = - Math.PI / 2;
asphalt_mesh_center.position.y = 0.1;
last_phase_meshes.push(asphalt_mesh_center);


const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
hemiLight.color.setHSL( 0.1, 1, 0.6 );
hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
hemiLight.position.set( -1, 50, 1 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
dirLight.color.setHSL( 0.1, 1, 0.95 );
dirLight.position.set( - 1, 1.75, 1 );
dirLight.position.multiplyScalar( 30 );
scene.add( dirLight );

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

const d = 50;

dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = - 0.0001;


function initiate_test_environment() {
    // After the participants read everything the overlay will disappear and a new setting will be created
    first_phase_meshes.forEach((mesh) => {scene.remove(mesh)});
    last_phase_meshes.forEach((mesh) => {scene.add(mesh)});
    scene.background = new THREE.Color().setHSL( 0.6, 1, 0.6 );
    scene.fog.color.setHSL(0.6, 1, 0.6);
    if (group == 0) {
        traffic_light1.material.color.set(COLOR_DISCS.yellow);
        traffic_light2.material.color.set(COLOR_DISCS.blue);
    } else if (group == 1) {
        traffic_light1.material.color.set(COLOR_DISCS.pink);
        traffic_light2.material.color.set(COLOR_DISCS.yellow);
    };
};

function switch_group() {
    switched_group = true;
    last_phase_meshes.forEach((mesh) => {scene.remove(mesh)});
    traffic_meshes.forEach((mesh) => {scene.remove(mesh)});
    first_phase_meshes.forEach((mesh) => {scene.add(mesh)});
    scene.background = new THREE.Color(0x000000);
    group = 1;
    switched_group = 1;
    successes = _SUCCESSES_G1;
    success_goal = _SUCCESSES_G2;
    phase = 0;
    exposed = true;
};


document.addEventListener('keydown', ({keyCode}) => {controls[keyCode] = true & controls_enabled});
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
    };
});

function bounding(v) {
    // Do not allow the user get out of the bounds of the maze
    if (chosen_direction == 0) {
        if (v.z > 9.0 || v.z < -99.0) {
            return false;
        };
        if (v.x > 99.0 || v.x < -99.0) {
            return false;
        };
        if (v.z < -9.0 && (v.x < -9.0 || v.x > 9.0)) {
            return false;
        };
    } else if (chosen_direction == -1) {
        if (v.z > 9.0 || v.z < -9.0) {
            return false;
        };
        if (v.x < -9.0 || v.x > 99.0) {
            return false;
        };
    } else if (chosen_direction == 1) {
        if (v.z > 9.0 || v.z < -9.0) {
            return false;
        };
        if (v.x > 9.0 || v.x < -99.0) {
            return false;
        };
    };
    return true;
};

function control() {
    // Control user movement in the maze based on the pressed button
    camera.getWorldDirection(direction);
    cam_pos = camera.position.clone();
    if (controls[87]) { // w
        cam_pos.addScaledVector(direction, player.speed);
    } else if (controls[83]) { // s
        direction.x = -direction.x;
        direction.z = -direction.z;
        cam_pos.addScaledVector(direction, player.speed);
    } else if (controls[65]) { // a
        direction.applyAxisAngle(J_UNIT, Math.PI / 2);
        cam_pos.addScaledVector(direction, player.speed);
    } else if (controls[68]) { // d
        direction.applyAxisAngle(J_UNIT, -Math.PI / 2);
        cam_pos.addScaledVector(direction, player.speed);
    };

    if (Boolean(controls[87] + controls[83] + controls[65] + controls[68]) && bounding(cam_pos)) {
        camera.position.set(cam_pos.x, cam_pos.y, cam_pos.z);
    };

    if (controls[32]) { // space
        if (player.jumps) return false;
        player.jumps = true;
        player.velocity = -player.jumpHeight;
    };
};

function rotate_disc () { color_disc.rotation.x += Math.PI };

function reveal_disc(triangle, color1) {
    color_disc.geometry = triangle ? triangle_geom : circle_geom;
    color_disc.updateMatrix();
    color_disc.material.color.set(color1);
    clock.start();
    rotate_disc();
    setTimeout(() => {
        rotate_disc();
    }, 1300);
};

function show_color_disc() {
    camera.lookAt(0, 5, 9.9);
    if (phase == 0 || phase == 1) {
        reveal_disc(stimulus_pair[0], stimulus_pair[1]);
    } else if (switched_group && phase == 2) {
        reveal_disc(true, COLOR_DISCS.yellow);
    };
};

function show_traffic_light() {
    traffic_meshes.forEach((mesh) => {scene.add(mesh)});
    camera.lookAt(0, 6 / 3 + POLE_HEIGHT, 10);
    let color;
    if (group == 0) { color = COLOR_DISCS.blue } else { color = COLOR_DISCS.yellow };

    setTimeout(() => {
        clock.start();
        setTimeout(() => { traffic_blinking(color) }, 0);
        traffic_light2.material = new THREE.MeshBasicMaterial({color: color});
        traffic_light2.updateMatrix();
        // Measure the time of inference
    }, 300);
};

function traffic_blinking(color) {
    let blinks = 0;
    let materials = [traffic_light_material2, new THREE.MeshBasicMaterial({color: color})];

    function change_material() {
        traffic_light2.material = materials[blinks % 2];
        traffic_light2.updateMatrix();
        blinks += 1;
        if (blinks < 2) {
            setTimeout(change_material, 700);
        };
    };

    setTimeout(change_material, 700);
};

function ixMovementUpdate() {
    player.velocity += player.gravity;
    camera.position.y -= player.velocity;

    if (camera.position.y < player.height) {
        camera.position.y = player.height;
        player.jumps = false;
    };
};

function state_flow() {
    let pos = camera.position.clone();
    // If the participant is in the center of maze
    if (state == 0 && pos.z > -9 && pos.z < 9 && pos.x > -9 && pos.x < 9) {
        state = 1;
        if (phase != 2) {
            show_color_disc();
        } else {
            if (switched_group) {
                show_color_disc();
            } else {
                show_traffic_light();
            };
        };
    };
};

function await_user_direction() {
    if (controls[37]) {
        chosen_direction = -1;
        state = 2;
        left_arm_choice_wall.rotation.y += Math.PI;
    } else if (controls[39]) {
        chosen_direction = 1;
        state = 2;
        right_arm_choice_wall.rotation.y += Math.PI;
    };
    if ((controls[37] || controls[39]) && clock.running) {
        clock.stop();
        choice_correct = chosen_direction == stimulus_pair[2];
    };
};

function await_finish() {
    // Await the user to get to the end of the arm
    // If the user is near the end of any of the choice arms
    if (camera.position.x > 80.0 || camera.position.x < -80.0) {
        // If the user is in the the last, test, phase
        if (phase == 2) {
            if (group == 0) {
                inference_made1 = chosen_direction == -1;
                inference_time1 = clock.elapsedTime.toFixed(7);
                mistakes1 = mistakes;
                mistakes = 0;
                switch_group();
                show_score();
            } else {
                mistakes2 = mistakes;
                inference_made2 = chosen_direction == 1;
                inference_time2 = clock.elapsedTime.toFixed(7);
                document.getElementById('inftime').innerText = inference_time2;
                document.getElementById('inf').innerText = (inference_made2) ? 'Yes' : 'No';
                phase = -1;
                setTimeout(ending_overlay_on, 0);
            };
        } else {
            // Put the user at the start arm
            let results = [stimulus_pair[0], stimulus_pair[1], choice_correct, Number(clock.elapsedTime.toFixed(4))];
            (!exposed ? timesg1 : timesg2).push(results);
            restart_training();
        };
    };
};

function restart_training() {
    // Put the user at the start arm
    // Close the choice arm walls
    if (chosen_direction == 1) {
        right_arm_choice_wall.rotation.y += Math.PI;
    } else {
        left_arm_choice_wall.rotation.y += Math.PI;
    };
    // Evaluate and update the training colors and success
    if (group == 0) {
        if (choice_correct) {
            successes += 1;
            stimulus_pair = color_list_g1p1.splice(Math.floor(Math.random() * color_list_g1p1.length), 1)[0];
        } else {
            successes = 0;
            color_list_g1p1 = Array.from(COLOR_LIST_G1P1);
            mistakes += 1;
        };
    } else if (group == 1) {
        if (choice_correct) {
            successes += 1;
            if (!switched_group && !exposed && successes == success_goal / 2) {
                // If they never switched group weren't exposed but reached half of the success goal make them exposed
                exposed = true;
                mistakes1 = mistakes;
                mistakes = 0;
            };
            if (!exposed) {
                // If they weren't exposed use circles
                stimulus_pair = color_list_g1p1.splice(Math.floor(Math.random() * color_list_g1p1.length), 1)[0];
            } else {
                // If they were exposed use triangles and circles
                // The switched group are exposed by definition
                stimulus_pair = color_list_g1p2.splice(Math.floor(Math.random() * color_list_g1p2.length), 1)[0];
            };
        } else {
            if (!exposed) {
                successes = 0;
                color_list_g1p1 = Array.from(COLOR_LIST_G1P1);
            } else {
                successes = success_goal / 2;
                color_list_g1p2 = Array.from(COLOR_LIST_G1P2);
            };
            mistakes += 1;
        };
    };
    if (successes == success_goal) {
        phase = 2;
        successes = 0;
        if (group == 0) {
            choice_time1 = clock.elapsedTime.toFixed(7);
        } else {
            choice_time2 = clock.elapsedTime.toFixed(7);
        };
        setTimeout(reading_overlay_on, 0);
    };
    state = 0;
    chosen_direction = 0;
    camera.position.set(START.x, START.y, START.z);
    camera.lookAt(0, player.height, 0);
    update_score();
};

function animate() {
    requestAnimationFrame(animate);
    state_flow();
    if (state != 1) {
        control();
    } else if (state == 1) {
        await_user_direction();
    };
    if (state == 2) {
        await_finish();
    };
    ixMovementUpdate();
    renderer.render(scene, camera);
};

// --- Overlay functions ---
function reading_overlay_on() {
    pointercontrol.unlock();
    pointercontrol.disconnect();
    overlay_reading.style.display = 'block';
    controls_enabled = false;

    end = new Date().getTime() + time * 1000;
    timer = setInterval(timer_second, 200);
};

function reading_overlay_off() {
    pointercontrol.connect();
    pointercontrol.lock();
    overlay_reading.style.display = 'none';
    controls_enabled = true;
    hide_score();
    if (!switched_group) {
        setTimeout(initiate_test_environment, 0);
    };
};

function ending_overlay_on() {
    overlay_end.style.display = 'block';
    pointercontrol.unlock();
    pointercontrol.disconnect();
    controls_enabled = false;
    setTimeout(send_data, 0);
};

function show_score() {
    document.getElementById('score').style.display = 'block';
};
function hide_score() {
    document.getElementById('score').style.display = 'none';
};
// --- Overlay functions END ---

// --- Timer ---
function timer_second() {
    let time_left = Math.floor((end - new Date().getTime()) / 1000);

    if (time_left <= 0) {
        clearInterval(timer);
        setTimeout(reading_overlay_off, 0);
        return;
    };
    let seconds = time_left % 60;
    if (seconds < 10) {
        seconds = `0${seconds}`;
    };
    let minutes = Math.floor(time_left / 60);
    if (minutes < 10) {
        minutes = `0${minutes}`;
    };
    timer_text.innerText = `${minutes}:${seconds}`;
};
// --- Timer END ---

function update_score() {
    score_text.innerText = `${successes}/${success_goal}`;
};

async function send_data() {
    const rawResponse = await fetch('/api', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            form_id: form_id,
            data: {
                age: Number(age),
                sex: Number(sex),
                cb: Number(colorbl),
                choice_time1: Number(choice_time1),
                inference1: Number(inference_made1),
                inferencet1: Number(inference_time1),
                choice_time2: Number(choice_time2),
                inference2: Number(inference_made2),
                inferencet2: Number(inference_time2),
                mistakes1: Number(mistakes1),
                mistakes2: Number(mistakes2),
                group: _group
            },
            timesg1: timesg1,
            timesg2: timesg2
        })
    });
    // const content = await rawResponse.json();
    // console.log(content);
};
