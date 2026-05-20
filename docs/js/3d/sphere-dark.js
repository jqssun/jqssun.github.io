(function () {
	"use strict";

	var SCREEN_WIDTH = window.innerWidth,
		SCREEN_HEIGHT = window.innerHeight,

		mouseX = 0, mouseY = 0,
		windowHalfX = window.innerWidth / 2,
		windowHalfY = window.innerHeight / 2,
		lastClientX = windowHalfX,
		lastClientY = windowHalfY,
		hasPointerSample = false,
		lastPointerTime = 0,
		velocityX = 0,
		velocityY = 0,
		POINTER_IDLE_MS = 120,
		MAX_VELOCITY = 7,

		camera, scene, renderer, linesGroup, lineItems = [];

	init();
	animate();

	function init() {
		var particles, particle;
		var hero = document.getElementById("hero");
		var container = document.createElement("div");
		var i;
		var PI2 = Math.PI * 2;
		var material;
		var geometry;
		var vertex;
		var vertex2;
		var line;
		var direction;
		var spikeScale;

		container.className = "hero__three-container";
		hero.appendChild(container);

		camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
		camera.position.z = 1000;

		scene = new THREE.Scene();
		linesGroup = new THREE.Group();
		scene.add(linesGroup);

		renderer = new THREE.CanvasRenderer({ alpha: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		container.appendChild(renderer.domElement);

		material = new THREE.SpriteCanvasMaterial({
			color: 0xE0E0E0,
			program: function (context) {
				context.beginPath();
				context.arc(0, 0, 0.5, 0, PI2, true);
				context.fill();
			}
		});

		for (i = 0; i < 1000; i++) {
			particle = new THREE.Sprite(material);
			particle.position.x = Math.random() * 2 - 1;
			particle.position.y = Math.random() * 2 - 1;
			particle.position.z = Math.random() * 2 - 1;
			particle.position.normalize();
			particle.position.multiplyScalar(Math.random() * 10 + 360);
			particle.scale.multiplyScalar(2);
			scene.add(particle);
		}

		for (i = 0; i < 600; i++) {
			direction = new THREE.Vector3(
				Math.random() * 2 - 1,
				Math.random() * 2 - 1,
				Math.random() * 2 - 1
			);
			direction.normalize();

			spikeScale = Math.random() * 0.10 + 1;

			geometry = new THREE.Geometry();
			vertex = direction.clone().multiplyScalar(360);
			vertex2 = direction.clone().multiplyScalar(360 * spikeScale);

			geometry.vertices.push(vertex);
			geometry.vertices.push(vertex2);

			line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
				color: 0xE0E0E0,
				transparent: true,
				opacity: 0.25 + Math.random() * 0.55
			}));

			linesGroup.add(line);
			lineItems.push({
				geometry: geometry,
				material: line.material,
				direction: direction,
				extensionMax: Math.max(0.015, spikeScale - 1),
				extensionMin: Math.max(0.006, (spikeScale - 1) * 0.45),
				phase: Math.random() * Math.PI * 2,
				speed: 1.1 + Math.random() * 2.2,
				baseOpacity: line.material.opacity
			});
		}

		document.addEventListener("mousemove", onDocumentMouseMove, false);
		window.addEventListener("resize", onWindowResize, false);
	}

	function onWindowResize() {
		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function onDocumentMouseMove(event) {
		var dx;
		var dy;

		mouseX = event.clientX - windowHalfX;
		mouseY = event.clientY - windowHalfY;

		lastPointerTime = Date.now();

		if (hasPointerSample) {
			dx = event.clientX - lastClientX;
			dy = event.clientY - lastClientY;
			velocityX += dx * 0.04;
			velocityY += -dy * 0.04;

			if (velocityX > MAX_VELOCITY) {
				velocityX = MAX_VELOCITY;
			} else if (velocityX < -MAX_VELOCITY) {
				velocityX = -MAX_VELOCITY;
			}
			if (velocityY > MAX_VELOCITY) {
				velocityY = MAX_VELOCITY;
			} else if (velocityY < -MAX_VELOCITY) {
				velocityY = -MAX_VELOCITY;
			}
		}

		lastClientX = event.clientX;
		lastClientY = event.clientY;
		hasPointerSample = true;
	}

	function animateLines(time) {
		var i;
		var item;
		var pulse;
		var outerRadius = 360;
		var innerRadius;
		var opacityWave;

		for (i = 0; i < lineItems.length; i++) {
			item = lineItems[i];
			pulse = 0.5 + 0.5 * Math.sin(time * item.speed * 1.6 + item.phase);
			innerRadius = outerRadius * (1 + item.extensionMin + (item.extensionMax - item.extensionMin) * pulse);

			item.geometry.vertices[0].copy(item.direction).multiplyScalar(outerRadius);
			item.geometry.vertices[1].copy(item.direction).multiplyScalar(innerRadius);
			item.geometry.verticesNeedUpdate = true;

			opacityWave = 0.72 + 0.28 * Math.sin(time * item.speed * 1.35 + item.phase + 1.2);
			item.material.opacity = item.baseOpacity * opacityWave;
		}
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
	}

	function updateCamera() {
		var targetY = -mouseY + 200;
		var pointerActive = (Date.now() - lastPointerTime) < POINTER_IDLE_MS;
		var friction = pointerActive ? 0.9 : 0.97;

		if (pointerActive) {
			camera.position.x += (mouseX - camera.position.x) * 0.05;
			camera.position.y += (targetY - camera.position.y) * 0.05;
		}

		camera.position.x += velocityX;
		camera.position.y += velocityY;

		velocityX *= friction;
		velocityY *= friction;

		if (Math.abs(velocityX) < 0.008) {
			velocityX = 0;
		}
		if (Math.abs(velocityY) < 0.008) {
			velocityY = 0;
		}

		camera.lookAt(scene.position);
	}

	function render() {
		var time = Date.now() * 0.001;

		updateCamera();

		animateLines(time);

		renderer.setClearColor(0x000000, 0);
		renderer.render(scene, camera);
	}

})();
