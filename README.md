# Overkill - A retro space shooter
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8b1a2f944dd4497ea10e6400d1b1cc67)](https://www.codacy.com/app/TeamDJS/spaceshooter)

A simple space shooter based on the WADE game engine. Separated in five tiers with increasing difficulty and different enemies. Your energy is reset after each tier, so when reaching the last tier try to stay alive as long as possible, because your energy won't be reset. The huge spacestation in tier five is very strong. Also try to avoid flying into asteroids. They cause huge damage.

## Screenshot
![title screen](screenshots/preview.png)

## Features
- Beautiful, animated retro graphics
- Parallax starfield background
- Multiple enemy types with different strength and fire rate
- Basic health, score and level logic
- Per-pixel collision logic

## Usage
Use your mouse to move the spaceship around and click to fire. Every 1000 points your health and level is increased. Required hit points vary from enemy to enemy. Also larger asteroids must be shot multiple times before they are destroyed. In general the more shots required, the higher will be the reward.

## Compatibility
The game will run flawlessly in any modern browser. Even older browsers should work pretty well, if they support the 2d canvas feature. No WebGL support required, but supported and used by default. Audio (in-game sounds and music) is supported by all modern browsers, but the Internet Explorer stops the background music upon page reload. However, you may turn it on manually by clicking the respective button in the top right.

## Demo
Play the latest version of the game on https://rekow.ch/overkill/ for free.