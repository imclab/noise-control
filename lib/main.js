/* global exports, require */

const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const { Cc, Ci } = require("chrome");
const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");

const FRAME_SCRIPT_URI = data.url("frame.js");
const CSS_PI_DATA = "href=\"" + data.url("noise-control.css") + "\" type=\"text/css\"";

let listener = {
	receiveMessage: function(message) {
		let browser = message.target;
		let gBrowser = browser.ownerDocument.defaultView.gBrowser;
		let tab = gBrowser.getTabForBrowser(browser);
		let indicator = getIndicatorForTab(tab);

		switch (message.name) {
		case "NoiseControl:hasNoise":
			let hasNoise = message.data;
			indicator.setAttribute("collapsed", !hasNoise);
			break;
		case "NoiseControl:unmuted":
			indicator.classList.remove("muted");
			break;
		}
	}
};

let messageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
messageManager.addMessageListener("NoiseControl:hasNoise", listener);
messageManager.addMessageListener("NoiseControl:unmuted", listener);
messageManager.loadFrameScript(FRAME_SCRIPT_URI, true);

exports.onUnload = function() {
	messageManager.removeMessageListener("NoiseControl:hasNoise", listener);
	messageManager.removeMessageListener("NoiseControl:unmuted", listener);
	messageManager.removeDelayedFrameScript(FRAME_SCRIPT_URI, true);
	messageManager.broadcastAsyncMessage("NoiseControl:disable");

	for (let sdkWindow of require("sdk/windows").browserWindows) {
		let chromeWindow = viewFor(sdkWindow);
		let chromeDocument = chromeWindow.document;

		let pi = getStylesheetForDocument(chromeDocument);
		if (pi) {
			chromeDocument.removeChild(pi);
		}

		for (let tab of chromeDocument.querySelectorAll("tab")) {
			tab.removeEventListener("TabMove", updateOnRearrange, false);
			tab.removeEventListener("TabAttrModified", fixBinding, false);
			tab.removeEventListener("TabPinned", fixBinding, false);
			tab.removeEventListener("TabUnpinned", fixBinding, false);
			let indicator = chromeDocument.getAnonymousElementByAttribute(tab, "anonid", "noise-indicator");
			if (indicator) {
				indicator.remove();
			}
		}
	}
};

function getIndicatorForTab(xulTab) {
	let chromeDocument = xulTab.ownerDocument;
	let chromeWindow = chromeDocument.defaultView;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	if (!indicator) {
		if (!getStylesheetForDocument(chromeDocument)) {
			let pi = chromeDocument.createProcessingInstruction("xml-stylesheet", CSS_PI_DATA);
			chromeDocument.insertBefore(pi, chromeDocument.getElementById("main-window"));
		}

		indicator = chromeDocument.createElementNS(XULNS, "image");
		indicator.setAttribute("anonid", "noise-indicator");
		indicator.className = "tab-icon-image";
		indicator.addEventListener("click", function(event) {
			// Check there's only one click of the left button.
			if (event.which != 1) {// || event.detail != 1) { TODO fix this for tests.
				return;
			}

			let muted = indicator.classList.toggle("muted");
			chromeWindow.gBrowser.getBrowserForTab(xulTab).messageManager.sendAsyncMessage("NoiseControl:mute", muted);
		});

		if (xulTab.selected) {
			indicator.setAttribute("selected", "true");
		}

		let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
		closeButton.parentNode.insertBefore(indicator, closeButton);

		xulTab.addEventListener("TabMove", updateOnRearrange, false);
		xulTab.addEventListener("TabAttrModified", fixBinding, false);
		xulTab.addEventListener("TabPinned", fixBinding, false);
		xulTab.addEventListener("TabUnpinned", fixBinding, false);
	}
	return indicator;
}

function getStylesheetForDocument(chromeDocument) {
	for (let node of chromeDocument.childNodes) {
		if (node.nodeType == chromeDocument.PROCESSING_INSTRUCTION_NODE && node.data == CSS_PI_DATA) {
			return node;
		}
	}
}

function fixBinding(event) {
	let xulTab = event.target;
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");

	if (xulTab.pinned) {
		closeButton.setAttribute("pinned", "true");
	} else {
		closeButton.removeAttribute("pinned");
	}

	if (xulTab.selected) {
		indicator.setAttribute("selected", "true");
		closeButton.setAttribute("selected", "true");
	} else {
		indicator.removeAttribute("selected");
		closeButton.removeAttribute("selected");
	}
}

function updateOnRearrange(event) {
	let xulTab = event.target;
	let chromeDocument = xulTab.ownerDocument;
	let chromeWindow = chromeDocument.defaultView;
	chromeWindow.gBrowser.getBrowserForTab(xulTab).messageManager.sendAsyncMessage("NoiseControl:checkNoise");
}
