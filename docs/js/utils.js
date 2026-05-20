(function (window) {
    "use strict";

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function projectSummary(project) {
        var value;

        if (!project) {
            return "";
        }

        value = project.summary != null ? project.summary : project.desc;

        if (value != null && String(value).trim() !== "") {
            return String(value).trim();
        }

        return "";
    }

    function projectInitial(name) {
        var match = String(name).trim().match(/[a-zA-Z0-9]/);

        return match ? match[0].toUpperCase() : "?";
    }

    function sanitizeGoogleIcon(name) {
        return String(name).trim().replace(/[^a-z0-9_]/gi, "");
    }

    function getProjectById(id) {
        var projects = window.site && window.site.projects;
        var i;

        if (!projects) {
            return null;
        }

        for (i = 0; i < projects.length; i++) {
            if (projects[i].id === id) {
                return projects[i];
            }
        }

        return null;
    }

    function formatProjectHost(url) {
        var anchor = document.createElement("a");

        anchor.href = url;
        return anchor.hostname.replace(/^www\./i, "");
    }

    function isImageUrl(url) {
        if (!url) {
            return false;
        }

        return /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(url) || /[?&]raw=true/i.test(url);
    }

    function projectVisitUrl(project) {
        if (project.preview && !isImageUrl(project.preview)) {
            return project.preview;
        }

        return null;
    }

    function buildThumbnailMedia(project) {
        var thumbSrc = project.icon || project.screenshot;
        var googleIcon = project.icon_google ? sanitizeGoogleIcon(project.icon_google) : "";
        var imageAlt = escapeHtml(project.name);

        if (thumbSrc) {
            return '<div class="project-icon" aria-hidden="true"><img src="' + thumbSrc + '" alt="' + imageAlt + '" class="logo-thumb"></div>';
        }

        if (googleIcon) {
            return '<div class="project-google-icon" aria-hidden="true"><span class="material-symbols-outlined">' + googleIcon + '</span></div>';
        }

        return '<div class="project-initial" aria-hidden="true"><span>' + escapeHtml(projectInitial(project.name)) + '</span></div>';
    }

    function buildThumbnailInfo(project) {
        var summaryText = projectSummary(project);
        var html = '<div class="project-info"><p>' + escapeHtml(project.name) + '</p>';

        if (summaryText) {
            html += '<span>' + escapeHtml(summaryText) + '</span>';
        }

        return html + '</div>';
    }

    window.siteUtils = {
        escapeHtml: escapeHtml,
        projectSummary: projectSummary,
        projectInitial: projectInitial,
        sanitizeGoogleIcon: sanitizeGoogleIcon,
        getProjectById: getProjectById,
        formatProjectHost: formatProjectHost,
        isImageUrl: isImageUrl,
        projectVisitUrl: projectVisitUrl,
        buildThumbnailMedia: buildThumbnailMedia,
        buildThumbnailInfo: buildThumbnailInfo
    };
}(window));
