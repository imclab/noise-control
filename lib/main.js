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
			let tab = viewFor(worker.tab);
			let chromeDocument = tab.ownerDocument;

			let indicator = chromeDocument.getAnonymousElementByAttribute(tab, "anonid", "noise-indicator");
			if (!indicator) {
				indicator = chromeDocument.createElementNS(XULNS, "image");
				indicator.setAttribute("anonid", "noise-indicator");
				indicator.className = "tab-icon-image";
				indicator.setAttribute("src", data.url("icon-16.png"));
				indicator.style.display = "-moz-box";
				indicator.style.marginLeft = indicator.style.marginRight = "0";

				let closeButton = chromeDocument.getAnonymousElementByAttribute(tab, "anonid", "close-button");
				closeButton.parentNode.insertBefore(indicator, closeButton);
			}

			indicator.setAttribute("collapsed", hasNoise ? "false" : "true");
		});
	}
});
