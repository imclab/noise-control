/* global exports, require */

require("../lib/main.js");

const { viewFor } = require("sdk/view/core");

const { openTab, url, wait } = require("./common.js");

exports.testSilent = function*(test) {

	let tab = yield openTab(url("/test/files/silent.webm"));
	yield wait();

	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;

	function getIndicator() {
		return chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	}
	test.equal(getIndicator(), null, "indicator doesn't exist");

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let video = contentDocument.querySelector("video");

	video.pause();
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.play();
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.muted = true;
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.muted = false;
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.volume = 0.5;
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.volume = 0;
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.volume = 1;
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	video.remove();
	yield wait();
	test.equal(getIndicator(), null, "indicator doesn't exist");

	tab.close();
};

require("sdk/test").run(exports);
