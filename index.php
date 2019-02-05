<?php
/**
 * Space shooter
 * A WADE game engine based space shooter with parallax starfield background.
 *
 * @author nrekow
 * @copyright (C) 2019 Nils Rekow
 * @license GPL-3, http://www.gnu.org/licenses/
 */

include_once 'php/backend.php';

?><!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
		<meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
		<meta name="apple-mobile-web-app-capable" content="yes"/>
		<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
		<meta name="csrf-token" content="<?php echo $_SESSION['csrf_token'];?>">
		<link rel="stylesheet" type="text/css" href="css/style.min.css"/>
		<link rel="icon" type="image/png" href="img/ship.png"/>
		<script src="js/vendor/jquery.min.js"></script>
		<script src="js/vendor/starscroll.min.js"></script>
		<script src="js/vendor/base64.min.js"></script>
		<script src="js/vendor/wade.min.js"></script>
		<script src="js/init.min.js"></script>
		<title>Overkill - In space no one hears you cry</title>
	</head>
	<body>
		<div id="starfield"></div>
		<div id="game"></div>
		<div id="highscoreWrapper">
			<div id="highscore">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Score</th>
						</tr>
						<tr>
							<th colspan="2"><hr/></th>
						</tr>
					</thead>
					<tbody id="highscoreTable">
						<tr>
							<td colspan="2" class="img"><img src="img/loading.svg" alt=""/></td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div id="game-icons" class="game-icons">
			<div class="game-icon" id="goBack" title="Go back"><a href="https://rekow.ch"><span class="fa fa-times"></span></a></div>
			<div class="game-icon" id="toggleFullscreen" title="Toggle fullscreen"><span class="fa fa-window-restore"></span></div>
			<div class="game-icon" id="toggleRendererTitle" title="Enable WebGL"><span id="toggleRendererBtn" class="fa fa-toggle-off"></span></div>
			<div class="game-icon" id="toggleMusicTitle" title="Enable music"><span id="toggleMusicBtn" class="fa fa-music music-off"></span></div>
			<div class="game-icon" id="toggleHighscoreTitle" title="Toggle highscore table"><span id="toggleHighscoreBtn" class="fa fa-trophy"></span></div>
			<div id="version"></div>
		</div>
	</body>
</html>