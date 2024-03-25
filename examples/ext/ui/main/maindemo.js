'use strict'

const path = require("path");

function replaceCSS() {
    const cssFile = path.join(path.dirname(__filename), "demo.css");
    $("head link#main")
        .attr("href", cssFile)
        ;
}

function replaceColorsCSS() {
    const cssFile = path.join(path.dirname(__filename), "colors.css");
    $("head link#colors")
        .attr("href", cssFile)
        ;
}


function messWithRootElement() {
    document.documentElement.style.setProperty("--color-accent", "white")
    document.documentElement.style.setProperty("--color-primary", "gray")
    document.documentElement.style.setProperty("--color-main-background", "#242424")
}

function setBackground() {
    document.body.style.backgroundImage = `url(${path.join(path.dirname(__filename), "approaching-storm.jpg")})`;
}

exports.onPageLoad = (pageName) => {
    setBackground();
    // messWithRootElement();
    replaceColorsCSS();
}
