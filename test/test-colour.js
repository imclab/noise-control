/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { Task } = require("chrome").Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");
const { prefs } = require("sdk/simple-prefs");

const { openTab, wait } = require("common.js");

exports.testBasicAudio = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/audio.html"));
	yield wait();

	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let chromeWindow = chromeDocument.defaultView;
	let label = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "tab-label");
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	let use = indicator.querySelector("use");

	test.notEqual(indicator, null, "indicator exists");
	test.ok(indicator.classList.contains("noisy"), "indicator is shown");

	let style = chromeWindow.getComputedStyle(use, null);
	let labelStyle = chromeWindow.getComputedStyle(label, null);
	test.equal(style.fill, labelStyle.color);

	prefs["indicator.colour"] = "#00cc00";
	yield wait();
	test.equal(style.fill, "rgb(0, 204, 0)");

	prefs["indicator.colour"] = "white";
	yield wait();
	test.equal(style.fill, "rgb(255, 255, 255)");

	prefs["indicator.colour"] = "currentcolor";
	yield wait();
	test.equal(style.fill, labelStyle.color);
	test.equal(chromeDocument._noiseControlCSS, null);

	tab.close();
};

require("sdk/test").run(exports);
