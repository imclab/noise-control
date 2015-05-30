/* global exports, require */

require("./main.js");

const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");
const { Ci } = require("chrome");

const { openTab, wait } = require("common.js");

exports.testSidebar = function*(test) {
	let tab = yield openTab("about:mozilla");
	yield wait();

	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;

	let sidebar = chromeDocument.getElementById("sidebar");
	let sidebarBrowser = sidebar.contentDocument.getElementById("web-panels-browser");
	let sidebarDocument = sidebarBrowser.contentDocument;

	test.equal(data.url("sidebar.html"), sidebarDocument.URL);
	test.equal(sidebarDocument.querySelectorAll("#windows > li").length, 1);
	test.equal(sidebarDocument.querySelectorAll("#windows > li > ul > li").length, 0);

	tab.url = data.url("").replace("/data/", "/tests/files/audio.html");
	yield wait(150);

	test.equal(data.url("sidebar.html"), sidebarDocument.URL);
	test.equal(sidebarDocument.querySelectorAll("#windows > li").length, 1);
	test.equal(sidebarDocument.querySelectorAll("#windows > li > ul > li").length, 1);

	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let windowUtils = contentWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);

	let checkbox = sidebarDocument.querySelector("#windows input[type=\"checkbox\"]");
	let range = sidebarDocument.querySelector("#windows input[type=\"range\"]");

	test.notEqual(indicator, null, "indicator exists");
	test.ok(indicator.classList.contains("noisy"), "indicator is not muted");

	yield doClick(checkbox);
	test.equal(windowUtils.audioMuted, true, "window is muted");
	test.ok(indicator.classList.contains("muted"), "indicator is muted");

	yield doClick(checkbox);
	test.equal(windowUtils.audioMuted, false, "window is not muted");
	test.ok(!indicator.classList.contains("muted"), "indicator is not muted");

	yield doSetLevel(range, 0);
	test.equal(windowUtils.audioVolume, 0, "window has volume set");
	test.equal(indicator.getAttribute("level"), "off", "indicator has volume set");

	yield doSetLevel(range, 25);
	test.equal(windowUtils.audioVolume, 0.25, "window has volume set");
	test.equal(indicator.getAttribute("level"), "low", "indicator has volume set");

	yield doSetLevel(range, 50);
	test.equal(windowUtils.audioVolume, 0.5, "window has volume set");
	test.equal(indicator.getAttribute("level"), "medium", "indicator has volume set");

	yield doSetLevel(range, 75);
	test.equal(windowUtils.audioVolume, 0.75, "window has volume set");
	test.equal(indicator.getAttribute("level"), "high", "indicator has volume set");

	tab.close();
};

function* doClick(target) {
	let event = new target.ownerDocument.defaultView.MouseEvent("click", { button: 0, detail: 1 });
	target.dispatchEvent(event);
	yield wait();
}

function* doSetLevel(target, value) {
	let event = new target.ownerDocument.defaultView.Event("change");
	target.value = value;
	target.dispatchEvent(event);
	yield wait();
}

require("sdk/test").run(exports);
