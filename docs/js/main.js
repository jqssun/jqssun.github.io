(function () {
    "use strict";

    var U = window.siteUtils;
    var main = $("main");
    var hero = $("#hero");
    var work = $("#work");
    var about = $("#about");
    var topTrigger = $(".hero__trigger-button.top");
    var bottomTrigger = $(".hero__trigger-button.bottom");
    var closeBottom = $(".close-button.bottom");
    var closeTop = $(".close-button.top");

    function centerInit() {
        hero.css({
            height: $(window).height()
        });

        about.css({
            height: $(window).height()
        });

        work.css({
            height: $(window).height()
        });
    }

    centerInit();
    $(window).resize(centerInit);
    window.centerInit = centerInit;

    var NAV_DURATION = 500;
    var SCROLL_SENSITIVITY = 0.64;
    var navProgress = 0;
    var navAnimating = false;
    var snapTimer;

    function scrollRange() {
        return $(window).height() * SCROLL_SENSITIVITY;
    }

    function clampProgress(value) {
        return Math.max(-1, Math.min(1, value));
    }

    function syncNavigationState() {
        var aboutVisible = navProgress > 0;
        var workVisible = navProgress < 0;
        var aboutInteractive = navProgress >= 1;
        var workInteractive = navProgress <= -1;

        about.toggleClass("active-screen", aboutVisible).toggleClass("idle", !aboutVisible);
        work.toggleClass("active-screen", workVisible).toggleClass("idle", !workVisible);
        about.css("pointer-events", aboutInteractive ? "" : "none");
        work.css("pointer-events", workInteractive ? "" : "none");
        closeTop.css("opacity", Math.min(1, Math.max(0, navProgress)));
        closeBottom.css("opacity", Math.min(1, Math.max(0, -navProgress)));
    }

    function applyNavigationProgress(progress) {
        navProgress = clampProgress(progress);
        main.addClass("is-nav-driven").removeClass("is-nav-animating");
        main[0].style.setProperty("--nav-progress", navProgress);
        syncNavigationState();
    }

    function animateNavigationProgress(target, duration) {
        duration = duration || NAV_DURATION;
        target = clampProgress(target);

        if (navAnimating) {
            return;
        }

        navAnimating = true;
        main.addClass("is-nav-driven").removeClass("is-nav-animating");
        main[0].style.setProperty("--nav-progress", navProgress);
        main[0].style.setProperty("--nav-transition-duration", duration + "ms");
        void main[0].offsetWidth;

        main.addClass("is-nav-animating");
        navProgress = target;
        main[0].style.setProperty("--nav-progress", target);

        setTimeout(function () {
            main.removeClass("is-nav-animating");
            navAnimating = false;
            syncNavigationState();
        }, duration);
    }

    function openAbout() {
        if (navProgress >= 1 || navAnimating) {
            return;
        }

        animateNavigationProgress(1);
    }

    function closeAbout() {
        if (navProgress <= 0 || navAnimating) {
            return;
        }

        animateNavigationProgress(0);
    }

    function openWork() {
        if (navProgress <= -1 || navAnimating) {
            return;
        }

        animateNavigationProgress(-1);
    }

    function closeWork() {
        if (navProgress >= 0 || navAnimating) {
            return;
        }

        animateNavigationProgress(0);
    }

    function snapNavigationProgress() {
        var target = navProgress;

        if (navProgress > 0 && navProgress < 1) {
            target = navProgress >= 0.5 ? 1 : 0;
        } else if (navProgress < 0 && navProgress > -1) {
            target = navProgress <= -0.5 ? -1 : 0;
        }

        if (target !== navProgress) {
            animateNavigationProgress(target, NAV_DURATION * Math.abs(target - navProgress));
        }
    }

    function scheduleSnap() {
        clearTimeout(snapTimer);
        snapTimer = setTimeout(snapNavigationProgress, 150);
    }

    function shouldAllowInternalScroll(deltaY) {
        if (navProgress >= 1) {
            if (about[0].scrollTop > 0) {
                return true;
            }

            return deltaY < 0;
        }

        if (navProgress <= -1) {
            if (work[0].scrollTop > 0) {
                return true;
            }

            return deltaY > 0;
        }

        return false;
    }

    var touchLastY = null;

    function isInteractiveTouchTarget(target) {
        if (!target || !target.closest) {
            return false;
        }

        return !!target.closest(
            "a, button, input, textarea, select, label, [role='button'], " +
            ".ajax-section__project-navigation, .ajax-section__project-close, " +
            ".hero__trigger-button, .close-button, .thumbnail"
        );
    }

    function handleScrollDelta(deltaY, e) {
        if (!deltaY) {
            return;
        }

        if (navAnimating) {
            if (e && e.cancelable) {
                e.preventDefault();
            }
            return;
        }

        if (shouldAllowInternalScroll(deltaY)) {
            return;
        }

        if (e && e.cancelable) {
            e.preventDefault();
        }

        applyNavigationProgress(navProgress - deltaY / scrollRange());
        scheduleSnap();
    }

    function onWheel(e) {
        handleScrollDelta(e.deltaY, e);
    }

    function onTouchStart(e) {
        if (e.touches.length !== 1 || isInteractiveTouchTarget(e.target)) {
            touchLastY = null;
            return;
        }

        touchLastY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
        if (touchLastY === null || e.touches.length !== 1 || isInteractiveTouchTarget(e.target)) {
            return;
        }

        var y = e.touches[0].clientY;
        var deltaY = touchLastY - y;

        touchLastY = y;
        handleScrollDelta(deltaY, e);
    }

    function onTouchEnd() {
        touchLastY = null;
        scheduleSnap();
    }

    applyNavigationProgress(0);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    topTrigger.click(function () {
        openAbout();
        return false;
    });

    closeTop.click(function () {
        closeAbout();
        return false;
    });

    bottomTrigger.click(function () {
        openWork();
        return false;
    });

    closeBottom.click(function () {
        closeWork();
        return false;
    });

    function createProjectMedia(project) {
        if (project.video) {
            return $("<div class=\"ajaxpage__media ajaxpage__media--video\"></div>").append(
                $("<video controls playsinline preload=\"metadata\"></video>")
                    .attr("src", project.video)
                    .attr("title", U.escapeHtml(project.name))
            );
        }

        if (project.image) {
            return $("<div class=\"ajaxpage__media ajaxpage__media--image\"></div>").append(
                $("<img>").attr("src", project.image).attr("alt", U.escapeHtml(project.name))
            );
        }

        if (project.preview && !U.isImageUrl(project.preview)) {
            return $("<div class=\"ajaxpage__media ajaxpage__media--embed\"></div>").append(
                $("<iframe frameborder=\"0\" webkitallowfullscreen mozallowfullscreen allowfullscreen title=\"Project preview\"></iframe>").attr("src", project.preview)
            );
        }

        if (project.screenshot) {
            return $("<div class=\"ajaxpage__media ajaxpage__media--image\"></div>").append(
                $("<img>").attr("src", project.screenshot).attr("alt", U.escapeHtml(project.name))
            );
        }

        return $("<div class=\"ajaxpage__media ajaxpage__media--initial\"></div>").append(
            $("<div class=\"project-initial\" aria-hidden=\"true\"></div>").append(
                $("<span></span>").text(U.projectInitial(project.name))
            )
        );
    }

    function renderProjectDetail(project, projectContainer) {
        var metaHtml = "";
        var detailsHtml = "";
        var visitUrl = U.projectVisitUrl(project);
        var page;
        var content;
        var desc;
        var col;
        var paragraphs;
        var i;

        if (visitUrl) {
            metaHtml += "<li><h4>Visit</h4><a href=\"" + U.escapeHtml(visitUrl) + "\" target=\"_blank\" rel=\"noopener\"><small>" +
                U.escapeHtml(U.formatProjectHost(visitUrl)) + "</small></a></li>";
        }

        metaHtml += "<li><h4>Project</h4><p>" + U.escapeHtml(project.name) + "</p></li>";
        metaHtml += "<li><h4>Category</h4><p>" + U.escapeHtml(project.category) + "</p></li>";

        if (U.projectSummary(project)) {
            metaHtml += "<li><h4>Summary</h4><p>" + U.escapeHtml(U.projectSummary(project)) + "</p></li>";
        }

        if (project.source) {
            metaHtml += "<li><h4>Source</h4><p><a href=\"" + U.escapeHtml(project.source) + "\" target=\"_blank\" rel=\"noopener\">" +
                U.escapeHtml(U.formatProjectHost(project.source)) + "</a></p></li>";
        }

        if (project.details) {
            paragraphs = String(project.details).split(/\n\n+/);

            for (i = 0; i < paragraphs.length; i++) {
                if (paragraphs[i].trim()) {
                    detailsHtml += "<p>" + U.escapeHtml(paragraphs[i].trim()).replace(/\n/g, "<br>") + "</p>";
                }
            }
        }

        page = $("<section id=\"ajaxpage\" class=\"ajaxpage\"></section>");
        content = $("<div class=\"ajaxpage__content clearfix\"></div>");
        desc = $("<div class=\"ajaxpage__content--description\"></div>");

        if (detailsHtml) {
            desc.append(detailsHtml);
        }

        content.append("<ul class=\"ajaxpage__content--meta\">" + metaHtml + "</ul>");
        content.append(desc);

        col = $("<div class=\"col-10 offset-1 col-md-8 offset-md-2 col-lg-10 offset-lg-1\"></div>");
        col.append(createProjectMedia(project));
        col.append(content);
        page.append($("<div class=\"row\"></div>").append(col));
        projectContainer.empty().append(page);
    }

    function initializePortfolio() {
        var hash;
        var url;
        var scrollPosition;
        var ajaxLoading = false;
        var pageRefresh = true;
        var content = false;
        var portfolioGrid = $(".work__content__thumbnails");
        var root = "#!projects/";
        var rootLength = root.length;

        $(".ajax-section__project-navigation ul").hide();
        $(".ajax-section__project-close a").hide();

        $(window).on("hashchange", function () {
            hash = window.location.hash;

            if (hash.substr(0, rootLength) !== root) {
                return;
            }

            url = hash.replace(/[#\!]/g, "");

            portfolioGrid.find(".project.current").children().removeClass("active");
            portfolioGrid.find(".project.current").removeClass("current");

            $(".work__content").find(".work__content__thumbnails.active-folio").removeClass("active-folio");
            $(".work__content").find(".ajax-section__content.active-ajax, .ajax-section__project-navigation.active-ajax, .ajax-section__project-close.active-ajax, .ajax-section__loader.active-ajax").removeClass("active-ajax");

            portfolioGrid.find('.project a[href="#!' + url + '"]').parent().addClass("current");
            portfolioGrid.find(".project.current").find('a[href="#!' + url + '"]').addClass("active");
            portfolioGrid.find('.project a[href="#!' + url + '"]').parents(".work__content__thumbnails").addClass("active-folio");
            $(".active-folio").siblings(".ajax-section").children(".ajax-section__content, .ajax-section__project-navigation, .ajax-section__project-close, .ajax-section__loader").addClass("active-ajax");

            var projectContainer = $(".ajax-section__content.active-ajax");
            var projectNav = $(".ajax-section__project-navigation.active-ajax ul");
            var exitProject = $(".ajax-section__project-close.active-ajax a");

            if (pageRefresh && hash.substr(0, rootLength) === root) {
                $("#work").stop().animate({ scrollTop: 200 }, 400);
                loadProject();
            } else if (!pageRefresh && hash.substr(0, rootLength) === root) {
                $("#work").stop().animate({ scrollTop: 200 }, 400);

                if (content) {
                    projectContainer.stop(true).hide().empty();
                }

                loadProject();
                projectNav.hide();
                exitProject.hide();
            } else if (
                (hash === "" && !pageRefresh) ||
                (hash.substr(0, rootLength) !== root && !pageRefresh) ||
                (hash.substr(0, rootLength) !== root && pageRefresh)
            ) {
                scrollPosition = hash;
                $("#work").stop().animate({ scrollTop: scrollPosition + "px" }, 1000, function () {
                    deleteProject();
                });
            }
        });

        function loadProject() {
            var loader = $(".ajax-section__loader.active-ajax");
            var projectContainer = $(".ajax-section__content.active-ajax");
            var projectId = url.split("/")[1];
            var project = U.getProjectById(projectId);

            if (ajaxLoading || !projectContainer.length) {
                return;
            }

            ajaxLoading = true;
            loader.hide().removeClass("projectError").empty();

            if (navProgress > -1) {
                openWork();
            }

            if (project) {
                renderProjectDetail(project, projectContainer);
                ajaxLoading = false;
                showProject();
                return;
            }

            ajaxLoading = false;
            loader.addClass("projectError").append("<p>Project could not be loaded.</p>").show();
            loader.find("p").slideDown();
        }

        function showProject() {
            var projectContainer = $(".ajax-section__content.active-ajax");
            var projectNav = $(".ajax-section__project-navigation.active-ajax ul");
            var exitProject = $(".ajax-section__project-close.active-ajax a");

            projectContainer.stop(true).css({
                display: "block",
                height: "auto",
                overflow: "visible"
            }).fadeIn(200, function () {
                content = true;
                scrollPosition = $("#work").scrollTop();
                projectNav.fadeIn(150);
                exitProject.fadeIn(150);
            });

            syncProjectNavButtons();
        }

        function syncProjectNavButtons() {
            var projects = portfolioGrid.find(".project");
            var current = portfolioGrid.find(".project.current");
            var projectIndex = projects.index(current);
            var projectLength = projects.length - 1;
            var navNext = $(".ajax-section__project-navigation.active-ajax .next a");
            var navPrev = $(".ajax-section__project-navigation.active-ajax .prev a");
            var nextHref = current.next(".project").children("a").attr("href");
            var prevHref = current.prev(".project").children("a").attr("href");

            navNext.attr("href", nextHref || "#");
            navPrev.attr("href", prevHref || "#");
            navNext.toggleClass("disabled", projectIndex < 0 || projectIndex >= projectLength);
            navPrev.toggleClass("disabled", projectIndex <= 0);
        }

        function deleteProject(closeURL) {
            var projectContainer = $(".ajax-section__content.active-ajax");
            var projectNav = $(".ajax-section__project-navigation.active-ajax ul");
            var exitProject = $(".ajax-section__project-close.active-ajax a");

            projectNav.fadeOut();
            exitProject.fadeOut();

            if (typeof closeURL !== "undefined" && closeURL !== "") {
                window.location.hash = "#_";
            }

            projectContainer.stop(true).fadeOut(200, function () {
                projectContainer.empty().css({ display: "none", height: "", opacity: "", overflow: "" });
                content = false;
            });

            $("#work").stop().animate({ scrollTop: 0 }, 400);

            $(".work__content").find(".work__content__thumbnails.active-folio").removeClass("active-folio");
            $(".work__content").find(".ajax-section__content.active-ajax, .ajax-section__project-navigation.active-ajax, .ajax-section__project-close.active-ajax, .ajax-section__loader.active-ajax").removeClass("active-ajax");
            portfolioGrid.find(".project.current").children().removeClass("active");
            portfolioGrid.find(".project.current").removeClass("current");
        }

        function navigateProjectNav(href) {
            if (!href || href === "#") {
                return;
            }

            window.location.hash = href.charAt(0) === "#" ? href.slice(1) : href;
        }

        $(".ajax-section__project-navigation .next a").on("click", function (e) {
            if ($(this).hasClass("disabled")) {
                e.preventDefault();
                return false;
            }

            e.preventDefault();
            navigateProjectNav($(this).attr("href"));
            return false;
        });

        $(".ajax-section__project-navigation .prev a").on("click", function (e) {
            if ($(this).hasClass("disabled")) {
                e.preventDefault();
                return false;
            }

            e.preventDefault();
            navigateProjectNav($(this).attr("href"));
            return false;
        });

        $(".ajax-section__project-close a").on("click", function () {
            deleteProject($(this).attr("href"));
            portfolioGrid.find(".project.current").children().removeClass("active");
            return false;
        });

        pageRefresh = false;
    }

    initializePortfolio();
    $(window).trigger("hashchange");
})();
