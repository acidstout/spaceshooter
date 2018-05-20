## Changes

**Version 1.1.4**
- fixed issue where highscore wasn't saved
- due to changes by Google in Chromium based browsers you may need to reload the page by hitting the F5 key in order to enable audio playback.

**Version 1.1.3**
- hopefully fixed blank screen issue (e.g. "Warning: it isn't possible to render this frame").
- re-arranged functions
- optimized load order of assets
- added loading status to console
- initialize asteroids on main screen only after assets are fully loaded
- roughly estimated which changes where made in which version of the game and re-arranged changelog

**Version 1.1.2**
- updated to WADE 3.8.1
- added highscore table (requires an SQL database; makes use of my ADOdb compatible PDO wrapper class)
- updated menu music
- updated audio handling
- updated scoring logic
- added counter showing remaining points until next level (energy refill)

**Version 1.1.1**
- animated ship when moving left/right
- fixed issue with background music being played twice
- fixed issue with level not being increased when reaching the first 1000 points
- fixed issue with fire rate and damage not being reset upon game over
- added screenshots
- code cleanup
- added .jshintrc
- fixed some annoyances in Microsoft Edge and Internet Explorer (e.g. music not playing, event handlers and toggling fullscreen not working)
- updated window title
- hid cheat-mode
- fixed issue with setting identifier being minified

**Version 1.1**
- by default try to use WebGL, but fallback to 2D canvas on failure
- added option to pause game (press space key to toggle)
- added check for focus loss (will pause the game automatically)
- added asteroids to the main screen
- updated logo and toggle icons
- added option to switch between WebGL and 2D canvas
- updated asteroids and enemies (images, health, strength, fire rate, ...)
- added background music and option to toggle it on/off
- increased brightness of toggle icons
- mobile device optimizations

**Version 1.0**
- added health indicator
- added cheat-mode
- added parallax starfield background
- added turbo fire (if cheat-mode is enabled)
- improved score indicator and logic
- added level indicator
- improved collision checks (per-pixel collision)
- minor performance improvements
- added multiple enemy types (e.g. alien ships and asteroids)
- added health to enemies and asteroids (e.g. destroy objects only if hit by multiple shots)
- added option to toggle fullscreen mode
- added logo
- save current highscore as cookie
- added sounds
- improved behaviour when getting hit
- fixed "unable to die" issue when cheating
- set space little darker
- updated top row icons and asteroids with higher quality images
- updated explosion and hit animations
- fixed explosion sound issue
- updated bullets

**Version 0.9**
- initial version
