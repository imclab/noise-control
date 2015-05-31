let EXPORTED_SYMBOLS = [];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let observer = {
	observe: function(subject, topic, data) {
		if (!subject || !subject.top) {
			return;
		}

		subject._hasNoise = data == "active";
		let utils = subject.top.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindowUtils);
		utils.containerElement.messageManager.sendAsyncMessage("NoiseControl:mediaPlayback", "!");
	},
	QueryInterface: XPCOMUtils.generateQI([
		Components.interfaces.nsIObserver,
		Components.interfaces.nsISupportsWeakReference,
		Components.interfaces.nsISupports
	])
};
Services.obs.addObserver(observer, "media-playback", true);
