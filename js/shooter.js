/**
 *
 *	Space shooter
 *	A WADE game engine based space shooter with parallax starfield background.
 *
 *	@author nrekow
 *
 */


// TODO:
//		- make player name editable

var version = '1.1.4';

/**
 * Functions to encode/decode Base64.
 */
var Base64 = {
	_keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

	encode(input) {
		'use strict';
		var output = '';
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8Encode(input);

		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}

		return output;
	},

	decode(input) {
		'use strict';
		var output = '';
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace('/[^A-Za-z0-9+/=]/g', '');

		while (i < input.length) {
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 !== 64) {
				output = output + String.fromCharCode(chr2);
			}

			if (enc4 !== 64) {
				output = output + String.fromCharCode(chr3);
			}
		}

		output = Base64._utf8Decode(output);
		return output;
	},

	_utf8Encode(string) {
		'use strict';
		string = string.replace('/\r\n/g', '\n');
		var utftext = '';

		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}

		return utftext;
	},

	_utf8Decode(utftext) {
		'use strict';
		var string = '';
		var i = 0,
			c1 = 0,
			c2 = 0,
			c3 = 0;

		while (i < utftext.length) {
			c1 = utftext.charCodeAt(i);

			if (c1 < 128) {
				string += String.fromCharCode(c1);
				i++;
			} else if ((c1 > 191) && (c1 < 224)) {
				c3 = utftext.charCodeAt(i + 1);
				string += String.fromCharCode(((c1 & 31) << 6) | (c3 & 63));
				i += 2;
			} else {
				c3 = utftext.charCodeAt(i + 1);
				c2 = utftext.charCodeAt(i + 2);
				string += String.fromCharCode(((c1 & 15) << 12) | ((c3 & 63) << 6) | (c2 & 63));
				i += 3;
			}
		}

		return string;
	}
};


/**
 * Main function of app
 *
 */
var App = function() {
	'use strict';
	var isMobileDevice = false || checkForMobileDevice();
	var MSIE = false || getBrowserVersion('Trident/([0-9]{1,}[.0-9]{0,})');
	var ship;										// Player's ship.
	var gamePaused     = false;						// Game paused.
	var gameStarted    = false;						// Game started.
	var pauseSpriteObj = null;
	
	var force2d        = false;						// If set true 2D canvas is preferred over WebGL, even if it's fully supported.
	var defaultLayerId = 1;

	var lastFireTime   = 0;							// The last time the player fired a bullet.
	var fireRate       = 4;							// How many bullets per second to fire.
	var fireRateTemp   = 4;							// Temporary fire rate (e.g. overrides default fire rate if cheat-mode is enabled).
	var fireDamage     = 200;						// How much damage is caused by one shot of the player's ship.
	
	var enemyHealth    = [ 400, 600, 800, 1500, 5000 ];	// Enemy's health.
	var enemyDelay     = 2000;						// How long to wait from spawning one enemy to spawning the next one.
	var nextEnemy;									// The process that will spawn the next enemy.

	var asteroidHealth = [ 200, 200, 200, 300, 400, 400, 600, 500, 400, 600 ];	// Asteroid's health.
	var asteroidDelay  = 1000;						// How long to wait from spawning one asteroid to spawning the next one.
	var nextAsteroid;								// The process that will spawn the next asteroid.
	
	var activeBullets  = [];						// A list of bullets we've fired and are still active.
	
	var scoreCounter;								// An object to display the score.
	var score          = 0;							// Current score.
	var divisor        = 1000;                      // Increase level and health every 1000 points. Gets increased by 10^level later.
	
	var dataNames      = {
		data: 'overkill'
	};

	var healthCounter;								// Object to display the health.
	var playerHealth   = 100;						// Initial health of player's ship.
	
	var levelCounter;								// Object to display the level.
	var level          = 1;							// Initial level.
	var loopUid        = null;						// Uid of the background music. Used to start/stop it.
	var musicPlaying   = false;						// Status of background music
	
	// Retrieve game data.
	var gameData       = wade.retrieveLocalObject(dataNames.data);

	// Disable cheat-mode by default.
	const sissy = (gameData && gameData.sissy) || false;
	
	// Get highscores.
	var oldHighScore   = (gameData && gameData.highscore) || 0;
	
	// Images, animations, music and sounds
	var images = {
		logo		: '../img/logo.png',
		ship        : '../img/ship.png',

		// Animated explosions (file, animation speed, number of tiles per x/y-axis).
		boom : {
			0 : {
				file: '../img/animations/explosion/explode_4x4_ship.png',
				speed: 30,
				x: 4,
				y: 4
			},
			1: {
				file: '../img/animations/explosion/explode_4x4_ring.png',
				speed: 30,
				x: 4,
				y: 4
			},
			2 : {
				file: '../img/animations/explosion/explode_5x3_enemy.png',
				speed: 30,
				x: 5,
				y: 3
			}
		},
		
		flyLeft     : '../img/animations/ship/fly_left.png',
		flyRight    : '../img/animations/ship/fly_right.png',
		
		// Bullets
		shipBullet   : '../img/bullets/bullet_ship.png',
		enemyBullets : {
			0 : {
				file: '../img/bullets/bullet0.png',
				delay: 600,
				damage: 1
			},
			1 : {
				file: '../img/bullets/bullet1.png',
				delay: 500,
				damage: 3
			},
			2 : {
				file: '../img/bullets/bullet2.png',
				delay: 400,
				damage: 5
			},
			3 : {
				file: '../img/bullets/bullet3.png',
				delay: 300,
				damage: 10
			},
			4 : {
				file: '../img/bullets/bullet4.png',
				delay: 200,
				damage: 20
			}
		},
		
		// Enemies
		enemies     : {
			0       : '../img/enemies/enemy0.png',
			1       : '../img/enemies/enemy1.png',
			2       : '../img/enemies/enemy2.png',
			3       : '../img/enemies/enemy3.png',
			4       : '../img/enemies/enemy4.png'
		},
		
		// Asteroids
		asteroids   : {
			0       : '../img/asteroids/asteroid0.png',
			1       : '../img/asteroids/asteroid1.png',
			2       : '../img/asteroids/asteroid2.png',
			3       : '../img/asteroids/asteroid3.png',
			4       : '../img/asteroids/asteroid4.png',
			5       : '../img/asteroids/asteroid5.png',
			6       : '../img/asteroids/asteroid6.png',
			7       : '../img/asteroids/asteroid7.png',
			8       : '../img/asteroids/asteroid8.png',
			9       : '../img/asteroids/asteroid9.png'
		},
		
		// Top row icons
		healthIcon  : '../img/icons/heart.png',
		levelIcon   : '../img/icons/star.png',
		scoreIcon   : '../img/icons/trophy.png'
	};
	
	var sounds = {
		shoot       : '../sounds/shoot.mp3',
		hit         : '../sounds/hit.mp3',
		explode     : '../sounds/explode.mp3',
		loop        : '../sounds/loop.mp3',
		menu        : '../sounds/menu.mp3'
	};
	
	var toggleRendererTitle    = document.getElementById('toggleRendererTitle');
	var toggleRendererBtn      = $('#toggleRendererBtn');
	var toggleMusicTitle       = document.getElementById('toggleMusicTitle');
	var toggleMusicBtn         = $('#toggleMusicBtn');
	var gameObj                = document.getElementById('game');
	var gameBtnObj             = document.getElementById('game-icons');
	
	$('#version').text(version + ', WADE ' + wade.getVersion());
	
	
	/**
	 * Check for focus loss (e.g. ich the user tabs/clicks away).
	 */
	$(window).blur(function() {
		console.log('Game paused due to focus loss.');
		wade.app.pauseGame();
		
		if (gameStarted && !gamePaused) {
			gamePaused = true;
		}
		
		return false;
	});


	/**
	 * Spawn asteroid sprites on the main screen if the game is not yet started, but its window has focus.
	 */
	$(window).focus(function() {
		if (!gameStarted) {
			console.log('Game resumed due to focus gain.');
			
			// Spawn asteroids.
			nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);

			// Resume music.
			if (musicPlaying) {
				wade.app.musicOn();
			}
			
			// Resume simulation.
			wade.resumeSimulation();
		}
	});

	
	// Prevent the game to be run in an iframe.
	wade.preventIframe();
	wade.setLoadingBar(true, {x: 0 , y: 0 }, '#333333', '#222222');
	wade.setLoadingImages('../img/loading.svg');

	
	/**
	 * Surround strings or objects which contain strings with padding.
	 * 
	 * @param obj
	 * @returns entity of input type
	 */
	this.padStrings = function(obj) {
		var padding = '       ';
		var tmp;
		
		if (typeof(obj) === 'object') {
			tmp = {};
			for (var i in obj) {
				if ({}.hasOwnProperty.call(obj, i)) {
					tmp[i] = padding + obj[i] + padding;
				}
			}
		} else {
			tmp = padding + obj + padding;
		}
		return tmp;
	};

	
	/**
	 * Load images and sounds. Also set screen size.
	 */
	this.load = function() {
		// Counter
		var i = 0;

		// Asteroids
		for (i = 0; i < Object.keys(images.asteroids).length; i++) {
			wade.loadImage(images.asteroids[i]);
		}

		// Logo
		wade.loadImage(images.logo);
		
		// Animation
		for (i = 0; i < Object.keys(images.boom).length; i++) {
			wade.loadImage(images.boom[i].file);
		}

		// Bullets
		wade.loadImage(images.shipBullet);
		for (i = 0; i < Object.keys(images.enemyBullets).length; i++) {
			wade.loadImage(images.enemyBullets[i].file);
		}

		// Enemies
		for (i = 0; i < Object.keys(images.enemies).length; i++) {
			wade.loadImage(images.enemies[i]);
		}

		// Ship and fly left/right lean animation
		wade.loadImage(images.ship);
		wade.loadImage(images.flyLeft);
		wade.loadImage(images.flyRight);

		// Top row icons
		wade.loadImage(images.healthIcon);
		wade.loadImage(images.levelIcon);
		wade.loadImage(images.scoreIcon);
		
		// Sounds. Workaround for old browsers which do not support WebAudio.
		var loadAudioFunction = wade.isWebAudioSupported()? 'loadAudio' : 'preloadAudio';
		wade[loadAudioFunction](sounds.shoot);
		wade[loadAudioFunction](sounds.hit);
		wade[loadAudioFunction](sounds.explode);
		wade[loadAudioFunction](sounds.loop);
		wade[loadAudioFunction](sounds.menu);
		
		var checkLoadingStatus = null;
		checkLoadingStatus = setInterval(function() {
			console.log('Loaded ' + Math.round(wade.getLoadingPercentage()) + '% of data.');
			if (wade.getLoadingPercentage() >= 100) {
				clearInterval(checkLoadingStatus);
			}
		}, 1000);
	};

	
	/**
	 * Initialize game.
	 */
	this.init = function() {
		// Reload game data. This is required after game over.
		gameData  = wade.retrieveLocalObject(dataNames.data);
		
		// Set layer render mode to either WebGL or 2D canvas.
		force2d = (gameData && gameData.force2d) || force2d;

		// Always set render-mode to 2D canvas first ...
		wade.setLayerRenderMode(defaultLayerId, '2d');

		// Disable quadtree optimization, because we have quite a lot of particles.
		// Gets re-enabled after initializing everything else.
		wade.useQuadtree(defaultLayerId, false);

		toggleRendererBtn.removeClass('fa-toggle-on');
		toggleRendererBtn.addClass('fa-toggle-off');
		toggleRendererTitle.title = 'Enable WebGL';
		
		// ... before we set it to WebGL. This eliminates ugly fonts.
		if (!force2d) {
			wade.setLayerRenderMode(defaultLayerId, 'webgl');
			
			// Update WebGL toggle icon to reflect current status.
			toggleRendererBtn.removeClass('fa-toggle-off');
			toggleRendererBtn.addClass('fa-toggle-on');
			toggleRendererTitle.title = 'Disable WebGL';
		}


		// Check whether to play background music.
//		if (wade.isWebAudioSupported()) {
			musicPlaying = (gameData && gameData.music) || musicPlaying;
			if (musicPlaying) {
				toggleMusicBtn.removeClass('music-off');
				toggleMusicBtn.addClass('music-on');
				toggleMusicTitle.title = 'Disable music';
			}
//		} else {
			// Just in case ... ;)
//			musicPlaying = false;
//		}
		
		
		// Set screen size to current size of viewport.
		wade.setMinScreenSize($(window).width(), $(window).height());
		wade.setMaxScreenSize($(window).width(), $(window).height());
		wade.setResolutionFactor(1);
		
		if (isMobileDevice) {
			wade.setMinScreenSize($(window).width() * 3, $(window).height() * 3);
			wade.setMaxScreenSize($(window).width() * 3, $(window).height() * 3);
			wade.setResolutionFactor(0.5);
			//wade.setMinScreenSize(wade.getMaxScreenWidth(), wade.getMaxScreenHeight());
			//wade.setMaxScreenSize(wade.getMaxScreenWidth(), wade.getMaxScreenHeight());
		}

		
		// Get default renderer.
		var defaultRenderer = wade.getLayerRenderMode(defaultLayerId);
		
		// Log statistics into file.
		/*
		if (debug) {
			log(
				'\n\t\tbrowser screen size   : '
				+ $(window).width() +'x' + $(window).height()
				+ '\n\t\tactual min screen size: '
				+ wade.getMinScreenWidth() + 'x' + wade.getMinScreenHeight()
				+ '\n\t\tactual max screen size: '
				+ wade.getMaxScreenWidth() + 'x' +  wade.getMaxScreenHeight()
				+ '\n\t\trender-mode           : ' + defaultRenderer
				+ '\n\t\tforce2D               : ' + force2d
				+ '\n\t\tisMobile              : ' + isMobileDevice
				+ '\n\t\tisSissy               : ' + sissy
				+ '\n\t\tcurrent score         : ' + score
				+ '\n\t\thighscore             : ' + oldHighScore
				+ '\n\t\tlevel                 : ' + level
				+ '\n\t\tplayer health         : ' + playerHealth
				+ '\n\t\tfire rate             : ' + fireRate
				+ '\n\t\tfire damage           : ' + fireDamage
			);
		}		
		*/
		// Main screen text.
		var menuTexts = {
			insertCoin  : '- INSERT COIN -',
			highscoreIs : 'HIGHSCORE IS %i POINTS',
			youScored   : 'YOU %s %i POINTS'
		};
		
		
		// Ugly workaround for cut-off texts when using WebGL.
		if (defaultRenderer === 'webgl') {
			menuTexts = wade.app.padStrings(menuTexts);
		}
		
		
		// Prepare text sprites of main screen.
		var clickText = new TextSprite(menuTexts.insertCoin, '36pt Highspeed', 'white', 'center');
		clickText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, clickText.draw));
		var clickToStart = new SceneObject();
		
		clickToStart.addSprite(clickText, { y: 320 });

		
		// Get current highscore.
		wade.app.getHighestScore(score, clickToStart, menuTexts);

		if (score > 0) {
			var scoreVerb = Base64.decode('U0NPUkVE'); //'SCORED';

			// Store highscore only if player didn't cheat. 
			if (sissy) {
				scoreVerb = Base64.decode('Q0hFQVRFRA=='); //'CHEATED';
			} else {
				wade.app.saveHighscore(score);
			}
			
			var scoreMsg = menuTexts.youScored.replace('%s', scoreVerb);
			scoreMsg = scoreMsg.replace('%i', score);
			if (defaultRenderer === 'webgl') {
				scoreMsg = wade.app.padStrings(scoreMsg);
			}

			clickToStart.addSprite(new TextSprite(scoreMsg, '24pt Highspeed', 'white', 'center'), { y: 120 });

			if (score > oldHighScore) {
				var highscoreMessage = Base64.decode('TkVXIEhJR0hTQ09SRQ=='); //'NEW HIGHSCORE';
				oldHighScore = score;
				score = 0;
				
				if (sissy) {
					highscoreMessage += Base64.decode('IE5PVCBTQVZFRA=='); //' NOT SAVED';
				}
				
				highscoreMessage += '!';
				
				// Again that ugly thing.
				if (defaultRenderer === 'webgl') {
					highscoreMessage = wade.app.padStrings(highscoreMessage);
				}
				
				var newHighscoreText = new TextSprite(highscoreMessage, '24pt Highspeed', 'yellow', 'center');
				//newHighscoreText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, newHighscoreText.draw));
				clickToStart.addSprite(newHighscoreText, { y: 160 });
			}
		}
		

		// Add logo
		clickToStart.addSprite(new Sprite(images.logo), { y: -200 });
		
		
		// Add pause text into hidden scene object.
		pauseSpriteObj = new SceneObject();
		var pauseSpriteText = new TextSprite('PAUSED', '32pt Highspeed', 'yellow', 'center');
		pauseSpriteText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, pauseSpriteText.draw));
		pauseSpriteObj.addSprite(new Sprite(images.logo), { y: -200 });
		pauseSpriteObj.addSprite(pauseSpriteText, { y: 160 });
		
		
		// Show close button and default cursor while not playing.
		gameBtnObj.style.display = 'block';
		gameObj.style.cursor = 'default';
		
		
		// Show main menu.
		wade.addSceneObject(clickToStart);
		

		// Initialize asteroids on the main screen. Prevents the use of images which are not loaded, yet.
		var initAsteroidsInterval = null; 
		initAsteroidsInterval = setTimeout(function() {
			if (wade.getLoadingPercentage() >= 100) {
				console.log('Initializing asteroids on main screen.');
				nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
				clearInterval(initAsteroidsInterval);
			}
		}, 1000);
		
		
		// Decide whether to play music or not.
//		if (wade.isWebAudioSupported()) {
			if (musicPlaying) {
				wade.app.musicOn();
			}
//		}

		
		/**
		 * Start game on left mouse click.
		 */
		wade.app.onMouseDown = function() {
			if (wade.isMouseDown(0) || (wade.isMouseDown() && (isMobileDevice || MSIE))) {
				// Hide toggle buttons and cursor while playing.
				gameBtnObj.style.display = 'none';
				gameObj.style.cursor = 'none';

				clearTimeout(nextAsteroid);
				wade.removeSceneObject(clickToStart);
				wade.clearScene();
				wade.removeUnusedLayers([ 1 ]);	// Remove all unused layers, but layer 1.
				wade.clearCanvas(defaultLayerId);
				wade.app.onMouseDown = 0;
				wade.app.startGame();
			}
		};
	};

	
	/**
	 * Get highest score. Wrapper around an AJAX request to eliminate the "disadvantages" of async requests.
	 */
	this.getHighestScore = function(score, clickToStart, menuTexts) {
		var ajaxInterval = setInterval(function() {
			var payload = {
				'action' : 'getHighestScore'
			};

			var json = JSON.stringify(payload);
			var data = Base64.encode(json);

			$.ajax({
				url: 'php/backend.php',
				type: 'POST',
				data: 'data=' + data,
				success(result) {
					if (result == null || result == '' || result == 'FAILED') {
						//result = 0;
						result = oldHighScore;
					}
					
					//console.log('Score:' + score + ', Result: ' + result + ', Old: ' + oldHighScore);

					if (score <= 0 || result > score) {
						// Show current highscore
						menuTexts.highscoreIs = menuTexts.highscoreIs.replace('%i', result);
						clickToStart.addSprite(new TextSprite(menuTexts.highscoreIs, '24pt Highspeed', 'yellow', 'center'), { y: 160 });
					}

					oldHighScore = result;
					clearTimeout(ajaxInterval);
				},
				error(xhr, status, code) {
					console.warn('getHighestScore(): AJAX call returned: ' + status + ': ' + code);
				}
			});
		}, 1000);
	};
	
	
	/**
	 * Load highscore
	 */
	this.loadHighscore = function() {
		var payload = {
			'action' : 'loadScore'
		};

		var json          = JSON.stringify(payload);
		var data          = Base64.encode(json);
		var msg           = 'Highscore not loaded!';
		var highscoreOnly = (typeof(highscoreOnly) !== 'undefined') ? highscoreOnly : false;

		$.ajax({
			url: 'php/backend.php',
			type: 'POST',
			data: 'data=' + data,
			success(result) {
				if (result != 'FAILED') {
					var highscoreObj = JSON.parse(result);
					var highscoreHtml = '';
					$.each(highscoreObj, function(i, item) {
						highscoreHtml += '<tr><td>' + item.player + '</td><td>' + item.score + '</td></tr>';
						//console.log(item.player + ' = ' + item.score);
					});
					
					$('#highscoreTable').html(highscoreHtml);
				}
			},
			error(xhr, status, code) {
				console.warn('AJAX call returned: ' + status + ': ' + code);
				$('.msg').html(msg);
			}
		});
	};
	
	
	/**
	 * Save highscore
	 */
	this.saveHighscore = function(currentScore, currentPlayer) {
		currentScore = (typeof(currentScore) !== 'undefined') ? currentScore : score;
		currentPlayer = (typeof(currentPlayer) !== 'undefined') ? currentPlayer : 'Player';

		var msg    = 'Highscore not saved!';
		
		var payload = {
			'action' : 'saveScore',
			'player' : currentPlayer,
			'score'  : currentScore
		};
		
		var json   = JSON.stringify(payload);
		var data   = Base64.encode(json);
			
		$.ajax({
			url: 'php/backend.php',
			type: 'POST',
			data: 'data=' + data,
			success(result) {
				if (result == 'OK') {
					msg = 'Highscore saved!';
				} else {
					// Save score in LocalDB if database connection failed.
					gameData = {
						force2d: force2d,
						music: musicPlaying,
						highscore: currentScore
					};
						
					wade.storeLocalObject(dataNames.data, gameData);
				}
				
				$('.msg').html(msg);
			},
			error(xhr, status, code) {
				console.warn('saveHighscore() returned: ' + status + ': ' + code);
				$('.msg').html(msg);
			}
		});
	};
	
	
	/**
	 * Handle mouse move and animation of ship.
	 * 
	 * @param eventData
	 */
	this.handleMouseMove = function(ship, images, eventData) {
		// Get position and sprite of ship.
		var shipPosition = ship.getPosition();
		var sprite = ship.getSprite();
		var animation = null;
		
		// Decide direction of animation
		if (shipPosition.x < 0) {
			if (shipPosition.x > eventData.screenPosition.x) {
				//console.log('left');
				animation = new Animation(images.flyLeft, 5, 1, 30);
			} else if (shipPosition.x < eventData.screenPosition.x) {
				//console.log('right');
				animation = new Animation(images.flyRight, 5, 1, 30);
			}
		} else if (shipPosition.x > 0) {
			if (shipPosition.x < eventData.screenPosition.x) {
				//console.log('right');
				animation = new Animation(images.flyRight, 5, 1, 30);
			} else if (shipPosition.x > eventData.screenPosition.x) {
				//console.log('left');
				animation = new Animation(images.flyLeft, 5, 1, 30);
			}
		}			

		// Animate ship
		if (animation !== null) {
			sprite.addAnimation('fly', animation);
			ship.playAnimation('fly');
		
			ship.onAnimationEnd = function() {
				sprite.setImageFile(images.ship);
			};
		}
		
		// Finally move ship to new position.
		return ship && ship.setPosition(eventData.screenPosition.x, eventData.screenPosition.y);
	};

	
	/**
	 * Start game function.
	 */
	this.startGame = function() {
		console.log('Re-enabling quadtree optimizations.');
		wade.useQuadtree(defaultLayerId, true);

		var sprite = new Sprite(images.ship);
		var mousePosition = wade.getMousePosition();
		ship = new SceneObject(sprite, 0, mousePosition.x, mousePosition.y);
		wade.addSceneObject(ship);
		
		/**
		 * Function to handle player shooting.
		 */
		wade.setMainLoop(function() {
			// Reset fire rate.
			fireRateTemp = fireRate;

			// Mouse-buttons (e.g. 0 = left, 1 = middle, 2 = right)
		
			// Turbo fire!
			if (wade.isMouseDown(2) && sissy) {
				fireRateTemp = 50;
			}

			var nextFireTime = lastFireTime + 1 / fireRateTemp;
			var time = wade.getAppTime();
			
			if ((wade.isMouseDown(0) || wade.isMouseDown(2) || (wade.isMouseDown() && (isMobileDevice || MSIE))) && time >= nextFireTime) {
				lastFireTime = time;
				var shipPosition = ship.getPosition();
				var shipSize = ship.getSprite().getSize();
				var sprite = new Sprite(images.shipBullet);
				var bullet = new SceneObject(sprite, 0, shipPosition.x, shipPosition.y - shipSize.y / 2);
				wade.addSceneObject(bullet);
				wade.playAudio(sounds.shoot, false);
				activeBullets.push(bullet);
				bullet.moveTo(shipPosition.x, -500, 600);
				
				/**
				 * Remove bullet from scene if move has completed.
				 */
				bullet.onMoveComplete = function() {
					wade.removeSceneObject(this);
					wade.removeObjectFromArray(this, activeBullets);
				};
				
				// Decrease score with every shoot
				if (score > 0 && !sissy && fireRateTemp < 60) {
					score -= 10;
				}
				
				if (score < 0 || score === 'NaN') {
					score = 0;
				}
			}

			// Check for collisions.
			if (activeBullets.length  > 0) {
				
				for (var i = activeBullets.length - 1; i >= 0; i--) {
					var colliders = activeBullets[i].getOverlappingObjects();

					if (colliders.length > 0) {
						for (var j = 0; j < colliders.length; j++) {

							if (colliders[j].isEnemy) {
								// Create explosion and play hit sound.
								var position = colliders[j].getPosition();
								wade.app.explosion(position, 1);
								wade.playAudio(sounds.hit, false);

								// Decrease health of collider (e.g. enemy, , ...).
								if (colliders[j].health > 0) {
									colliders[j].health -= fireDamage;
								}
								
								// Check enemy's health again.
								if (colliders[j].health <= 0) {
									// Create another explosion and play explode sound.
									wade.app.explosion(position, 2);
									wade.playAudio(sounds.explode, false);
									
									// Delete collider (enemy/asteroid).
									wade.removeSceneObject(colliders[j]);

									// Increase score if enemy/asteroid shot down by a 10th of its initial health.
									score += Math.floor(colliders[j].initialHealth / 10) * level;
								}

								// Delete bullet.
								wade.removeSceneObject(activeBullets[i]);
								wade.removeObjectFromArrayByIndex(i, activeBullets);

								break;
							}
						}
					}
				}
			}

			if (Math.floor(score / divisor) > level -1 && level < 5) {
				// Increase score required to fill up health (e.g. level 1 = 1.000, level 2 = 10.000, level 3 = 100.000, ...).
				divisor = divisor * Math.pow(10, level);

				level += 1;

				if (!sissy) {
					playerHealth = 100;
				}

				// Make enemies spawn faster.
				if (enemyDelay > 200) {
					enemyDelay -= 100;
				}

				// Make asteroids spawn faster.
				if (asteroidDelay > 400) {
					asteroidDelay -= 100;
				}

				// Increase firerate.
				if (fireRate < 50) {
					fireRate += 1;
				}
				
				// Increase damage.
				if (fireDamage < 600) {
					fireDamage += (level * 10);
				}
			}

			// Draw updated health, level and score.
			healthCounter.getSprite().setText(playerHealth);
			levelCounter.getSprite().setText(level);
			scoreCounter.getSprite().setText(Math.floor(score) + ', Left: ' + (divisor - Math.floor(score)));
		}, 'fire');


		/**
		 * Function to handle player dying.
		 */
		wade.setMainLoop(function() {
			// Get a list of overlapping objects on the current layer.
			var overlapping = ship.getOverlappingObjects(false, 'axis-aligned');
			var hit = false;
			var enemyDamage = 1;
			
			// If the list is not empty ...
			if (overlapping.length > 0) {
				
				for (var i = 0; i < overlapping.length; i++) {

					if (typeof(overlapping[i]) !== 'undefined') {
						// ... check if the overlapping object is either an enemy or an enemy's bullet.
						if (overlapping[i].isEnemy || overlapping[i].isEnemyBullet) {
							
							// Comparing per-pixel is quite slow, but the only easy way to check for collisions while discarding transparent pixels.
							if (typeof(overlapping[i]) !== 'undefined' && ship.overlapsObject(overlapping[i], 'pixel')) {
								// Decrease health of overlapping object by a 10th of the default fire damage.
								if (overlapping[i].health > 0) {
									overlapping[i].health -= Math.floor(fireDamage / 10);
								}
								
								// Remove enemy's bullet and/or ship if it hit the player's ship.
								if (typeof(overlapping[i]) !== 'undefined' && (overlapping[i].isEnemyBullet || overlapping[i].health <= 0)) {
									wade.removeSceneObject(overlapping[i]);
									wade.removeObjectFromArrayByIndex(i, overlapping);
								}
								
								if (typeof(overlapping[i]) !== 'undefined') {
									enemyDamage = overlapping[i].damage || enemyDamage;
								}

								hit = true;
								break;
							}
						}
					}
				}
			}
			
			if (hit) {
				hit = false;

				// Create explosion and play hit sound if player gets hit by a bullet.
				wade.app.explosion(ship.getPosition(), 0);
				wade.playAudio(sounds.hit, false);

				// Decrease health.
				if (playerHealth > 0) {
					playerHealth -= enemyDamage;
				}
				
				if (playerHealth < 0 || playerHealth === 'NaN') {
					playerHealth = 0;
				}
				healthCounter.getSprite().setText(playerHealth);
			}

			// Always check player's health. Not only when hit. Fixes an issue where the ship disappeared, but the game continued.
			if (playerHealth <= 0) {
				// Create another explosion and play explode sound if player's health is zero or less.
				var explosionAnimation = wade.app.explosion(ship.getPosition(), 2);
				wade.playAudio(sounds.explode, false);
				
				wade.removeSceneObject(ship);
				wade.setMainLoop(null, 'fire');
				wade.setMainLoop(null, 'die');

				// Check high score
				if (!sissy && score > oldHighScore) {
					gameData = {
						force2d: force2d,
						music: musicPlaying,
						highscore: score
					};
					
					//wade.app.saveHighscore(score);
					wade.storeLocalObject(dataNames.data, gameData);
				}

				// On player's death set an interval to check if the ship's explosion animation has finished playing.
				var gameOverInterval = setInterval(function() {
					// Wait for the animation to finish.
					if (!explosionAnimation.isPlaying()) {
						// Reset game state.
						gameStarted = false;

						// Stop in-game music and play menu music.
						if (musicPlaying) {
							wade.app.musicOn();
						}

						// Clear interval and timeouts.
						clearInterval(gameOverInterval);
						clearTimeout(nextEnemy);
						clearTimeout(nextAsteroid);
						
						// Clear scene and initialize app.
						wade.clearScene();
						wade.app.init();
					}
				}, 100);
			}
		}, 'die');
		
		
		if (!gameStarted) {
			// Initialize game values
			if (sissy) {
				playerHealth = 999;
			} else {
				playerHealth = 100;
			}
			
			// Reset values to defaults. Otherwise you were able to continue the game where you got killed.
			score = 0;
			level = 1;
			fireRate = 4;
			fireDamage = 200;
			gameStarted = true;

			// Stop menu music and play in-game music.
			if (musicPlaying) {
				wade.app.musicOn();
			}
		}
		
		// Add a score counter
		var scoreIconSprite = new Sprite(images.scoreIcon);
		var scoreIconObj = new SceneObject(scoreIconSprite, 0, wade.getScreenWidth() / 2 - 20, -10 - wade.getScreenHeight() / 2 + 30);
		wade.addSceneObject(scoreIconObj);

		var scoreSprite = new TextSprite(score.toString(), '32pt Highspeed', '#f88', 'right');
		scoreCounter = new SceneObject(scoreSprite, 0, wade.getScreenWidth() / 2 - 40, 4 - wade.getScreenHeight() / 2 + 30);
		wade.addSceneObject(scoreCounter);
		
		
		// Add a health counter.
		var healthIconSprite = new Sprite(images.healthIcon);
		var healthIconObj = new SceneObject(healthIconSprite, 0, -120, -10 - wade.getScreenHeight() / 2 + 30);
		wade.addSceneObject(healthIconObj);

		var healthSprite = new TextSprite(playerHealth.toString(), '32pt Highspeed', '#f88', 'center');
		healthCounter = new SceneObject(healthSprite, 0, -40, 4 - wade.getScreenHeight() / 2 + 30);
		wade.addSceneObject(healthCounter);
		
		
		// Add level indicator
		var levelIconSprite = new Sprite(images.levelIcon);
		var levelIconObj = new SceneObject(levelIconSprite, 0, 20 - (wade.getScreenWidth() / 2), -12 - wade.getScreenHeight() / 2 + 30);
		wade.addSceneObject(levelIconObj);

		var levelSprite = new TextSprite(level, '32pt Highspeed', '#f88', 'left');
		levelCounter = new SceneObject(levelSprite, 0, 40 - (wade.getScreenWidth() / 2), 4 - wade.getScreenHeight() / 2 + 30);
		wade.addSceneObject(levelCounter);
		
		
		// Spawn enemies every two seconds and asteroids every second.
		nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
		nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
	};

	
	/**
	 * Wrapper around pause functions.
	 */
	this.pauseGame = function() {
		// Don't spawn asteroids on main screen if window has no focus.
		clearTimeout(nextAsteroid);
		
		// Pause music.
		wade.app.musicOff();

		if (gameStarted) {
			// Don't spawn enemies.
			clearTimeout(nextEnemy);
			
			// Don't move ship.
			wade.app.onMouseMove = null;
			
			// Show PAUSED message.
			wade.addSceneObject(pauseSpriteObj);
			
			// Show mouse cursor.
			gameObj.style.cursor = 'default';
		}

		// Finally pause simulation. Has to be done after clearing spawn-timeouts.
		wade.pauseSimulation();
		
		return false;
	};
	
	
	/**
	 * Check if space key has been pressed. Toggles game to pause/resume.
	 */
	this.onKeyDown = function(eventData) {
		// Check for space key 
		if (gameStarted && eventData.keyCode === 32) {
			gamePaused = !gamePaused;

			if (gamePaused) {
				console.log('Game paused by user.');
				wade.app.pauseGame();
			} else {
				console.log('Game resumed by user.');
				gameObj.style.cursor = 'none';
				nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
				nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
				wade.removeSceneObject(pauseSpriteObj);
				
				// Resume music.
				if (musicPlaying) {
					wade.app.musicOn();
				}
				
				wade.resumeSimulation();
				wade.app.onMouseMove = function(eventData) {
					if (typeof(ship) !== 'undefined') {
						wade.app.handleMouseMove(ship, images, eventData);
					}
				};
			}
		}

		return false;
	};
	
	
	/**
	 * Move and animate ship according to mouse move.
	 */
	this.onMouseMove = function(eventData) {
		if (typeof(ship) !== 'undefined') {
			return wade.app.handleMouseMove(ship, images, eventData);
		}
	};

	
	/**
	 * Draw explosion.
	 */
	this.explosion = function(position, i) {
		// Fallback
		if (typeof(i) === 'undefined' || i === null || typeof(images.boom[i]) === 'undefined') {
			i = 0;
		}
		
		// Create an animation.
		var animation = new Animation(images.boom[i].file, images.boom[i].x, images.boom[i].y, images.boom[i].speed);
		
		// Create a sprite of the animation.
		var explosionSprite = new Sprite();
		explosionSprite.setSize(100, 100);
		explosionSprite.addAnimation('boom', animation);

		// Create a new scene object of the sprite.
		var explosion = new SceneObject(explosionSprite, 0, position.x, position.y);
		wade.addSceneObject(explosion);
		explosion.playAnimation('boom');

		/**
		 * Remove explosion sprite.
		 */
		explosion.onAnimationEnd = function() {
			wade.removeSceneObject(this);
		};
		
		return animation;
	};
	
	
	/**
	 * Return random coordinates for a given sprite.
	 */
	this.getRandomCoords = function(sprite) {
		return {
			x1: (Math.random() - 0.5) * wade.getScreenWidth(),
			y1: -wade.getScreenHeight() / 2 - sprite.getSize().y / 2,
			x2: (Math.random() - 0.5) * wade.getScreenWidth(),
			y2: Math.abs(wade.getScreenHeight() / 2 - sprite.getSize().y / 2)
		};
	};
	
	
	/**
	 * Return random integer between min and max values.
	 *
	 * @return random integer
	 */
	this.getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	
	
	/**
	 * Spawn asteroid.
	 */
	this.spawnAsteroid = function() {
		// Create an empty sprite.
		var sprite;
		
		// Select random image of asteroid as sprite.
		var asteroidId = wade.app.getRandomInt(0, 9);
		sprite = new Sprite(images.asteroids[asteroidId]);
		
		// Calculate start and end coordinates.
		var coords = wade.app.getRandomCoords(sprite);
		
		// Add the object to the scene and make it move.
		var asteroid = new SceneObject(sprite, 0, coords.x1, coords.y1);
		wade.addSceneObject(asteroid);
		asteroid.moveTo(coords.x2, coords.y2, 200);
		asteroid.isEnemy = true;
		asteroid.isAsteroid = true;
		asteroid.health = asteroidHealth[asteroidId];
		asteroid.initialHealth = asteroidHealth[asteroidId];
		asteroid.damage = Math.floor(asteroidHealth[asteroidId] / 100);
		
		
		/**
		 * When the asteroid has finished moving, delete it.
		 */
		asteroid.onMoveComplete = function() {
			wade.removeSceneObject(this);
		};

		// Spawn another asteroid.
		nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
	};
	
	
	/**
	 * Spawn enemy.
	 */
	this.spawnEnemy = function() {
		// Create an empty sprite.
		var sprite;

		var maxEnemy = level - 1;
		var enemyCount = Object.keys(images.enemies).length - 1;
		
		if (maxEnemy > enemyCount) {
			maxEnemy = enemyCount;
		}
		
		// Select random image of enemy as sprite.
		var enemyId = wade.app.getRandomInt(0, maxEnemy);
		sprite = new Sprite(images.enemies[enemyId]);

		// Calculate start and end coordinates.
		var coords = wade.app.getRandomCoords(sprite);

		// Add the object to the scene and make it move.
		var enemy = new SceneObject(sprite, 0, coords.x1, coords.y1);
		wade.addSceneObject(enemy);
		enemy.moveTo(coords.x2, coords.y2, 200);
		enemy.isEnemy = true;
		enemy.isAsteroid = false;
		enemy.health = enemyHealth[enemyId];
		enemy.initialHealth = enemyHealth[enemyId];
		enemy.damage = Math.floor(enemyHealth[enemyId] / 100);

		
		/**
		 * When the enemy has finished moving, delete it.
		 */
		enemy.onMoveComplete = function() {
			wade.removeSceneObject(this);
		};


		/**
		 * Override step function and let enemy rotate to the position of player's ship.
		 */
		enemy.originalStep = enemy.step;
		enemy.step = function() {
			this.originalStep();
			var enemyPosition = this.getPosition();
			var playerPosition = ship.getPosition();
			var angle = Math.atan2(playerPosition.y - enemyPosition.y, playerPosition.x - enemyPosition.x) - 3.14 / 2;
			this.setRotation(angle);
		};
		
		
		/**
		 * Let enemy fire bullets.
		 */
		enemy.fire = function() {
			var enemySize = this.getSprite().getSize();
			var enemyPosition = this.getPosition();
			var playerPosition = ship.getPosition();

			// Calculate direction.
			var dx = playerPosition.x - enemyPosition.x;
			var dy = playerPosition.y - enemyPosition.y;
			var length = Math.sqrt(dx * dx + dy * dy);
			dx /= length;
			dy /= length;

			// Calculate initial and final position for the bullet.
			var startX = enemyPosition.x + dx * enemySize.x / 2;
			var startY = enemyPosition.y + dy * enemySize.y / 2;
			var endX = startX + dx * 3000;
			var endY = startY + dy * 3000;

			// Create bullet.
			var sprite = new Sprite(images.enemyBullets[enemyId].file);
			var bullet = new SceneObject(sprite, 0, startX, startY);
			bullet.isEnemyBullet = true;
			bullet.damage = images.enemyBullets[enemyId].damage;
			wade.addSceneObject(bullet);
			bullet.moveTo(endX, endY, 200);

			// Delete bullet when it's finished moving.
			bullet.onMoveComplete = function() {
				wade.removeSceneObject(this);
			};

			// Schedule next bullet.
			this.schedule(images.enemyBullets[enemyId].delay, 'fire'); // 1000
		};
		enemy.schedule(300, 'fire'); // 500
		
		// Spawn another enemy.
		nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
	};
	
	
	/**
	 * Toggle layer renderer
	 */
	this.toggleRenderer = function() {
		force2d = !force2d;
		
		// Update local store and cookie with settings.
		gameData = { 
			force2d: force2d,
			music: musicPlaying,
			highscore: oldHighScore
		};
		wade.storeLocalObject(dataNames.data, gameData);

		// Reset game state to activate new settings.
		clearTimeout(nextEnemy);
		clearTimeout(nextAsteroid);
		wade.setMainLoop(null, 'fire');
		wade.setMainLoop(null, 'die');
		gameStarted = false;
		wade.clearScene();
		wade.app.init();
	};

	
	/**
	 * Start playing music
	 */
	this.musicOn = function() {
		if (loopUid > -1) {
			wade.stopAudio(loopUid);
		} else {
			// Fallback if no uid is available for whatever reason.
			wade.stopAudio();
		}
		
		if (gameStarted) {
			loopUid = wade.playAudio(sounds.loop, true);	
		} else {
			loopUid = wade.playAudio(sounds.menu, true);
		}

		// On error
		if (loopUid < 0) {
			toggleMusicBtn.removeClass('music-on');
			toggleMusicBtn.addClass('music-off');
			toggleMusicTitle.title = 'Enable music';
			musicPlaying = false;
		}

		return false;
	};
	
	
	/**
	 * Stop playing music
	 * 
	 * Does NOT work in IE, because IE is a shitty browser and does not support stopping audio streams.
	 */
	this.musicOff = function() {
		if (loopUid > -1) {
			wade.stopAudio(loopUid);
		} else {
			// Fallback if no uid is available for whatever reason.
			wade.stopAudio();
		}
		
		return false;
	};
	
	
	/**
	 * Toogle background music
	 */
	this.toggleMusic = function() {
		if (musicPlaying) {
			musicPlaying = false;
			
			toggleMusicBtn.removeClass('music-on');
			toggleMusicBtn.addClass('music-off');
			toggleMusicTitle.title = 'Enable music';

			wade.app.musicOff();
		} else {
			musicPlaying = true;

			toggleMusicBtn.removeClass('music-off');
			toggleMusicBtn.addClass('music-on');
			toggleMusicTitle.title = 'Disable music';

			wade.app.musicOn();
		}
		
		gameData = {
			force2d: force2d,
			music: musicPlaying,
			highscore: oldHighScore
		};
		wade.storeLocalObject(dataNames.data, gameData);

		return false;
	};
};
