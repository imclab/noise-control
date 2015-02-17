document.addEventListener("emptied", checkNoise, true);
document.addEventListener("play", checkNoise, true);
document.addEventListener("pause", checkNoise, true);
document.addEventListener("volumechange", checkNoise, true);

self.on("detach", () => {
	document.removeEventListener("emptied", checkNoise, true);
	document.removeEventListener("play", checkNoise, true);
	document.removeEventListener("pause", checkNoise, true);
	document.removeEventListener("volumechange", checkNoise, true);
});

checkNoise();

function checkNoise() {
	let hasNoise = Array.some(
		document.querySelectorAll("audio, video"),
		v => !v.paused && /*v.mozHasAudio &&*/ !v.muted && v.volume
	);
	self.port.emit("hasNoiseFrame", hasNoise);
}
