// Function to check WebXR support
function checkXRSupport() {
    if (navigator.xr) {
        return navigator.xr.isSessionSupported('immersive-ar');
    }
    return false;
}

// Function to create AR scene
async function createARScene() {
    try {
        const session = await navigator.xr.requestSession('immersive-ar');
        const gl = document.createElement('canvas').getContext('webgl', { xrCompatible: true });
        const xrReferenceSpace = await session.requestReferenceSpace('local');

        // Set up Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: gl.canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Your 3D model loading and rendering code goes here
        const loader = new THREE.GLTFLoader();
        const model = await new Promise((resolve) => {
            loader.load('product1.glb', (gltf) => {
                resolve(gltf.scene);
            });
        });

        // Position and add the model to the scene
        model.position.set(0, 0, -2); // You can adjust the position of the model as needed
        scene.add(model);

        // Handle session end event to clean up
        session.addEventListener('end', () => {
            scene.remove(model); // Remove the model from the scene
            session.removeEventListener('end');
        });

        // Enter the AR session and start rendering
        await session.requestAnimationFrame((time, frame) => renderARFrame(time, frame, renderer, scene, camera, session, xrReferenceSpace));

        // Exit the AR session
        await session.end();
    } catch (error) {
        console.error('Error starting AR session:', error);
    }
}

// Function to render AR frame
function renderARFrame(time, frame, renderer, scene, camera, session, xrReferenceSpace) {
    // Update the 3D model's position and rotation based on the XR frame data
    const pose = frame.getPose(xrReferenceSpace, xrReferenceSpace);
    if (pose) {
        const model = scene.children[0]; // Assuming the model is the first child in the scene
        const position = pose.transform.position;
        const orientation = pose.transform.orientation;
        model.position.set(position.x, position.y, position.z);
        model.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
    }

    // Render the scene
    renderer.render(scene, camera);

    // Request the next animation frame
    session.requestAnimationFrame((time, frame) => renderARFrame(time, frame, renderer, scene, camera, session, xrReferenceSpace));
}

// Main function to start AR when the button is clicked
async function startAR() {
    if (await checkXRSupport()) {
        document.getElementById('startARButton').style.display = 'none';
        await createARScene();
        document.getElementById('startARButton').style.display = 'block';
    } else {
        alert('WebXR AR not supported on this device.');
    }
}

// Event listener for the 'Start AR' button
document.getElementById('startARButton').addEventListener('click', startAR);
