/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { Task } = require("chrome").Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");

exports.testMuteAudio = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/audio.html"));
	yield basicTest(tab, (doc) => doc.querySelector("audio"), test);
};

exports.testMuteVideo = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/lynx.webm"));
	yield basicTest(tab, (doc) => doc.querySelector("video"), test);
};

exports.testMuteVideoInFrame = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/video-frame.html"));
	yield basicTest(tab, (doc) => {
		return doc.querySelector("iframe").contentWindow.document.querySelector("video");
	}, test);
};

exports.testPauseWhileMuted = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/video-frame.html"));

	yield wait();

	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let video1 = contentDocument.querySelector("video");
	let video2 = contentDocument.querySelector("iframe").contentWindow.document.querySelector("video");

	video1.play(); // video2 autoplays.

	yield wait();

	doClick(indicator);
	yield wait();
	test.equal(indicator.classList.contains("muted"), true);
	test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");
	test.equal(video1.muted, true);
	test.equal(video2.muted, true);

	video1.pause();
	yield wait();
	test.equal(indicator.classList.contains("muted"), true);
	test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");
	test.equal(video1.muted, true);
	test.equal(video2.muted, true);

	tab.close();
};

require("sdk/test").run(exports);

function basicTest(tab, elementSelector, test) {
	return Task.spawn(function*() {
		yield wait();

		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator is shown");

		// TODO: don't do this.
		let contentWindow = xulTab.linkedBrowser.contentWindow;
		let contentDocument = contentWindow.document;
		let video = elementSelector(contentDocument);

		test.equal(video.muted, false);
		doClick(indicator);
		yield wait();
		test.equal(indicator.classList.contains("muted"), true);
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");
		test.equal(video.muted, true);

		doClick(indicator);
		yield wait();
		test.equal(indicator.classList.contains("muted"), false);
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");
		test.equal(video.muted, false);

		doClick(indicator);
		yield wait();
		video.muted = false;
		yield wait();
		test.equal(indicator.classList.contains("muted"), false);
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");

		tab.close();
	});
}

function doClick(indicator) {
	let event = new indicator.ownerDocument.defaultView.MouseEvent("mousedown", { button: 0, detail: 1 });
	indicator.dispatchEvent(event);
}
