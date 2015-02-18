const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

let { data } = require("sdk/self");
let { viewFor } = require("sdk/view/core");

const NOISY_SRC = data.url("noisy.png");
const MUTED_SRC = data.url("muted.png");

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
			indicator.setAttribute("src", NOISY_SRC);
			break;
		}
	}
};

var windows = require("sdk/windows").browserWindows;
windows.on("open", function(win) {
	addMM(win);
});

for (let win of windows) {
  addMM(win);
}

function addMM(win) {
	let messageManager = viewFor(win).messageManager;
	messageManager.addMessageListener("hasNoise", listener);
	messageManager.addMessageListener("unmuted", listener);
	messageManager.loadFrameScript(data.url("frame.js"), true);
}



// exports.onUnload = function() {
// 	let tabs = require("sdk/tabs");
// 	for (let tab of tabs) {
// 		let xulTab = viewFor(tab);
// 		delete xulTab._topWorker;
// 		xulTab.style.backgroundColor = null;
// 		xulTab.removeEventListener("TabMove", updateOnRearrange, false);
// 		xulTab.removeEventListener("TabAttrModified", fixBinding, false);
// 		xulTab.removeEventListener("TabPinned", fixBinding, false);
// 		xulTab.removeEventListener("TabUnpinned", fixBinding, false);
// 		let chromeDocument = xulTab.ownerDocument;
// 		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
// 		if (indicator) {
// 			indicator.remove();
// 		}
// 	}
// };

function getIndicatorForTab(xulTab) {
	let chromeDocument = xulTab.ownerDocument;
	let chromeWindow = chromeDocument.defaultView;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	if (!indicator) {
		indicator = chromeDocument.createElementNS(XULNS, "image");
		indicator.setAttribute("anonid", "noise-indicator");
		indicator.className = "tab-icon-image";
		indicator.setAttribute("src", NOISY_SRC);
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
			let src = data.url(muted ? MUTED_SRC : NOISY_SRC);
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
