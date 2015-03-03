/* global exports, require */

exports.openTab = function(url) {
	console.log(url);
	return new Promise(function(resolve) {
		require("sdk/tabs").open({
			url: url,
			onPageShow: resolve
		});
	});
};

exports.url = function(path) {
	return require("sdk/self").data.url("").replace("/data/", path);
};

exports.wait = function(ms = 50) {
	return new Promise(function(resolve) {
		require("sdk/timers").setTimeout(resolve, ms);
	});
};
