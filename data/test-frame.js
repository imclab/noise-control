Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let s = new Set();
let b = false;
let observer = {
	observe: function(subject, topic, data) {
		if (!subject) {
			// console.log("eh?!");
			return;
		}
		// console.log("this script: " + (subject.top == content) + ", is top:" + (subject == content));
		if (subject.top == content) {
			// console.log(topic, data);
			if (data == "active") {
				s.add(subject);
				subject.addEventListener("unload", this.windowUnload);
			} else {
				s.delete(subject);
			}
			try {
				sendAsyncMessage("NoiseControl:testMessage", s.size);
				let hasNoise = s.size > 0;
				if (hasNoise != b) {
					sendAsyncMessage("NoiseControl:hasNoise", hasNoise);
					b = hasNoise;
				}
			} catch(ex) {
				// console.error(ex);
			}
		}
	},
	windowUnload: function(event) {
		s.delete(event.currentTarget);
		try {
			sendAsyncMessage("NoiseControl:testMessage", s.size);
			let hasNoise = s.size > 0;
			if (hasNoise != b) {
				sendAsyncMessage("NoiseControl:hasNoise", hasNoise);
				b = hasNoise;
			}
		} catch(ex) {
			// console.error(ex);
		}
	},
	QueryInterface: XPCOMUtils.generateQI([
		Components.interfaces.nsIObserver,
		Components.interfaces.nsISupportsWeakReference,
		Components.interfaces.nsISupports
	])
};
Services.obs.addObserver(observer, "media-playback", true);
// console.log("observer added");


// Services.obs.removeObserver(observer, "media-playback");
