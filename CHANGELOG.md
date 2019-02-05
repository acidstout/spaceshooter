## Changes

**Version 1.2**
- added Block Bad Queries (BBQ) script by Jeff Starr
- added CSRF token to secure AJAX requests.
- added licenses of used vendor parts.
- fixed potential undefined index error in BBQ.
- put the whole application under the GPL-3 license. 

**Version 1.1.9**
- fixed counter of no-target addon getting values lower than 0.
- fixed distorted audio of power-ups. Cause was the default system ACM being unable to process the audio properly while the LAV decoder works fine.
- added bonus points being added to score upon player's death.
- added different formats of game font (e.g. EOT, WOFF2 and SVG).  
- updated calculation of score needed to advance to next level.
- updated tier 5 to survival-of-the-fittest mode (e.g. the "LEFT: 1234567890" score display shows "OVERKILL!" and only huge motherships and lots of asteroids are spawned).
- improved handling of variables (e.g. properly reset variables to their initial values).
- improved backward-compatibility.
- checked compatibility with Web Audio autoplay policy again due to Google doing Google things. For details see [here](https://goo.gl/7K7WLu). *sigh*

**Version 1.1.8**
- fixed endless spawning of asteroids if the game is paused or focus is lost. Hopefully it doesn't break again.
- fixed status display of power-ups so it doesn't overlap anymore
- fixed timing and interval issues
- added loading icon when showing highscore table
- added sounds for spawning and collecting power-ups

**Version 1.1.7**
- added five power-ups, each comes in three sizes
- added status display for power-ups
- updated to WADE 4.0.1
- still investigating on that endless spawning of asteroids. Thought I already fixed that.

**Version 1.1.6**
- fixed issue where tier 2 could not be completed
- added type safety
- removed else-clauses
- removed static references in PDO wrapper class

**Version 1.1.5**
- improved score calculation and difficulty

**Version 1.1.4**
- fixed endless spawning of asteroids on main screen when the browser is minimized or has no focus for some time.
- fixed player name no being added to JSON.
- fixed sound issues by resuming AudioContext object on click if is has been paused by the browser when the game is loaded. For details see [here](https://goo.gl/7K7WLu).
- updated to WADE 4.0

**Version 1.1.3**
- fixed blank screen issue (e.g. "Warning: it isn't possible to render this frame").
- added loading status to console
- updated initialization of asteroids on main screen to trigger only after assets are fully loaded
- improved load order of assets
- improved order of functions
- roughly estimated which changes where made in which version of the game and re-arranged changelog

**Version 1.1.2**
- added counter showing remaining points until next level (energy refill)
- added highscore table (requires an SQL database; makes use of my ADOdb compatible PDO wrapper class)
- updated audio handling
- updated menu music
- updated scoring logic
- updated to WADE 3.8.1

**Version 1.1.1**
- fixed issue with background music being played twice
- fixed issue with fire rate and damage not being reset upon game over
- fixed issue with level not being increased when reaching the first 1000 points
- fixed issue with setting identifier being minified
- fixed some annoyances in Microsoft Edge and Internet Explorer (e.g. music not playing, event handlers and toggling fullscreen not working)
- added .jshintrc
- added screenshots
- added ship animation when moving left/right
- updated window title
- code cleanup
- hid cheat-mode

**Version 1.1**
- added asteroids to the main screen
- added background music and option to toggle it on/off
- added check for focus loss (will pause the game automatically)
- added option to pause game (press space key to toggle)
- added option to switch between WebGL and 2D canvas
- updated asteroids and enemies (images, health, strength, fire rate, ...)
- updated default rendering to use WebGL, but fallback to 2D canvas on failure
- updated logo and toggle icons
- improved brightness of toggle icons
- improved mobile device compatibility

**Version 1.0**
- fixed "unable to die" issue when cheating
- added cheat-mode
- fixed explosion sound issue
- added health indicator
- added health to enemies and asteroids (e.g. destroy objects only if hit by multiple shots)
- added level indicator
- added logo
- added multiple enemy types (e.g. alien ships and asteroids)
- added option to toggle fullscreen mode
- added parallax starfield background
- added saving of current highscore as cookie
- added sounds
- added turbo fire (if cheat-mode is enabled)
- updated bullets
- updated explosion and hit animations
- updated top row icons and asteroids with higher quality images
- improved behaviour when getting hit
- improved collision checks (per-pixel collision)
- improved darkness of space
- improved performance
- improved score indicator and logic

**Version 0.9**
- initial version
