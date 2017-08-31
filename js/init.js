var debug = false;

$(function() {
	// Choose game file.
	var gamefile = 'js/shooter.';
	if (!debug) {
		gamefile += 'min.';
	}

	// Initialize parallax starfield.
	$('#starfield').html('').starscroll(16,4,25,4,5,[96,255,255],true,true,10);
	
	// Initialize WADE game engine.
	wade.init(gamefile + 'js', {}, { container : 'game'});
});