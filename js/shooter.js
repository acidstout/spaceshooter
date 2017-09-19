/**
 *
 *	Space shooter
 *	A WADE game engine based space shooter with parallax starfield background.
 *
 *	@author nrekow
 *
 */

var cheat = false;
//cheat = true;

/**
 * Main function of app
 *
 */
var App = function() {
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
	
	var healthCounter;								// Object to display the health.
	var playerHealth   = 100;						// Initial health of player's ship.
	
	var levelCounter;								// Object to display the level.
	var level          = 1;							// Initial level.
	
	var images = {
		logo		: '../img/logo.png',
		ship        : '../img/ship.png',

		// Animated explosions (file, animation speed, number of tiles per x/y-axis).
		boom : {
			0 : {
					file: '../img/animations/explode_4x4_ship.png',
					speed: 30,
					x: 4,
					y: 4
				},
			1: {
					file: '../img/animations/explode_4x4_ring.png',
					speed: 30,
					x: 4,
					y: 4
				},
			2 : {
					file: '../img/animations/explode_5x3_enemy.png',
					speed: 30,
					x: 5,
					y: 3
				}
		},
		
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
	}
	
	var sounds = {
		shoot       : '../sounds/shoot.mp3',
		hit         : '../sounds/hit.mp3',
		explode     : '../sounds/explode.mp3'
	}
	
	var toggleTitle       = document.getElementById('toggleTitle');
	var toggleRendererBtn = $('#toggleRendererBtn');

	/**
	 * Load images and sounds. Also set screen size.
	 */
	this.load = function() {
		// Images
		wade.loadImage(images.logo);
		wade.loadImage(images.ship);
		
		// Bullets
		wade.loadImage(images.shipBullet);
		for (var i = 0; i < Object.keys(images.enemyBullets).length; i++) {
			wade.loadImage(images.enemyBullets[i].file);
		}
		
		// Animation
		for (var i = 0; i < Object.keys(images.boom).length; i++) {
			wade.loadImage(images.boom[i].file);
		}

		// Top row icons
		wade.loadImage(images.healthIcon);
		wade.loadImage(images.levelIcon);
		wade.loadImage(images.scoreIcon);
		
		// Enemies
		for (var i = 0; i < Object.keys(images.enemies).length; i++) {
			wade.loadImage(images.enemies[i]);
		}
		
		// Asteroids
		for (var i = 0; i < Object.keys(images.asteroids).length; i++) {
			wade.loadImage(images.asteroids[i]);
		}

		// Sounds
		wade.loadAudio(sounds.shoot);
		wade.loadAudio(sounds.hit);
		wade.loadAudio(sounds.explode);
	};

	
	/**
	 * Initialize game.
	 */
	this.init = function() {
		// Set layer render mode to either WebGL or 2D canvas.
		var force2dData = wade.retrieveLocalObject('force2d');
		force2d = (force2dData && force2dData.force2d) || force2d;
		force2d = (getCookie('force2d') == 'true') || force2d;

		if (force2d) {
			wade.setLayerRenderMode(defaultLayerId, '2d');
			toggleRendererBtn.removeClass('fa-toggle-on');
			toggleRendererBtn.addClass('fa-toggle-off');
			toggleTitle.title = 'Enable WebGL';
		} else {
			wade.setLayerRenderMode(defaultLayerId, 'webgl');
			toggleRendererBtn.removeClass('fa-toggle-off');
			toggleRendererBtn.addClass('fa-toggle-on');
			toggleTitle.title = 'Disable WebGL';
		}

		
		// Set screen size to current size of viewport.
		wade.setMinScreenSize($(window).width(), $(window).height());
		wade.setMaxScreenSize($(window).width(), $(window).height());
		//console.log('Layer render mode: ' + wade.getLayerRenderMode(defaultLayerId) + '\nforce2d: ' + force2d + '\nScreen size set to: ' + $(window).width() + 'x' + $(window).height());

		var defaultRenderer = wade.getLayerRenderMode(defaultLayerId);
		
		// Load highscore.
		var shooterData = wade.retrieveLocalObject('shooterData');
		var oldHighScore = (shooterData && shooterData.oldHighScore) || 0;
		var newHighScore = (shooterData && shooterData.newHighScore) || 0;
		var gameObj = document.getElementById('game');
		var gameBtnObj = document.getElementById('game-icons');
		var highScore = oldHighScore;
		
		
		// Check for highscore cookie.
		var cookieHighscoreName = 'overkill_highscore';
		var cookieHighscore = getCookie(cookieHighscoreName);
		
		if (typeof(cookieHighscore) != 'undefined' && cookieHighscore != null) {
			if (cookieHighscore > oldHighScore) {
				oldHighScore = cookieHighscore;
			}
		}

		if (newHighScore > oldHighScore) {
			highScore = newHighScore;
		}
		
		
		/**
		 * Main screen text.
		 */
		var menuTexts = {
				insertCoin  : '- INSERT COIN -',
				highscoreIs : 'HIGHSCORE IS %i POINTS',
				youScored   : 'YOU %s %i POINTS'
		}
		
		// Ugly workaround for cut-off texts when using WebGL.
		if (defaultRenderer == 'webgl') {
			menuTexts = padStrings(menuTexts);
		}
		
		// Prepare text sprites of main screen.
		var clickText = new TextSprite(menuTexts.insertCoin, '36pt Highspeed', 'white', 'center');
		clickText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, clickText.draw));
		var clickToStart = new SceneObject();
		
		clickToStart.addSprite(clickText, { y: 320 });
		
		if (score > 0) {
			var scoreVerb = 'SCORED';
			if (cheat) {
				scoreVerb = 'CHEATED';
			}
			
			var scoreMsg = menuTexts.youScored.replace('%s', scoreVerb);
			scoreMsg = scoreMsg.replace('%i', score);
			if (defaultRenderer == 'webgl') {
				scoreMsg = padStrings(scoreMsg);
			}

			clickToStart.addSprite(new TextSprite(scoreMsg, '24pt Highspeed', 'white', 'center'), { y: 120 });

			if (newHighScore > oldHighScore) {
				var highscoreMessage = 'NEW HIGHSCORE';
				
				if (cheat) {
					highscoreMessage += ' NOT SAVED';
				}
				
				highscoreMessage += '!';
				
				// Again that ugly thing.
				if (defaultRenderer == 'webgl') {
					highscoreMessage = padStrings(highscoreMessage);
				}
				var newHighscoreText = new TextSprite(highscoreMessage, '24pt Highspeed', 'yellow', 'center');
				//newHighscoreText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, newHighscoreText.draw));
				clickToStart.addSprite(newHighscoreText, { y: 160 });
			}
		}
		
		if (score <= 0 || oldHighScore >= newHighScore) {
			menuTexts.highscoreIs = menuTexts.highscoreIs.replace('%i', highScore);
			clickToStart.addSprite(new TextSprite(menuTexts.highscoreIs, '24pt Highspeed', 'yellow', 'center'), { y: 160 });
		}

		// Store highscore only if player didn't cheat. 
		if(!cheat) {
			// Update highscore cookie.
			setCookie(cookieHighscoreName, highScore, 365);
	
			// Update local store with highscore.
			shooterData = { oldHighScore: highScore, newHighScore: newHighScore };
			wade.storeLocalObject('shooterData', shooterData);
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
		game.style.cursor = 'default';
		
		// Show main menu.
		wade.addSceneObject(clickToStart);
		
		nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
		
		/**
		 * Start game on left mouse click.
		 */
		wade.app.onMouseDown = function() {
			if (wade.isMouseDown('0')) {
				// Hide close button and cursor while playing.
				gameBtnObj.style.display = 'none';
				game.style.cursor = 'none';

				clearTimeout(nextAsteroid);
				wade.removeSceneObject(clickToStart);
				wade.clearScene();
				wade.app.startGame();
				wade.app.onMouseDown = 0;
			}
		};
	};

	
	/**
	 * Start game function.
	 */
	this.startGame = function() {
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

			// Check mouse-buttons (e.g. 0 = left, 1 = middle, 2 = right)
		
			// Turbo fire!
			if (wade.isMouseDown('2') && cheat) {
				fireRateTemp = 50;
			}

			var nextFireTime = lastFireTime + 1 / fireRateTemp;
			var time = wade.getAppTime();
			
			if ((wade.isMouseDown('0') || wade.isMouseDown('2')) && time >= nextFireTime) {
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
				if (score > 0 && !cheat && fireRateTemp < 60) {
					score -= 10;
				}
				
				if (score < 0 || score == 'NaN') {
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

			// Increase level and health every 1000 points.
			if (Math.floor(score / 1000) > level && level < 5) {
				level += 1;
				if (!cheat) {
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
			scoreCounter.getSprite().setText(Math.floor(score));
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

					if (typeof(overlapping[i]) != 'undefined') {
						// ... check if the overlapping object is either an enemy or an enemy's bullet.
						if (overlapping[i].isEnemy || overlapping[i].isEnemyBullet) {
							
							// Comparing per-pixel is quite slow, but the only easy way to check for collisions while discarding transparent pixels.
							if (typeof(overlapping[i]) != 'undefined' && ship.overlapsObject(overlapping[i], 'pixel')) {
								// Decrease health of overlapping object by a 10th of the default fire damage.
								if (overlapping[i].health > 0) {
									overlapping[i].health -= Math.floor(fireDamage / 10);
								}
								
								// Remove enemy's bullet and/or ship if it hit the player's ship.
								if (typeof(overlapping[i]) != 'undefined' && (overlapping[i].isEnemyBullet || overlapping[i].health <= 0)) {
									wade.removeSceneObject(overlapping[i]);
									wade.removeObjectFromArrayByIndex(i, overlapping);
								}
								
								if (typeof(overlapping[i]) != 'undefined') {
									enemyDamage = overlapping[i].damage || enemyDamage;
								}

								//console.log(enemyDamage);
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
				
				if (playerHealth < 0 || playerHealth == 'NaN') {
					playerHealth = 0;
				}
				healthCounter.getSprite().setText(playerHealth);
				
				// Check health.
				if (playerHealth <= 0) {
					// Create another explosion and play explode sound if player's health is zero or less.
					wade.app.explosion(ship.getPosition(), 2);
					wade.playAudio(sounds.explode, false);
					
					wade.removeSceneObject(ship);
					wade.setMainLoop(null, 'fire');
					wade.setMainLoop(null, 'die');

					// Check high score
					var shooterData = wade.retrieveLocalObject('shooterData');
					var highScore = (shooterData && shooterData.oldHighScore) || 0;
					
					if (score > highScore) {
						shooterData = { oldHighScore: highScore, newHighScore: score };
						wade.storeLocalObject('shooterData', shooterData);
					}
	
					// Wait for the animation to finish ...
					var gameOver = setTimeout(function() {
						gameStarted = false;
						clearTimeout(nextEnemy);
						clearTimeout(nextAsteroid);
						// ... clear scene and initialize app on death.
						wade.clearScene();
						wade.app.init();
					}, 250);
				}
			}
		}, 'die');
		
		
		if (!gameStarted) {
			// Initialize game values
			if (cheat) {
				playerHealth = 999;
			} else {
				playerHealth = 100;
			}
			
			score = 0;
			level = 1;
			gameStarted = true;
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
	 * Check for focus loss (e.g. ich the user tabs/clicks away).
	 */
	$(window).blur(function() {
		if (gameStarted && !gamePaused) {
			console.log('Game paused due to focus loss.');
			gamePaused = true;
			wade.pauseSimulation();
			clearTimeout(nextEnemy);
			clearTimeout(nextAsteroid);
			wade.app.onMouseMove = null;
			wade.addSceneObject(pauseSpriteObj);
			game.style.cursor = 'default';
		} else {
			// Don't spawn asteroids on main screen if window has no focus.
			if (!gameStarted) {
				console.log('Asteroid timeout cleared due to focus loss.');
				clearTimeout(nextAsteroid);
			}
		}
		
		return false;
	});
	
	/**
	 * Spawn asteroid sprites on the main screen if the game is not yet started, but its window has focus.
	 */
	$(window).focus(function() {
		if (!gameStarted) {
			nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
		}
	});

	
	/**
	 * Check if space key has been pressed. Toggles game to pause/resume.
	 */
	this.onKeyDown = function(eventData) {
		// Check for space key 
		if (gameStarted && eventData.keyCode == 32) {
			gamePaused = !gamePaused;

			if (gamePaused) {
				//console.log('Game paused by user.');
				wade.pauseSimulation();
				clearTimeout(nextEnemy);
				clearTimeout(nextAsteroid);
				wade.app.onMouseMove = null;
				wade.addSceneObject(pauseSpriteObj);
				game.style.cursor = 'default';
			} else {
				//console.log('Game resumed by user.');
				game.style.cursor = 'none';
				nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
				nextAsteroid = setTimeout(wade.app.spawnAsteroid, asteroidDelay);
				wade.removeSceneObject(pauseSpriteObj);
				wade.resumeSimulation();
				wade.app.onMouseMove = function(eventData) {
					ship && ship.setPosition(eventData.screenPosition.x, eventData.screenPosition.y);
				};
			}
		}

		return false;
	};
	
	
	/**
	 * Move ship according to mouse move.
	 */
	this.onMouseMove = function(eventData) {
		ship && ship.setPosition(eventData.screenPosition.x, eventData.screenPosition.y);
	};

	
	/**
	 * Draw explosion.
	 */
	this.explosion = function(position, i) {
		// Fallback
		if (typeof(i) == 'undefined' || i == null || typeof(images.boom[i]) == 'undefined') {
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
	};
	
	
	/**
	 * Spawn asteroid.
	 */
	this.spawnAsteroid = function() {
		// Create an empty sprite.
		var sprite;
		
		// Select random image of asteroid as sprite.
		var asteroidId = getRandomInt(0, 9);
		sprite = new Sprite(images.asteroids[asteroidId]);
		
		// Calculate start and end coordinates.
		var startX = (Math.random() - 0.5) * wade.getScreenWidth();
		var endX = (Math.random() - 0.5) * wade.getScreenWidth();
		var startY = -wade.getScreenHeight() / 2 - sprite.getSize().y / 2;
		var endY = -startY;

		// Add the object to the scene and make it move.
		var asteroid = new SceneObject(sprite, 0, startX, startY);
		wade.addSceneObject(asteroid);
		asteroid.moveTo(endX, endY, 200);
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
		
		//console.log('enemies: ' + enemyCount);
		//console.log('level: ' + level);

		if (maxEnemy > enemyCount) {
			maxEnemy = enemyCount;
		}
		
		// Select random image of enemy as sprite.
		var enemyId = getRandomInt(0, maxEnemy);
		sprite = new Sprite(images.enemies[enemyId]);

		// Calculate start and end coordinates.
		var startX = (Math.random() - 0.5) * wade.getScreenWidth();
		var endX = (Math.random() - 0.5) * wade.getScreenWidth();
		var startY = -wade.getScreenHeight() / 2 - sprite.getSize().y / 2;
		var endY = -startY;

		// Add the object to the scene and make it move.
		var enemy = new SceneObject(sprite, 0, startX, startY);
		wade.addSceneObject(enemy);
		enemy.moveTo(endX, endY, 200);
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
		var shooterData = { force2d: force2d };
		wade.storeLocalObject('force2d', shooterData);
		setCookie('force2d', force2d, 365);

		// Reset game state to activate new settings.
		clearTimeout(nextEnemy);
		clearTimeout(nextAsteroid);
		wade.setMainLoop(null, 'fire');
		wade.setMainLoop(null, 'die');
		gameStarted = false;
		wade.clearScene();
		wade.app.init();
	};
};


/**
 * Return random integer between min and max values.
 *
 * @return random integer
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Surround strings or objects which contain strings with padding.
 * 
 * @param obj
 * @returns entity of input type
 */
function padStrings(obj) {
	var padding = '       ';
	if (typeof(obj) == 'object') {
		var tmp = {};
		for (var i in obj) {
			tmp[i] = padding + obj[i] + padding;
		}
	} else {
		tmp = padding + obj + padding;
	}
	return tmp;
}