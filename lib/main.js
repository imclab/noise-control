/* global exports, require */

const SVGNS = "http://www.w3.org/2000/svg";
const XLINKNS = "http://www.w3.org/1999/xlink";

const { Cc, Ci, Cu } = require("chrome");
const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");
const preferences = require("sdk/simple-prefs");

const FRAME_SCRIPT_URI = data.url("frame.js");
const CSS_PI_DATA = "href=\"" + data.url("noise-control.css") + "\" type=\"text/css\"";

Cu.import("resource://gre/modules/Services.jsm");

preferences.set("media.defaultAudioChannel", "content");
preferences.set("media.useAudioChannelService", true);

let messageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
let listener = {
	messages: [
		"NoiseControl:hasNoise",
		"NoiseControl:hasPlugins",
		"NoiseControl:unloaded",
		"NoiseControl:unmuted",
		"PluginContent:UpdateHiddenPluginUI",
		// "NoiseControl:testMessage"
	],
	init: function() {
		for (let m of this.messages) {
			messageManager.addMessageListener(m, this);
		}
		messageManager.loadFrameScript(FRAME_SCRIPT_URI, true);
	},
	cleanup: function() {
		for (let m of this.messages) {
			messageManager.removeMessageListener(m, this);
		}
		messageManager.removeDelayedFrameScript(FRAME_SCRIPT_URI, true);
		messageManager.broadcastAsyncMessage("NoiseControl:disable");
	},
	receiveMessage: function(message) {
		let browser = message.target;
		let gBrowser = browser.ownerDocument.defaultView.gBrowser;
		if (!gBrowser) {
			return;
		}
		let tab = gBrowser.getTabForBrowser(browser);
		let indicator = getIndicatorForTab(tab);

		switch (message.name) {
		case "NoiseControl:hasNoise":
			let hasNoise = message.data;
			indicator.classList[hasNoise ? "add" : "remove"]("noisy");
			break;
		case "NoiseControl:hasPlugins":
			let hasPlugins = message.data;
			indicator.classList[hasPlugins ? "add" : "remove"]("plugins");
			break;
		case "NoiseControl:unloaded":
			indicator.classList.remove("noisy");
			indicator.classList.remove("plugins");
			indicator.classList.remove("muted");
			break;
		case "NoiseControl:unmuted":
			indicator.classList.remove("muted");
			break;
		case "PluginContent:UpdateHiddenPluginUI":
			browser.messageManager.sendAsyncMessage("NoiseControl:checkPlugins");
			break;
		// case "NoiseControl:testMessage":
		// 	let hasNoise = Number(message.data);
		// 	indicator.classList[hasNoise ? "add" : "remove"]("noisy");
		// 	break;
		default:
			// console.log(message.name, JSON.stringify(message.json));
			break;
		}
	}
};
listener.init();

function indicatorColourChanged() {
	let colour = preferences.prefs["indicator.colour"];
	if (colour == "currentcolor") {
		colour = null;
	}
	for (let sdkWindow of require("sdk/windows").browserWindows) {
		let chromeWindow = viewFor(sdkWindow);
		let chromeDocument = chromeWindow.document;
		setIndicatorColour(chromeDocument, colour);
	}
}
preferences.on("indicator.colour", indicatorColourChanged);

exports.onUnload = function(reason) {
	if (reason == "shutdown") {
		return;
	}

	listener.cleanup();
	preferences.removeListener("indicator.colour", indicatorColourChanged);

	preferences.reset("media.defaultAudioChannel", "content");
	preferences.reset("media.useAudioChannelService");

	for (let sdkWindow of require("sdk/windows").browserWindows) {
		let chromeWindow = viewFor(sdkWindow);
		let chromeDocument = chromeWindow.document;

		let pi = getStylesheetForDocument(chromeDocument);
		if (pi) {
			chromeDocument.removeChild(pi);
		}
		setIndicatorColour(chromeDocument, null);

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

			let colour = preferences.prefs["indicator.colour"];
			if (colour != "currentcolor") {
				setIndicatorColour(chromeDocument, colour);
			}
		}

		indicator = chromeDocument.createElementNS(SVGNS, "svg");
		indicator.setAttribute("anonid", "noise-indicator");
		indicator.setAttribute("height", "16");
		indicator.setAttribute("width", "16");
		indicator.className = "tab-icon-image";
		indicator.addEventListener("mousedown", function(event) {
			// Check there's only one click of the left button.
			if (event.button != 0 || event.detail != 1) {
				return;
			}

			let muted = indicator.classList.toggle("muted");
			chromeWindow.gBrowser.getBrowserForTab(xulTab).messageManager.sendAsyncMessage("NoiseControl:mute", muted);

			event.stopPropagation();
		}, true);
		if (Services.vc.compare(Services.appinfo.version, "38") == -1) {
			indicator.setAttribute("fx37", "true");
		}
		if (xulTab.selected) {
			indicator.setAttribute("selected", "true");
		}

		let use = chromeDocument.createElementNS(SVGNS, "use");
		use.setAttributeNS(XLINKNS, "href", data.url("noisy.svg#base"));
		indicator.appendChild(use);

		let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
		if (!closeButton) {
			// Look for the Tab Mix Plus close button.
			closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "tmp-close-button");
		}

		let tabContent = chromeDocument.getAnonymousElementByAttribute(xulTab, "class", "tab-content");
		tabContent.insertBefore(indicator, closeButton);

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

function setIndicatorColour(chromeDocument, colour) {
	if (chromeDocument._noiseControlCSS) {
		chromeDocument._noiseControlCSS.remove();
		delete chromeDocument._noiseControlCSS;
	}

	if (colour) {
		let rule = encodeURIComponent("svg[anonid=\"noise-indicator\"] > use { fill: " + colour + "; }");
		let pi = chromeDocument.createProcessingInstruction("xml-stylesheet", "href=\"data:text/css," + rule + "\" type=\"text/css\"");
		chromeDocument.insertBefore(pi, chromeDocument.getElementById("main-window"));
		chromeDocument._noiseControlCSS = pi;
	}
}

function fixBinding(event) {
	let xulTab = event.target;
	let chromeDocument = xulTab.ownerDocument;
	let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
	if (!closeButton) {
		// Look for the Tab Mix Plus close button.
		closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "tmp-close-button");
	}
	if (!closeButton) {
		return;
	}

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
	let chromeDocument = xulTab.ownerDocument;
	let chromeWindow = chromeDocument.defaultView;
	chromeWindow.gBrowser.getBrowserForTab(xulTab).messageManager.sendAsyncMessage("NoiseControl:checkNoise");
}
