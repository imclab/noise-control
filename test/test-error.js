/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");
exports.testMulti = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/audio-error.html"));
	yield wait();

	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

	test.equal(indicator, null, "indicator doesn't exist at start");

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let audio = contentDocument.querySelector("audio");

	test.notEqual(audio.error, null, "audio has an error");

	audio.play();
	yield wait();
	indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator == null || !indicator.classList.contains("noisy"));

	tab.close();
};

require("sdk/test").run(exports);
