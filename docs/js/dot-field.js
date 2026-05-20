(function () {
	"use strict";

	var SPACING = 36;
	var DOT_RADIUS = 1.28;
	var INFLUENCE = 220;
	var STRENGTH = 88;
	var EASE = 0.16;
	var IDLE_EASE = 0.08;
	var DOT_COLOR = "rgba(224, 224, 224, 0.32)";

	function prefersReducedMotion() {
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}

	function initSection(section) {
		var wrap = document.createElement("div");
		wrap.className = "download-section__bg";
		wrap.setAttribute("aria-hidden", "true");

		var canvas = document.createElement("canvas");
		wrap.appendChild(canvas);
		section.insertBefore(wrap, section.firstChild);

		var ctx = canvas.getContext("2d");
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var dots = [];
		var mouse = { x: -1e4, y: -1e4, on: false };
		var running = false;
		var rafId = 0;
		var reducedMotion = prefersReducedMotion();
		var canvasW = 0;
		var canvasH = 0;
		var contentEl = section.querySelector(".work__content, .about__content");

		function sectionPaintHeight() {
			var contentHeight = contentEl ? contentEl.offsetHeight : 0;

			return Math.max(section.clientHeight, contentHeight);
		}

		function buildGrid(w, h) {
			var pad = SPACING * 0.5;
			var x;
			var y;
			dots = [];
			for (y = pad; y < h; y += SPACING) {
				for (x = pad; x < w; x += SPACING) {
					dots.push({ bx: x, by: y, ox: 0, oy: 0 });
				}
			}
		}

		function resize() {
			var w = section.clientWidth;
			var h = sectionPaintHeight();

			canvasW = w;
			canvasH = h;
			wrap.style.height = h + "px";

			canvas.width = Math.max(1, Math.floor(w * dpr));
			canvas.height = Math.max(1, Math.floor(h * dpr));
			canvas.style.width = w + "px";
			canvas.style.height = h + "px";
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			buildGrid(w, h);
		}

		function draw() {
			var i;
			var d;
			var dx;
			var dy;
			var dist;
			var force;
			var tx;
			var ty;
			var ease;
			var t;

			ctx.clearRect(0, 0, canvasW, canvasH);

			if (reducedMotion) {
				ctx.fillStyle = DOT_COLOR;
				for (i = 0; i < dots.length; i++) {
					d = dots[i];
					ctx.beginPath();
					ctx.arc(d.bx, d.by, DOT_RADIUS, 0, Math.PI * 2);
					ctx.fill();
				}
				return;
			}

			for (i = 0; i < dots.length; i++) {
				d = dots[i];
				tx = 0;
				ty = 0;
				t = 0;

				if (mouse.on) {
					dx = mouse.x - d.bx;
					dy = mouse.y - d.by;
					dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < INFLUENCE && dist > 0.001) {
						force = 1 - dist / INFLUENCE;
						force *= force;
						tx = (dx / dist) * STRENGTH * force;
						ty = (dy / dist) * STRENGTH * force;
						t = force;
					}
				}

				ease = mouse.on ? EASE : IDLE_EASE;
				d.ox += (tx - d.ox) * ease;
				d.oy += (ty - d.oy) * ease;

				ctx.beginPath();
				ctx.arc(d.bx + d.ox, d.by + d.oy, DOT_RADIUS, 0, Math.PI * 2);
				ctx.fillStyle = t > 0.05
					? "rgba(224, 224, 224, " + (0.32 + t * 0.28) + ")"
					: DOT_COLOR;
				ctx.fill();
			}
		}

		function loop() {
			draw();
			rafId = requestAnimationFrame(loop);
		}

		function start() {
			if (running) {
				resize();
				return;
			}
			running = true;
			resize();
			if (reducedMotion) {
				draw();
				return;
			}
			rafId = requestAnimationFrame(loop);
		}

		function stop() {
			running = false;
			mouse.on = false;
			if (rafId) {
				cancelAnimationFrame(rafId);
				rafId = 0;
			}
		}

		function setPointer(clientX, clientY) {
			var rect = section.getBoundingClientRect();

			mouse.x = clientX - rect.left;
			mouse.y = clientY - rect.top + section.scrollTop;
			mouse.on = true;
		}

		function onMove(e) {
			setPointer(e.clientX, e.clientY);
		}

		function onTouch(e) {
			if (!e.touches.length) {
				return;
			}
			setPointer(e.touches[0].clientX, e.touches[0].clientY);
		}

		function onLeave() {
			mouse.on = false;
		}

		section.addEventListener("mousemove", onMove);
		section.addEventListener("mouseleave", onLeave);
		section.addEventListener("touchmove", onTouch, { passive: true });
		section.addEventListener("touchend", onLeave);

		function syncActive() {
			if (section.classList.contains("active-screen")) {
				start();
			} else {
				stop();
				if (!reducedMotion) {
					var j;
					for (j = 0; j < dots.length; j++) {
						dots[j].ox = 0;
						dots[j].oy = 0;
					}
				}
			}
		}

		function scheduleResize() {
			if (!running) {
				return;
			}
			resize();
			if (reducedMotion) {
				draw();
			}
		}

		var classObserver = new MutationObserver(syncActive);
		classObserver.observe(section, { attributes: true, attributeFilter: ["class"] });

		if (contentEl) {
			var contentObserver = new MutationObserver(scheduleResize);
			contentObserver.observe(contentEl, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: true
			});
		}

		window.addEventListener("resize", scheduleResize);
		window.addEventListener("hashchange", scheduleResize);
		window.addEventListener("dotfield:resize", scheduleResize);

		syncActive();
	}

	var sections = document.querySelectorAll("#about, #work");
	var i;

	for (i = 0; i < sections.length; i++) {
		sections[i].classList.add("download-section");
		initSection(sections[i]);
	}
})();
