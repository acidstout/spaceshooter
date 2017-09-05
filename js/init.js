var debug = false;

/**
 * Checks if fullscreen mode is not yet active and tries to switch to fullscreen.
 * 
 * @param e
 * @returns false
 */
function launchFullscreen(e) {
	// Get fullscreen element
	document.fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

	if (typeof(document.fullscreenElement) == 'undefined') {
		// Switch to fullscreen.
		if (e.requestFullscreen) {
			e.requestFullscreen();
		} else if (e.mozRequestFullScreen) {
			e.mozRequestFullScreen();
		} else if (e.webkitRequestFullscreen) {
			e.webkitRequestFullscreen();
		} else if (e.msRequestFullscreen) {
			e.msRequestFullscreen();
		}
	}
	
	return false;
}


/**
 * Exits fullscreen mode.
 *  
 * @returns false
 */
function exitFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
	
	return false;
}


/**
 * Toggle between fullscreen and windowed mode.
 * 
 * @param e
 * @returns false
 */
function toggleFullscreen(e) {
	// Get fullscreen element
	document.fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
	
	if ((typeof(document.fullscreenElement) == 'undefined' || document.fullscreenElement == null) && typeof(e) != 'undefined') {
		// Switch to fullscreen.
		if (e.requestFullscreen) {
			e.requestFullscreen();
		} else if (e.mozRequestFullScreen) {
			e.mozRequestFullScreen();
		} else if (e.webkitRequestFullscreen) {
			e.webkitRequestFullscreen();
		} else if (e.msRequestFullscreen) {
			e.msRequestFullscreen();
		}
	} else {
		// Switch back to windowed mode and set fullscreen element to null. Otherwise it will break toggling back and forth.
		document.fullscreenElement = null;
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
	
	return false;
}

/**
 * Init game.
 */
$(function() {
	// Choose game file.
	var gamefile = 'js/shooter.';
	if (!debug) {
		gamefile += 'min.';
	}

	// Initialize parallax starfield.
	$('#starfield').starscroll(16, 4, 25, 4, 5, [ 96, 255, 255 ], true, true, 3);
	
	// Initialize WADE game engine.
	wade.init(gamefile + 'js', {}, { container : 'game'});
});