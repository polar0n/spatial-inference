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

let inference_time = -1; // Time taken to make an inference
let inference_made; // Whether an inference was made
let age;
let sex;
let mistakes = 0;

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
};

let time = 600; // 600
let controls_enabled = false;
// PSA 10.941600000023842
// NSA 16.75689999997616
let state = 0;
let phase = 0; // 0
let group = Math.floor(Math.random() * 3);
const COLOR_DISCS2 = [0x0394fc, 0xa600f0];
const COLOR_MAP2 = {0: -1, 1: 1};

const COLOR_DISCS4 = [0x0394fc, 0xa600f0, 0xf00078, 0xf0e500];
const COLOR_MAP4 = {0: -1, 1: -1, 2: 1, 3: 1};

const COLOR_DISCS_ANTECEDENTS = [0x00ff00, 0xff0000];

const GOAL_SUCCESS2 = 8;
const GOAL_SUCCESS4 = 32; // 32
const GOAL_SUCCESS42 = 8;
let successes = 0; // 0
let chosen_direction = 0; // -1 for left, 1 for right, and 0 for undefined
let current_color = 0;
let current_antecedent_color = 0;
let phase_direction_modifier = 1;

let w = window.innerWidth;
let h = window.innerHeight;
let locked = false;
const direction = new THREE.Vector3;
let cam_pos = new THREE.Vector3;
const J_UNIT = new THREE.Vector3(0, 1, 0);
const LIGHTS = {
    blue: new THREE.Color(0x0000ff),
    magenta: new THREE.Color(0xff00ff)
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
    speed: .6,
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
}
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

const disc_material = new THREE.MeshBasicMaterial();
let color_disc = new THREE.Mesh(new THREE.CircleGeometry(1), disc_material);
color_disc.position.set(0, 5, 9.9);
first_phase_meshes.push(color_disc);

const wall_material = new THREE.MeshPhongMaterial(); // 0x878170
wall_material.color.set(0x878170);
const choice_wall_material = new THREE.MeshPhongMaterial();
choice_wall_material.color.set(0x73221d);

const wall_geometry = new THREE.PlaneGeometry(90, 10);
const small_wall_geometry = new THREE.PlaneGeometry(20, 10);


let start_arm_wall_right = new THREE.Mesh(wall_geometry.clone(), wall_material.clone());
start_arm_wall_right.position.set(-10, 5, -55)
start_arm_wall_right.rotation.y += Math.PI / 2;
first_phase_meshes.push(start_arm_wall_right);

let start_arm_wall_left = new THREE.Mesh(wall_geometry.clone(), wall_material.clone());
start_arm_wall_left.position.set(10, 5, -55)
start_arm_wall_left.rotation.y -= Math.PI / 2;
first_phase_meshes.push(start_arm_wall_left);

let start_arm_wall_back = new THREE.Mesh(small_wall_geometry.clone(), wall_material.clone());
start_arm_wall_back.position.set(0, 5, -100);
first_phase_meshes.push(start_arm_wall_back);

let far_end_wall_geometry = new THREE.PlaneGeometry(200, 10);
let far_end_wall = new THREE.Mesh(far_end_wall_geometry, wall_material.clone());
far_end_wall.position.set(0, 5, 10);
far_end_wall.rotation.x += Math.PI;
first_phase_meshes.push(far_end_wall);

let right_arm = new THREE.Mesh(wall_geometry.clone(), wall_material.clone());
right_arm.position.set(55, 5, -10);
first_phase_meshes.push(right_arm);

let right_arm_end = new THREE.Mesh(small_wall_geometry.clone(), wall_material.clone());
right_arm_end.position.set(-100, 5, 0);
right_arm_end.rotation.y += Math.PI / 2;
first_phase_meshes.push(right_arm_end);

let left_arm = new THREE.Mesh(wall_geometry.clone(), wall_material.clone());
left_arm.position.set(-55, 5, -10);
first_phase_meshes.push(left_arm);

let left_arm_end = new THREE.Mesh(small_wall_geometry.clone(), wall_material.clone());
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
let POLE_HEIGHT = 18;
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

const traffic_light_geometry1 = new THREE.SphereGeometry(1.4, 32, 16);
const traffic_light_material1 = new THREE.MeshPhongMaterial({color: LIGHTS.blue});
const traffic_light1 = new THREE.Mesh(traffic_light_geometry1, traffic_light_material1);
traffic_light1.position.y = POLE_HEIGHT + 0.8;
traffic_light1.position.z = 10 - 3/2 + 0.5;
traffic_meshes.push(traffic_light1);

const traffic_light_geometry2 = new THREE.SphereGeometry(1.4, 32, 16);
const traffic_light_material2 = new THREE.MeshPhongMaterial({color: LIGHTS.magenta});
const traffic_light2 = new THREE.Mesh(traffic_light_geometry2, traffic_light_material2);
traffic_light2.position.y = POLE_HEIGHT + 3.6;
traffic_light2.position.z = 10 - 3/2 + 0.5;
// traffic_light2.matrixAutoUpdate = false;
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
hemiLight.position.set( 0, 50, 0 );
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


function initiate_phase3() {
    // After the participants read everything the overlay will disappear and a new setting will be created
    first_phase_meshes.forEach((mesh) => {scene.remove(mesh)});
    last_phase_meshes.forEach((mesh) => {scene.add(mesh)});
    scene.background = new THREE.Color().setHSL( 0.6, 1, 0.6 );
    scene.fog.color.setHSL(0.6, 1, 0.6);
    if (group == 0) {
        traffic_light1.material.color.set(COLOR_DISCS2[1]);
        traffic_light2.material.color.set(COLOR_DISCS2[0]);
    } else {
        traffic_light1.material.color.set(COLOR_DISCS4[1]);
        traffic_light2.material.color.set(COLOR_DISCS4[3]);
    };
}


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
    // console.log(cam_pos);
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

function show_color_disc() {
    camera.lookAt(0, 5, 9.9);
    if (group == 0) {
        color_disc.material.color.set(COLOR_DISCS2[current_color]);
        rotate_disc();
        setTimeout(() => {
            rotate_disc();
        }, 1300);
    } else if (group == 1) {
        if (phase == 0) {
            color_disc.material.color.set(COLOR_DISCS4[current_color]);
            rotate_disc();
            setTimeout(() => {
                color_disc.material.color.set(COLOR_DISCS_ANTECEDENTS[current_antecedent_color]);
            }, 1300);
            setTimeout(() => {
                rotate_disc();
            }, 2600);
        } else if (phase == 1) {
            color_disc.material.color.set(COLOR_DISCS4[current_color]);
            rotate_disc();
            setTimeout(() => {
                rotate_disc();
            }, 1300);
        };
        
    } else if (group == 2) {
        color_disc.material.color.set(COLOR_DISCS4[current_color]);
        rotate_disc();
        setTimeout(() => {
            rotate_disc();
        }, 1300);
    };
};

function show_traffic_light() {
    traffic_meshes.forEach((mesh) => {scene.add(mesh)});
    camera.lookAt(0, 6 / 3 + POLE_HEIGHT, 10);
    setTimeout(() => {
        if (group == 0) {
            setTimeout(() => { traffic_blinking(COLOR_DISCS2[0]) }, 0);
            traffic_light2.material = new THREE.MeshBasicMaterial({color: COLOR_DISCS2[0]});
            traffic_light2.updateMatrix();
        } else {
            setTimeout(() => { traffic_blinking(COLOR_DISCS4[3]) }, 0)
            traffic_light2.material = new THREE.MeshBasicMaterial({color: COLOR_DISCS4[3]});
            traffic_light2.updateMatrix();
        };
        // Measure the time of inference
        clock.start();
    }, 300);
};

function traffic_blinking(color) {
    let blinks = 0;
    let materials = [traffic_light_material2, new THREE.MeshBasicMaterial({color: color})];

    function change_material() {
        traffic_light2.material = materials[blinks % 2];
        traffic_light2.updateMatrix();
        blinks += 1;
        if (blinks < 4) {
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
    if (state == 0 && pos.z > -9 && pos.z < 9 && pos.x > -9 && pos.x < 9) {
        state = 1;
        if (phase != 2) { show_color_disc() } else { show_traffic_light() };
    };
}

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
}

function await_finish() {
    // Await the user to get to the end of the arm
    // If the user is near the end of any of the choice arms
    if (camera.position.x > 80.0 || camera.position.x < -80.0) {
        // If the user is in the the last, test, phase
        if (phase == 2) {
            clock.stop();
            inference_time = clock.elapsedTime.toFixed(3);
            document.getElementById('inftime').innerText = inference_time;
            phase = -1;
            if (group == 0) {
                inference_made = camera.position.x < -80.0;
            } else {
                inference_made = camera.position.x > 80.0;
            };
            document.getElementById('inf').innerText = (inference_made) ? 'Yes' : 'No';
            setTimeout(ending_overlay_on, 0);
        } else {
            // Put the user at the start arm
            restart_training();
        };
    };
};

function restart_training() {
    // Put the user at the start arm
    // Close the choice arm walls
    if (chosen_direction == -1) {
        left_arm_choice_wall.rotation.y += Math.PI;
    } else {
        right_arm_choice_wall.rotation.y += Math.PI;
    };
    // Evaluate and update the training colors and success
    if (group == 0) {
        if (COLOR_MAP2[current_color] == phase_direction_modifier * chosen_direction) {
            successes += 1;
            current_color += 1;
            current_color %= 2;
        } else {
            successes = 0;
            mistakes += 1;
        };
        if (successes == GOAL_SUCCESS2) {
            if (phase == 0) {
                phase = 1;
                phase_direction_modifier = -1;
                successes = 0;
            } else if (phase == 1) {
                phase = 2;
                setTimeout(reading_overlay_on, 0);
            };
        };
    } else if (group == 1) {
        if (phase == 0) {
            if (COLOR_MAP4[current_color] == chosen_direction) {
                successes += 1;
                current_color += 1;
                current_color %= 4;
                current_antecedent_color = Math.floor(current_color / 2);
            } else {
                successes = 0;
                mistakes += 1;
            };
            if (successes == GOAL_SUCCESS4) {
                phase = 1;
                phase_direction_modifier = -1;
                successes = 0;
                current_color = 0;
                current_antecedent_color = 0;
            };
        } else if (phase == 1) {
            if (COLOR_MAP4[current_color] == phase_direction_modifier * chosen_direction) {
                successes += 1;
                current_color += 2;
                current_color %= 4;
            } else {
                successes = 0;
                mistakes += 1;
            };
            if (successes == GOAL_SUCCESS42) {
                console.log('next phase');
                phase = 2;
                setTimeout(reading_overlay_on, 0);
            };
        };
    } else if (group == 2) {
        if (phase == 0) {
            if (COLOR_MAP4[current_color] == chosen_direction) {
                console.log('correct', successes);
                successes += 1;
                current_color += 1;
                current_color %= 4;
            } else {
                successes = 0;
                mistakes += 1;
            };
            if (successes == GOAL_SUCCESS4) {
                console.log('next phase');
                phase = 1;
                phase_direction_modifier = -1;
                successes = 0;
                current_color = 0;
            };
        } else if (phase == 1) {
            if (COLOR_MAP4[current_color] == phase_direction_modifier * chosen_direction) {
                console.log('correct', successes);
                successes += 1;
                current_color += 2;
                current_color %= 4;
            } else {
                successes = 0;
                mistakes += 1;
            };
            if (successes == GOAL_SUCCESS42) {
                console.log('next phase');
                phase = 2;
                setTimeout(reading_overlay_on, 0);
            };
        };
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
    setTimeout(timer_second, 1000);
};

function reading_overlay_off() {
    pointercontrol.connect();
    pointercontrol.lock();
    overlay_reading.style.display = 'none';
    controls_enabled = true;
    setTimeout(initiate_phase3, 0);
};

function ending_overlay_on() {
    overlay_end.style.display = 'block';
    pointercontrol.unlock();
    pointercontrol.disconnect();
    controls_enabled = false;
    setTimeout(send_data, 0);
}
// --- Overlay functions END ---

// --- Timer ---
function timer_second() {
    time -= 1;
    if (time <= 0) {
        setTimeout(reading_overlay_off, 0);
        return;
    };
    let seconds = time % 60;
    if (seconds < 10) {
        seconds = `0${seconds}`;
    };
    let minutes = Math.floor(time / 60);
    if (minutes < 10) {
        minutes = `0${minutes}`;
    };
    timer_text.innerText = `${minutes}:${seconds}`;
    setTimeout(timer_second, 1000);
};
// --- Timer END ---

function update_score() {
    score_text.innerText = successes;
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
                inference: Number(inference_made),
                inferencet: Number(inference_time),
                mistakes: mistakes,
                group: group
            }
        })
    });
    const content = await rawResponse.json();

    console.log(content);
};
