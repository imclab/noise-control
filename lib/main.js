/* global exports, require */

const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");

const FRAME_SCRIPT_URI = data.url("frame.js");
const NOISY_ICON_URI = data.url("noisy.png");
const MUTED_ICON_URI = data.url("muted.png");

let listener = {
	receiveMessage: function(message) {
		let browser = message.target;
		let gBrowser = browser.ownerDocument.defaultView.gBrowser;
		let tab = gBrowser.getTabForBrowser(browser);

		let hasNoise = message.data;
		let indicator = getIndicatorForTab(tab);

		switch (message.name) {
		case "hasNoise":
			indicator.setAttribute("collapsed", !hasNoise);
			break;
		case "unmuted":
			indicator.classList.remove("muted");
			indicator.setAttribute("src", NOISY_ICON_URI);
			break;
		}
	}
};

var windows = require("sdk/windows").browserWindows;
windows.on("open", function(sdkWindow) {
	addFrameScript(sdkWindow);
});

for (let sdkWindow of windows) {
  addFrameScript(sdkWindow);
}

function addFrameScript(sdkWindow) {
	let messageManager = viewFor(sdkWindow).messageManager;
	messageManager.addMessageListener("hasNoise", listener);
	messageManager.addMessageListener("unmuted", listener);
	messageManager.loadFrameScript(FRAME_SCRIPT_URI, true);
}

exports.onUnload = function() {
	for (let sdkWindow of windows) {
		let chromeWindow = viewFor(sdkWindow);
		let messageManager = chromeWindow.messageManager;
		messageManager.removeMessageListener("hasNoise", listener);
		messageManager.removeMessageListener("unmuted", listener);
		messageManager.removeDelayedFrameScript(FRAME_SCRIPT_URI, true);

		let chromeDocument = chromeWindow.document;
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
		indicator = chromeDocument.createElementNS(XULNS, "image");
		indicator.setAttribute("anonid", "noise-indicator");
		indicator.className = "tab-icon-image";
		indicator.setAttribute("src", NOISY_ICON_URI);
		indicator.style.display = "-moz-box";
		indicator.style.marginLeft = indicator.style.marginRight = "0";
		indicator.style.pointerEvents = "auto";
		indicator.addEventListener("click", function(event) {
			// Check there's only one click of the left button.
			if (event.which != 1) {// || event.detail != 1) { TODO fix this for tests.
				return;
			}

			let muted = indicator.classList.toggle("muted");
			chromeWindow.gBrowser.getBrowserForTab(xulTab).messageManager.sendAsyncMessage("mute", muted);
			let src = muted ? MUTED_ICON_URI : NOISY_ICON_URI;
			indicator.setAttribute("src", src);
		});

		let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
		closeButton.parentNode.insertBefore(indicator, closeButton);

		xulTab.addEventListener("TabMove", updateOnRearrange, false);
		xulTab.addEventListener("TabAttrModified", fixBinding, false);
		xulTab.addEventListener("TabPinned", fixBinding, false);
		xulTab.addEventListener("TabUnpinned", fixBinding, false);
	}
	return indicator;
}

function fixBinding(event) {
	let xulTab = event.target;
	let chromeDocument = xulTab.ownerDocument;
	let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");

	if (xulTab.pinned) {
		closeButton.setAttribute("pinned", "true");
	} else {
		closeButton.removeAttribute("pinned");
	}

	if (xulTab.selected) {
		closeButton.setAttribute("selected", "true");
	} else {
		closeButton.removeAttribute("selected");
	}
}

function updateOnRearrange(event) {
	let xulTab = event.target;
	xulTab._topWorker.port.emit("checkNoiseTop");
	xulTab._topWorker.port.emit("checkPluginsTop");
}
