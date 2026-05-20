(function () {
    "use strict";

    var U = window.siteUtils;
    var hero = $("#hero");
    var work = $("#work");
    var about = $("#about");
    var topTrigger = $(".hero__trigger-button.top");
    var bottomTrigger = $(".hero__trigger-button.bottom");
    var closeBottom = $(".close-button.bottom");
    var closeTop = $(".close-button.top");

    $("body").queryLoader2({
        backgroundColor: "#fff",
        fadeOutTime: 500
    });

    function centerInit() {
        hero.css({
            height: $(window).height()
        });

        $(".hero__content").css({
            "margin-top": ($(window).height() - $(".hero__content").height()) / 2 + "px"
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

    topTrigger.click(function () {
        about.removeClass("idle").addClass("active-screen");
        hero.animate({ top: "20%" }, 500);
        return false;
    });

    closeTop.click(function () {
        about.addClass("idle").removeClass("active-screen");
        hero.animate({ top: 0 }, 500);
        return false;
    });

    function openWork() {
        work.removeClass("idle").addClass("active-screen");
        hero.animate({ top: "-20%" }, 500);
    }

    bottomTrigger.click(function () {
        openWork();
        return false;
    });

    $(".hero__content").click(function () {
        openWork();
    });

    closeBottom.click(function () {
        work.addClass("idle").removeClass("active-screen");
        hero.animate({ top: 0 }, 500);
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
        var current;
        var next;
        var prev;
        var target;
        var hash;
        var url;
        var projectIndex;
        var scrollPosition;
        var projectLength;
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

            if ($(".work").hasClass("idle")) {
                $(".work").removeClass("idle").addClass("active-screen");
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
                window.dispatchEvent(new Event("dotfield:resize"));
            });

            projectIndex = portfolioGrid.find(".project.current").index();
            projectLength = portfolioGrid.find(".project a").length - 1;

            if (projectIndex === projectLength) {
                $(".ajax-section__project-navigation .next a").addClass("disabled");
                $(".ajax-section__project-navigation .prev a").removeClass("disabled");
            } else if (projectIndex === 0) {
                $(".ajax-section__project-navigation .next a").removeClass("disabled");
                $(".ajax-section__project-navigation .prev a").addClass("disabled");
            } else {
                $(".ajax-section__project-navigation .next a, .ajax-section__project-navigation .prev a").removeClass("disabled");
            }
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

        $(".ajax-section__project-navigation .next a").on("click", function () {
            current = portfolioGrid.find(".project.current");
            next = current.next(".project");
            target = $(next).children("a").attr("href");
            $(this).attr("href", target);

            if (next.length === 0) {
                return false;
            }

            current.removeClass("current");
            current.children().removeClass("active");
            next.addClass("current");
            next.children().addClass("active");
        });

        $(".ajax-section__project-navigation .prev a").on("click", function () {
            current = portfolioGrid.find(".project.current");
            prev = current.prev(".project");
            target = $(prev).children("a").attr("href");
            $(this).attr("href", target);

            if (prev.length === 0) {
                return false;
            }

            current.removeClass("current");
            current.children().removeClass("active");
            prev.addClass("current");
            prev.children().addClass("active");
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
