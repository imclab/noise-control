/* global require, exports */

require("../lib/main.js");

const { viewFor } = require("sdk/view/core");

const { openTab, url, wait } = require("./common.js");

exports.testVideoInFrame = function*(test) {
	let tab = yield openTab(url("/test/files/video-frame.html"));

	yield wait();
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator.classList.contains("noisy"));

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let frame = contentDocument.querySelector("iframe");

	frame.remove();
	yield wait(100);
	test.ok(!indicator.classList.contains("noisy"));

	tab.close();
};

exports.testPluginInFrame = function*(test) {
	let tab = yield openTab(url("/test/files/embed-frame.html"));

	yield wait();
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator.classList.contains("plugins"));

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let frame = contentDocument.querySelector("iframe");

	frame.remove();
	yield wait(100);
	test.ok(!indicator.classList.contains("plugins"));

	tab.close();
};

require("sdk/test").run(exports);
