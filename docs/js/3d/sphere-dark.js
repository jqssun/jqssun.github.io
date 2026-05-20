(function () {
	"use strict";

	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var HERO_CAMERA_Z = 1000;
	var NAV_CAMERA_Z = 320;
	var LOADER_CAMERA_START_Z = 3400;
	var LOADER_MIN_MS = 1200;

	var mouseX = 0;
	var mouseY = 0;
	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;
	var lastClientX = windowHalfX;
	var lastClientY = windowHalfY;
	var hasPointerSample = false;
	var lastPointerTime = 0;
	var velocityX = 0;
	var velocityY = 0;
	var POINTER_IDLE_MS = 120;
	var MAX_VELOCITY = 7;

	var camera;
	var scene;
	var renderer;
	var linesGroup;
	var lineItems = [];
	var particleItems = [];
	var threeContainer;
	var heroInteractionEnabled = false;
	var loaderDone = false;
	var navWarpEnabled = true;
	var navMoveEnabled = true;

	var INFLUENCE = 640;
	var STRENGTH = 320;
	var EASE = 0.16;
	var IDLE_EASE = 0.08;
	var PARTICLE_BASE_SCALE = 2;
	var PARTICLE_BASE_OPACITY = 1;
	var PARTICLE_HIGHLIGHT_OPACITY = 0.2;
	var PARTICLE_HIGHLIGHT_SCALE = 0.22;
	var PARTICLE_BASE_COLOR = new THREE.Color(0xE0E0E0);
	var PARTICLE_HIGHLIGHT_COLOR = new THREE.Color(0xFF0000);
	var particleColorScratch = new THREE.Color();

	var baseVector = new THREE.Vector3();
	var dispVector = new THREE.Vector3();
	var rightScaled = new THREE.Vector3();
	var upScaled = new THREE.Vector3();
	var cameraRight = new THREE.Vector3();
	var cameraUp = new THREE.Vector3();
	var projectVector = new THREE.Vector3();

	function createSphereScene(container) {
		var particles;
		var particle;
		var i;
		var PI2 = Math.PI * 2;
		var material;
		var geometry;
		var vertex;
		var vertex2;
		var line;
		var direction;
		var spikeScale;
		var wrap = document.createElement("div");

		wrap.className = "hero__three-container";
		container.appendChild(wrap);
		threeContainer = wrap;

		camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000);
		camera.position.z = HERO_CAMERA_Z;

		scene = new THREE.Scene();
		linesGroup = new THREE.Group();
		scene.add(linesGroup);

		renderer = new THREE.CanvasRenderer({ alpha: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		wrap.appendChild(renderer.domElement);

		material = new THREE.SpriteCanvasMaterial({
			color: 0xE0E0E0,
			transparent: true,
			opacity: PARTICLE_BASE_OPACITY,
			program: function (context) {
				context.beginPath();
				context.arc(0, 0, 0.5, 0, PI2, true);
				context.fill();
			}
		});

		for (i = 0; i < 1000; i++) {
			particle = new THREE.Sprite(material.clone());
			particle.position.x = Math.random() * 2 - 1;
			particle.position.y = Math.random() * 2 - 1;
			particle.position.z = Math.random() * 2 - 1;
			particle.position.normalize();
			particle.position.multiplyScalar(Math.random() * 10 + 360);

			particleItems.push({
				sprite: particle,
				direction: particle.position.clone().normalize(),
				radius: particle.position.length(),
				ox: 0,
				oy: 0
			});

			particle.scale.setScalar(PARTICLE_BASE_SCALE);
			scene.add(particle);
		}

		lineItems = [];

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
	}

	function onWindowResize() {
		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function setPointer(clientX, clientY) {
		if (!heroInteractionEnabled) {
			return;
		}

		var dx;
		var dy;
		var navAmount = loaderDone ? getNavProgress() : 0;
		var allowCameraVelocity = navAmount <= 0.001 || navMoveEnabled;

		mouseX = clientX - windowHalfX;
		mouseY = clientY - windowHalfY;
		lastPointerTime = Date.now();

		if (hasPointerSample && allowCameraVelocity) {
			dx = clientX - lastClientX;
			dy = clientY - lastClientY;
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

		lastClientX = clientX;
		lastClientY = clientY;
		hasPointerSample = true;
	}

	function onDocumentMouseMove(event) {
		setPointer(event.clientX, event.clientY);
	}

	function onDocumentTouchMove(event) {
		if (!event.touches.length) {
			return;
		}

		setPointer(event.touches[0].clientX, event.touches[0].clientY);
	}

	function onDocumentTouchEnd() {
		lastPointerTime = 0;
	}

	function getParticleWarpAmount(item) {
		return Math.min(1, Math.sqrt(item.ox * item.ox + item.oy * item.oy) / STRENGTH);
	}

	function applyParticleWarpHighlight(item, warpAmount) {
		var amount = Math.max(0, Math.min(1, warpAmount));

		if (amount <= 0.001) {
			resetParticleHighlight(item);
			return;
		}

		item.sprite.material.color.copy(
			particleColorScratch.copy(PARTICLE_BASE_COLOR).lerp(PARTICLE_HIGHLIGHT_COLOR, Math.min(1, amount * 1.25))
		);
		item.sprite.material.opacity = Math.min(1, PARTICLE_BASE_OPACITY + amount * PARTICLE_HIGHLIGHT_OPACITY);
		item.sprite.scale.setScalar(PARTICLE_BASE_SCALE * (1 + amount * PARTICLE_HIGHLIGHT_SCALE));
	}

	function resetParticleHighlight(item) {
		item.sprite.material.color.copy(PARTICLE_BASE_COLOR);
		item.sprite.material.opacity = PARTICLE_BASE_OPACITY;
		item.sprite.scale.setScalar(PARTICLE_BASE_SCALE);
	}

	function animateParticles(navAmount) {
		var i;
		var item;
		var pointerActive = heroInteractionEnabled && (Date.now() - lastPointerTime) < POINTER_IDLE_MS;
		var useGravity = navAmount > 0.001 && navWarpEnabled;
		var sx;
		var sy;
		var dx;
		var dy;
		var dist;
		var force;
		var tx;
		var ty;
		var ease;
		var depth;
		var scale;
		var warpAmount;

		if (!particleItems.length) {
			return;
		}

		if (useGravity) {
			cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
			cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
		}

		for (i = 0; i < particleItems.length; i++) {
			item = particleItems[i];

			if (useGravity) {
				if (pointerActive) {
					projectVector.copy(item.direction).multiplyScalar(item.radius);
					projectVector.project(camera);
					sx = (projectVector.x * 0.5 + 0.5) * window.innerWidth;
					sy = (-projectVector.y * 0.5 + 0.5) * window.innerHeight;

					dx = lastClientX - sx;
					dy = lastClientY - sy;
					dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < INFLUENCE && dist > 0.001) {
						force = 1 - dist / INFLUENCE;
						force *= force;
						tx = (dx / dist) * STRENGTH * force;
						ty = (dy / dist) * STRENGTH * force;
						item.ox += (tx - item.ox) * EASE;
						item.oy += (ty - item.oy) * EASE;
					}
				}

				baseVector.copy(item.direction).multiplyScalar(item.radius);
				depth = baseVector.distanceTo(camera.position);
				scale = (2 * Math.tan((camera.fov * Math.PI / 180) / 2) * depth) / window.innerHeight;

				rightScaled.copy(cameraRight).multiplyScalar(item.ox * scale);
				upScaled.copy(cameraUp).multiplyScalar(-item.oy * scale);
				dispVector.copy(baseVector).add(rightScaled).add(upScaled).normalize().multiplyScalar(item.radius);
				item.sprite.position.copy(baseVector).lerp(dispVector, navAmount);
				applyParticleWarpHighlight(item, getParticleWarpAmount(item));
			} else if (navAmount > 0.001) {
				item.sprite.position.copy(item.direction).multiplyScalar(item.radius);
				resetParticleHighlight(item);
			} else {
				ease = IDLE_EASE;
				item.ox += (0 - item.ox) * ease;
				item.oy += (0 - item.oy) * ease;
				item.sprite.position.copy(item.direction).multiplyScalar(item.radius);
				resetParticleHighlight(item);
			}
		}
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

	function getNavProgress() {
		var main = document.querySelector("main.is-nav-driven");

		if (!main) {
			return 0;
		}

		return Math.abs(parseFloat(getComputedStyle(main).getPropertyValue("--nav-progress")) || 0);
	}

	function updateCamera() {
		var targetY = -mouseY + 200;
		var pointerActive = heroInteractionEnabled && (Date.now() - lastPointerTime) < POINTER_IDLE_MS;
		var friction = pointerActive ? 0.9 : 0.97;
		var navAmount = loaderDone ? getNavProgress() : 0;
		var moveBlend = navAmount <= 0.001 ? 1 : (navMoveEnabled ? navAmount : 0);

		if (pointerActive && moveBlend > 0.001) {
			camera.position.x += (mouseX - camera.position.x) * 0.05 * moveBlend;
			camera.position.y += (targetY - camera.position.y) * 0.05 * moveBlend;
		}

		if (heroInteractionEnabled && moveBlend > 0.001) {
			camera.position.x += velocityX * moveBlend;
			camera.position.y += velocityY * moveBlend;

			velocityX *= friction;
			velocityY *= friction;

			if (Math.abs(velocityX) < 0.008) {
				velocityX = 0;
			}
			if (Math.abs(velocityY) < 0.008) {
				velocityY = 0;
			}
		} else if (navAmount > 0.001 && navWarpEnabled && !navMoveEnabled) {
			velocityX = 0;
			velocityY = 0;
			camera.position.x += (0 - camera.position.x) * 0.06 * navAmount;
			camera.position.y += (200 - camera.position.y) * 0.06 * navAmount;
		}

		if (loaderDone) {
			camera.position.z = HERO_CAMERA_Z + (NAV_CAMERA_Z - HERO_CAMERA_Z) * navAmount;
		}

		camera.lookAt(scene.position);
	}

	function renderFrame() {
		var time = Date.now() * 0.001;
		var navAmount = loaderDone ? getNavProgress() : 0;

		updateCamera();
		animateParticles(navAmount);
		animateLines(time);

		renderer.setClearColor(0x000000, 0);
		renderer.render(scene, camera);
	}

	function animate() {
		requestAnimationFrame(animate);
		renderFrame();
	}

	function easeOutCubic(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	function revealHeroUi() {
		var hero = document.getElementById("hero");

		if (!hero) {
			return;
		}

		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				hero.classList.add("is-ui-visible");
			});
		});
	}

	function runLoaderZoom() {
		var hero = document.getElementById("hero");
		var start = null;
		var duration = 1600;
		var pageReady = false;
		var zoomDone = false;

		function beginUiReveal() {
			document.body.classList.remove("is-loading");
			revealHeroUi();
		}

		function maybeFinish() {
			if (!pageReady || !zoomDone || loaderDone) {
				return;
			}

			loaderDone = true;
			heroInteractionEnabled = true;
		}

		function step(timestamp) {
			var progress;

			if (!start) {
				start = timestamp;
			}

			progress = Math.min(1, (timestamp - start) / duration);
			camera.position.z = LOADER_CAMERA_START_Z + (HERO_CAMERA_Z - LOADER_CAMERA_START_Z) * easeOutCubic(progress);
			renderFrame();

			if (progress < 1) {
				requestAnimationFrame(step);
				return;
			}

			camera.position.z = HERO_CAMERA_Z;
			zoomDone = true;
			animate();
			maybeFinish();
		}

		document.body.classList.add("is-loading");
		createSphereScene(hero);
		camera.position.z = LOADER_CAMERA_START_Z;
		renderFrame();
		beginUiReveal();

		if (document.readyState === "complete") {
			pageReady = true;
		} else {
			window.addEventListener("load", function onLoad() {
				window.removeEventListener("load", onLoad);
				pageReady = true;
				maybeFinish();
			});
		}

		window.setTimeout(function () {
			pageReady = true;
			maybeFinish();
		}, LOADER_MIN_MS);

		requestAnimationFrame(step);
	}

	function finishLoadingFallback() {
		document.body.classList.remove("is-loading");
		revealHeroUi();
	}

	function syncInteractionFlags() {
		navWarpEnabled = !!document.querySelector(".sphere-interaction-toggle__option[data-mode=\"warp\"].is-active");
		navMoveEnabled = !!document.querySelector(".sphere-interaction-toggle__option[data-mode=\"move\"].is-active");
	}

	function initInteractionToggle() {
		var toggle = document.querySelector(".sphere-interaction-toggle");
		var options;
		var i;

		if (!toggle) {
			return;
		}

		options = toggle.querySelectorAll(".sphere-interaction-toggle__option");
		syncInteractionFlags();

		for (i = 0; i < options.length; i++) {
			options[i].addEventListener("click", function () {
				this.classList.toggle("is-active");
				this.setAttribute("aria-pressed", this.classList.contains("is-active") ? "true" : "false");
				syncInteractionFlags();
			});
		}
	}

	function init() {
		var hero = document.getElementById("hero");

		document.addEventListener("mousemove", onDocumentMouseMove, false);
		document.addEventListener("touchmove", onDocumentTouchMove, { passive: true });
		document.addEventListener("touchend", onDocumentTouchEnd, false);
		document.addEventListener("touchcancel", onDocumentTouchEnd, false);
		window.addEventListener("resize", onWindowResize, false);
		initInteractionToggle();

		try {
			if (typeof THREE === "undefined" || typeof THREE.CanvasRenderer === "undefined") {
				throw new Error("Three.js renderer unavailable");
			}

			if (hero) {
				runLoaderZoom();
				return;
			}

			if (hero) {
				createSphereScene(hero);
				heroInteractionEnabled = true;
				animate();
				revealHeroUi();
			}
		} catch (err) {
			finishLoadingFallback();

			if (hero) {
				try {
					createSphereScene(hero);
					heroInteractionEnabled = true;
					animate();
					revealHeroUi();
				} catch (innerErr) {
					// Hero sphere unavailable; page content still usable.
				}
			}
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
