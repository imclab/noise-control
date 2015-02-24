/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { Task } = require("chrome").Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");

exports.testBasicAudio = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/audio.html"));
	yield basicTest(tab, "audio", test);
};

exports.testBasicVideo = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/lynx.webm"));
	yield basicTest(tab, "video", test);
};

require("sdk/test").run(exports);

function basicTest(tab, elementSelector, test) {
	return Task.spawn(function*() {
		yield wait();

		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
		test.ok(indicator.classList.contains("noisy"), "indicator is shown");

		// TODO: don't do this.
		let contentWindow = xulTab.linkedBrowser.contentWindow;
		let contentDocument = contentWindow.document;
		let video = contentDocument.querySelector(elementSelector);

		video.pause();
		yield wait();
		test.ok(!indicator.classList.contains("noisy"));

		video.play();
		yield wait();
		test.ok(indicator.classList.contains("noisy"));

		video.muted = true;
		yield wait();
		test.ok(!indicator.classList.contains("noisy"));

		video.muted = false;
		yield wait();
		test.ok(indicator.classList.contains("noisy"));

		video.volume = 0.5;
		yield wait();
		test.ok(indicator.classList.contains("noisy"));

		video.volume = 0;
		yield wait();
		test.ok(!indicator.classList.contains("noisy"));

		video.volume = 1;
		yield wait();
		test.ok(indicator.classList.contains("noisy"));

		video.remove();
		yield wait();
		test.ok(!indicator.classList.contains("noisy"));

		tab.close();
	});
}
