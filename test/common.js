/* global exports, require */

exports.openTab = function(url) {
	return new Promise(function(resolve) {
		require("sdk/tabs").open({
			url: url,
			onPageShow: resolve
		});
	});
};

exports.wait = function(ms = 50) {
	return new Promise(function(resolve) {
		require("sdk/timers").setTimeout(resolve, ms);
	});
};
