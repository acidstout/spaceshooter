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
	var ship;										// the player ship

	var lastFireTime   = 0;							// the last time the player fired a bullet
	var fireRate       = 4;							// how many bullets per second to fire
	var fireRateTemp   = 4;							// temporary fire rate (e.g. overrides default fire rate if cheat-mode is enabled)
	var fireDamage     = 200;						// how much damage is caused by one shot of the player's ship
	
	var enemyHealth    = [ 400, 800, 1200, 1600 ];	// enemy's health
	var enemyDelay     = 2000;						// how long to wait from spawning one enemy to spawning the next one
	var nextEnemy;									// the process that will spawn the next enemy

	var asteroidHealth = [ 200, 200, 200, 300, 400, 400, 600, 500, 400, 600 ];	// asteroid's health
	var asteroidDelay  = 1000;						// how long to wait from spawning one asteroid to spawning the next one
	var nextAsteroid;								// the process that will spawn the next asteroid
	
	var activeBullets  = [];						// a list of bullets we've fired and are still active
	
	var scoreCounter;								// an object to display the score
	var score          = 0;							// the current score
	
	var healthCounter;								// object to display the health
	var playerHealth   = 100;						// initial health
	
	var levelCounter;								// object to display the level
	var level          = 1;							// initial level
	
	var images = {
		logo		: '../img/logo.png',
		ship        : '../img/ship.png',
		boom        : '../img/animations/boom.png',
		bullet      : '../img/bullets/bullet0.png',
		enemyBullet : '../img/bullets/bullet1.png',
		
		enemies     : {
			0       : '../img/enemies/enemy0.png',
			1       : '../img/enemies/enemy1.png',
			2       : '../img/enemies/enemy2.png',
			3       : '../img/enemies/enemy3.png',
		},
		
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
			9       : '../img/asteroids/asteroid9.png',
		},
		
		healthIcon  : '../img/icons/heart.png',
		levelIcon   : '../img/icons/star.png',
		scoreIcon   : '../img/icons/trophy.png'
	}
	
	var sounds = {
		shoot       : '../sounds/shoot.mp3',
		hit         : '../sounds/hit.mp3',
		explode     : '../sounds/explode.mp3'
	}
	
	
	/**
	 * Load images and sounds.
	 */
	this.load = function() {
		// Images
		wade.loadImage(images.logo);
		wade.loadImage(images.ship);
		wade.loadImage(images.bullet);
		wade.loadImage(images.enemyBullet);
		wade.loadImage(images.boom);

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
		
		// Main menu text.
		var clickText = new TextSprite('Insert coin', '36pt Highspeed', 'white', 'center');
		clickText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, clickText.draw));
		var clickToStart = new SceneObject();
		
		clickToStart.addSprite(clickText, { y: 320 });
		
		if (score > 0) {
			var scoreVerb = 'scored';
			if (cheat) {
				scoreVerb = 'cheated';
			}

			clickToStart.addSprite(new TextSprite('You ' + scoreVerb + ' ' + score + ' points', '24pt Highspeed', 'white', 'center'), { y: 120 });

			if (newHighScore > oldHighScore) {
				var highscoreMessage = 'New Highscore';
				
				if (cheat) {
					highscoreMessage += ' not saved';
				}
				
				highscoreMessage += '!';
				
				var newHighscoreText = new TextSprite(highscoreMessage, '24pt Highspeed', 'yellow', 'center');
				//newHighscoreText.setDrawFunction(wade.drawFunctions.blink_(0.5, 0.5, newHighscoreText.draw));
				clickToStart.addSprite(newHighscoreText, { y: 160 });
			}
		}
		
		if (score <= 0 || oldHighScore >= newHighScore) {
			clickToStart.addSprite(new TextSprite('Highscore is ' + highScore + ' points', '24pt Highspeed', 'yellow', 'center'), { y: 160 });
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

		// Show close button and default cursor while not playing.
		gameBtnObj.style.display = 'block';
		game.style.cursor = 'default';

		wade.addSceneObject(clickToStart);
		
		
		/**
		 * Start game on mouse click.
		 */
		wade.app.onMouseDown = function() {
			wade.removeSceneObject(clickToStart);
			wade.app.startGame();
			wade.app.onMouseDown = 0;

			// Hide close button and cursor while playing.
			gameBtnObj.style.display = 'none';
			game.style.cursor = 'none';
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
			
			// Normal fire.
			/*
			if (wade.isMouseDown('0')) {
				console.log('left');
			}
			
			// Unused.
			if (wade.isMouseDown('1')) {
				console.log('middle');
			}
			*/
			
			// Turbo fire!
			if (wade.isMouseDown('2') && cheat) {
				//console.log('right');
				fireRateTemp = 50;
			}

			var nextFireTime = lastFireTime + 1 / fireRateTemp;
			var time = wade.getAppTime();
			
			if (wade.isMouseDown() && time >= nextFireTime) {
				lastFireTime = time;
				var shipPosition = ship.getPosition();
				var shipSize = ship.getSprite().getSize();
				var sprite = new Sprite(images.bullet);
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
				
				if (score < 0) {
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
								wade.app.explosion(position);
								wade.playAudio(sounds.hit, false);

								// Decrease health of collider (e.g. enemy, , ...).
								if (colliders[j].health > 0) {
									colliders[j].health -= fireDamage;
								}
								
								// Check enemy's health again.
								if (colliders[j].health <= 0) {
									// Create another explosion and play explode sound.
									wade.app.explosion(position);
									wade.playAudio(sounds.explode, false);
									
									// Delete collider (enemy/asteroid).
									wade.removeSceneObject(colliders[j]);

									// Increase score if enemy/asteroid shot down by a 10th of its initial health.
									score += Math.floor(colliders[j].initialHealth / 10);
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
			if (Math.floor(score / 1000) > level) {
				level += 1;
				playerHealth += 10;

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
			
			// If the list is not empty ...
			if (overlapping.length > 0) {
				
				for (var i = 0; i < overlapping.length; i++) {

					// ... check if the overlapping object is either an enemy or an enemy's bullet.
					if (overlapping[i].isEnemy || overlapping[i].isEnemyBullet) {
						
						// Comparing per-pixel is quite slow, but the only easy way to check for collisions while discarding transparent pixels.
						if (ship.overlapsObject(overlapping[i], 'pixel')) {
							// Decrease health of overlapping object by a 10th of the default fire damage.
							if (overlapping[i].health > 0) {
								overlapping[i].health -= Math.floor(fireDamage / 10);
							}
							
							// Remove enemy's bullet if it hit the player's ship.
							if (overlapping[i].isEnemyBullet || overlapping[i].health <= 0) {
								wade.removeSceneObject(overlapping[i]);
								wade.removeObjectFromArrayByIndex(i, overlapping);
							}
							
							hit = true;
							break;
						}
					}
				}
			}
			
			if (hit) {
				hit = false;

				// Create explosion and play hit sound if player gets hit by a bullet.
				wade.app.explosion(ship.getPosition());
				wade.playAudio(sounds.hit, false);

				// Decrease health.
				playerHealth--;
				healthCounter.getSprite().setText(playerHealth);
				
				// Check health.
				if (playerHealth <= 0) {
					// Create another explosion and play explode sound if player's health is zero or less.
					wade.app.explosion(ship.getPosition());
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

					// Immediately clear scene and initialize app on death, because otherwise the app will freeze until all enemies and bullets are gone. :(
					wade.clearScene();
					wade.app.init();
					clearTimeout(nextEnemy);
					clearTimeout(nextAsteroid);
				}
			}
		}, 'die');

		
		// Initialize game values
		if (cheat) {
			playerHealth = 999;
		} else {
			playerHealth = 100;
		}
		
		score = 0;
		level = 1;

		
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
	 * Move ship according to mouse move.
	 */
	this.onMouseMove = function(eventData) {
		ship && ship.setPosition(eventData.screenPosition.x, eventData.screenPosition.y);
	};

	
	/**
	 * Draw explosion.
	 */
	this.explosion = function(position) {
		// Create an animation.
		var animation = new Animation(images.boom, 6, 4, 30);
		
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
		asteroid.health = asteroidHealth[asteroidId];
		asteroid.initialHealth = asteroidHealth[asteroidId];
		
		
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

		// Select random image of enemy as sprite.
		var enemyId = getRandomInt(0, 3); 
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
		enemy.health = enemyHealth[enemyId];
		enemy.initialHealth = enemyHealth[enemyId];

		
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
			var sprite = new Sprite(images.enemyBullet);
			var bullet = new SceneObject(sprite, 0, startX, startY);
			bullet.isEnemyBullet = true;
			wade.addSceneObject(bullet);
			bullet.moveTo(endX, endY, 200);

			// Delete bullet when it's finished moving.
			bullet.onMoveComplete = function() {
				wade.removeSceneObject(this);
			};

			// Schedule next bullet.
			this.schedule(600, 'fire'); // 1000
		};
		enemy.schedule(300, 'fire'); // 500
		
		// Spawn another enemy.
		nextEnemy = setTimeout(wade.app.spawnEnemy, enemyDelay);
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