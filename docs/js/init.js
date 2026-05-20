(function () {
    "use strict";

    var s = window.site;
    var U = window.siteUtils;

    function setText(selector, text) {
        var el = document.querySelector(selector);

        if (el) {
            el.textContent = text;
        }
    }

    function generateLinkList(selector, dataSource, useHoverProperty) {
        var listElement = document.querySelector(selector);
        var html = "";
        var keys;
        var i;
        var item;
        var hoverText;

        if (!listElement) {
            return;
        }

        keys = Object.keys(dataSource);

        for (i = 0; i < keys.length; i++) {
            item = dataSource[keys[i]];
            hoverText = useHoverProperty ? item.hover : item.label;
            html += '<li><a href="' + U.escapeHtml(item.url) + '" target="_blank" rel="noopener">' +
                '<span data-hover="' + U.escapeHtml(hoverText) + '"' +
                (i === 0 ? ' style="text-align:center;"' : '') + '>' +
                U.escapeHtml(item.label) + '</span></a></li>';
        }

        listElement.innerHTML = html;
    }

    function renderProjectThumbnails() {
        var container = document.querySelector(".work__content__thumbnails");
        var projects = s.projects;
        var i;
        var project;
        var col;
        var hrefAttr;
        var link;

        if (!container || !projects) {
            return;
        }

        container.innerHTML = "";

        for (i = 0; i < projects.length; i++) {
            project = projects[i];
            hrefAttr = "#!projects/" + project.id;
            col = document.createElement("div");
            col.className = "col-6 col-md-4 project show " + project.category;
            col.innerHTML = '<a href="' + hrefAttr + '" class="thumbnail">' +
                '<div class="thumbnail__media">' + U.buildThumbnailMedia(project) +
                '<div class="overlay"></div></div>' +
                U.buildThumbnailInfo(project) + '</a>';

            link = col.querySelector("a.thumbnail");
            link.addEventListener("click", function (e) {
                if (window.location.hash === hrefAttr) {
                    e.preventDefault();
                    window.dispatchEvent(new Event("hashchange"));
                }
            });

            container.appendChild(col);
        }
    }

    setText(".hero__trigger-button.top", s.hero.buttonTop);
    setText(".hero__trigger-button.bottom", s.hero.buttonBottom);

    if (typeof window.centerInit === "function") {
        window.centerInit();
    }

    setText(".about__content__box.first h5", s.about.heading);
    setText(".about__content__box.first p", s.about.description);
    setText(".about__content__box:not(.first) h5", s.services.heading);

    (function renderServices() {
        var list = document.querySelector(".services");
        var j;

        if (!list) {
            return;
        }

        list.innerHTML = "";

        for (j = 0; j < s.services.items.length; j++) {
            var serviceItem = document.createElement("li");
            serviceItem.textContent = s.services.items[j];
            list.appendChild(serviceItem);
        }
    }());

    setText(".about__content__full-box h5", s.awards.heading);

    (function renderAwards() {
        var list = document.querySelector(".client-list");
        var j;
        var award;
        var li;
        var img;

        if (!list) {
            return;
        }

        list.innerHTML = "";

        for (j = 0; j < s.awards.items.length; j++) {
            award = s.awards.items[j];
            li = document.createElement("li");
            img = document.createElement("img");
            img.src = award.icon;
            img.alt = award.name;

            if (award.invert) {
                img.className = "invert-bg";
            }

            li.appendChild(img);
            list.appendChild(li);
        }
    }());

    setText(".work__content__box.first h5", s.work.heading);
    setText(".work__content__box.first p", s.work.description);

    renderProjectThumbnails();

    document.querySelectorAll(".work__content__box.last h5").forEach(function (h5) {
        h5.textContent = s.cta.heading;
    });

    document.querySelectorAll(".work__content__box.last p").forEach(function (p) {
        p.innerHTML = U.escapeHtml(s.cta.text) + ' <a class="underline" href="mailto:' +
            U.escapeHtml(s.contact.email) + '">' + U.escapeHtml(s.contact.email) + "</a>";
    });

    document.querySelectorAll(".logo").forEach(function (img) {
        img.alt = s.company.logoAlt;
    });

    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        a.href = "mailto:" + s.contact.email;
        var small = a.querySelector("small");

        if (small) {
            small.textContent = s.contact.callToAction;
        }
    });

    generateLinkList(".social-links", s.social, false);
    generateLinkList(".location-links", s.locations, true);

    document.querySelectorAll(".close-button, .ajax-section__project-close a").forEach(function (el) {
        el.textContent = s.navigation.close;
    });

    setText(".ajax-section__project-navigation .next a", s.navigation.nextProject);
    setText(".ajax-section__project-navigation .prev a", s.navigation.previousProject);
}());
