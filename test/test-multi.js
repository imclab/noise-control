/* global exports, require */

require("../lib/main.js");

const { viewFor } = require("sdk/view/core");

const { openTab, url, wait } = require("./common.js");

exports.testMulti = function*(test) {
	let tab = yield openTab(url("/test/files/multi.html"));
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
	test.ok(indicator.classList.contains("noisy"));

	audio.play();
	yield wait();
	test.ok(indicator.classList.contains("noisy"));

	video.pause();
	yield wait();
	test.ok(indicator.classList.contains("noisy"));

	audio.pause();
	yield wait();
	test.ok(!indicator.classList.contains("noisy"));

	tab.close();
};

require("sdk/test").run(exports);
