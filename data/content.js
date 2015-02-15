document.addEventListener("play", checkNoise, true);
document.addEventListener("pause", checkNoise, true);
document.addEventListener("volumechange", checkNoise, true);

self.on("detach", () => {
	document.removeEventListener("play", checkNoise, true);
	document.removeEventListener("pause", checkNoise, true);
	document.removeEventListener("volumechange", checkNoise, true);
});
self.port.on("mute", muted => {
	for (let video of document.querySelectorAll("audio, video")) {
		video.muted = muted;
	}
	tabMuted = muted;
});

let tabMuted = false;
let previous = false;
checkNoise();

function checkNoise() {
	let elements = document.querySelectorAll("audio, video");
	if (tabMuted && Array.some(elements, v => !v.muted)) {
		tabMuted = false;
		self.port.emit("unmuted");
	}

	let hasNoise = Array.some(
		elements,
		v => !v.paused && v.mozHasAudio && (v.muted == tabMuted) && v.volume
	);
	if (previous != hasNoise) {
		self.port.emit("hasNoise", hasNoise);
		previous = hasNoise;
	}
}
