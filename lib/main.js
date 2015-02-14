const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

let { data } = require("sdk/self");
let { viewFor } = require("sdk/view/core");

require("sdk/page-mod").PageMod({
	attachTo: ["existing", "top", "frame"],
	include: ["*", "file://*"],
	contentScriptFile: "./content.js",
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		worker.port.on("hasNoise", hasNoise => {
			let xulTab = viewFor(worker.tab);
			let chromeDocument = xulTab.ownerDocument;

			let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
			if (!indicator) {
				indicator = chromeDocument.createElementNS(XULNS, "image");
				indicator.setAttribute("anonid", "noise-indicator");
				indicator.className = "tab-icon-image";
				indicator.setAttribute("src", data.url("icon-16.png"));
				indicator.style.display = "-moz-box";
				indicator.style.marginLeft = indicator.style.marginRight = "0";
				indicator.style.pointerEvents = "auto";
				indicator.addEventListener("click", function() {
					console.log("test")
					worker.port.emit("test");
				});

				let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
				closeButton.parentNode.insertBefore(indicator, closeButton);
			}

			indicator.setAttribute("collapsed", hasNoise ? "false" : "true");
		});
		worker.port.on("flub", () => {
			console.log("flub")
		})
	}
});

exports.onUnload = function() {
	let tabs = require("sdk/tabs");
	for (let tab of tabs) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
		if (indicator) {
			indicator.remove();
		}
	}
};
