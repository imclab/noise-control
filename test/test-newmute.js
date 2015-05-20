/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");
const { Ci } = require("chrome");
const { openTab, wait } = require("common.js");

exports.testNewMute = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/video-frame.html"));
	yield wait();

	let xulTab = viewFor(tab);

	let contentBrowser = xulTab.linkedBrowser;
	let contentWindow = contentBrowser.contentWindow;
	let contentDocument = contentWindow.document;

	let windowUtils1 = contentWindow
			.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
	let windowUtils2 = contentDocument.querySelector("iframe").contentWindow
			.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);

	test.equal(windowUtils1.audioMuted, false);
	test.equal(windowUtils1.audioVolume, 1);
	test.equal(windowUtils2.audioMuted, false);
	test.equal(windowUtils2.audioVolume, 1);

	contentBrowser.messageManager.sendAsyncMessage("NoiseControl:setAudioState", true);
	yield wait();
	test.equal(windowUtils1.audioMuted, true);
	test.equal(windowUtils1.audioVolume, 1);
	test.equal(windowUtils2.audioMuted, true);
	test.equal(windowUtils2.audioVolume, 1);

	contentBrowser.messageManager.sendAsyncMessage("NoiseControl:setAudioState", false);
	yield wait();
	test.equal(windowUtils1.audioMuted, false);
	test.equal(windowUtils1.audioVolume, 1);
	test.equal(windowUtils2.audioMuted, false);
	test.equal(windowUtils2.audioVolume, 1);

	contentBrowser.messageManager.sendAsyncMessage("NoiseControl:setAudioState", 0);
	yield wait();
	test.equal(windowUtils1.audioMuted, false);
	test.equal(windowUtils1.audioVolume, 0);
	test.equal(windowUtils2.audioMuted, false);
	test.equal(windowUtils2.audioVolume, 0);

	contentBrowser.messageManager.sendAsyncMessage("NoiseControl:setAudioState", 0.5);
	yield wait();
	test.equal(windowUtils1.audioMuted, false);
	test.equal(windowUtils1.audioVolume, 0.5);
	test.equal(windowUtils2.audioMuted, false);
	test.equal(windowUtils2.audioVolume, 0.5);

	contentBrowser.messageManager.sendAsyncMessage("NoiseControl:setAudioState", 1);
	yield wait();
	test.equal(windowUtils1.audioMuted, false);
	test.equal(windowUtils1.audioVolume, 1);
	test.equal(windowUtils2.audioMuted, false);
	test.equal(windowUtils2.audioVolume, 1);

	tab.close();
};

require("sdk/test").run(exports);
