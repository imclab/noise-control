/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");
exports.testMulti = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/multi.html"));
	yield wait();

	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

	// test.equal(indicator, null, "indicator doesn't exist at start");

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let audio = contentDocument.querySelector("audio");
	let video = contentDocument.querySelector("video");

	video.play();
	yield wait();
	indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.notEqual(indicator, null, "indicator exists");
	test.notEqual(indicator.getAttribute("collapsed"), "true");

	audio.play();
	yield wait();
	test.notEqual(indicator.getAttribute("collapsed"), "true");

	video.pause();
	yield wait();
	test.notEqual(indicator.getAttribute("collapsed"), "true");

	audio.pause();
	yield wait();
	test.equal(indicator.getAttribute("collapsed"), "true");

	tab.close();
};

require("sdk/test").run(exports);
