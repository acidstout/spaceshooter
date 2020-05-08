<?php
/**
 * Space shooter
 * A WADE game engine based space shooter with parallax starfield background.
 *
 * @author nrekow
 * @copyright (C) 2019 Nils Rekow
 * @license GPL-3, http://www.gnu.org/licenses/
 */


/**
 * Tries to establish a database connection
 * 
 * @return PDO\Wrapper|false
 */
function connectToDatabase() {
	// Init $conn as empty array to avoid warnings in Eclipse. Gets filled in connect.php if that file exists.
	$conn = array();

	if (!file_exists('connect.php')) {
		if (!file_exists('connect.sample.php')) {
			return false;
		}
		
		// Fallback to sample database connection script. Used for development purposes.
		include_once 'connect.sample.php';
	} else {
		include_once 'connect.php';
	}
	
	include_once 'classes/pdowrapper.php';
	
	if (isset($conn['host']) && !empty($conn['host'])
			&& isset($conn['base']) && !empty($conn['base'])
			&& isset($conn['user'])
			&& isset($conn['pass'])
	) {
		// Create new wrapper object.
		$wrapper = new PDO\Wrapper($conn['host'], $conn['base'], $conn['user'], $conn['pass']);

		// Do not keep database credentials in memory.
		$conn = null;
		unset($conn);
		
		// Return wrapper object.
		return $wrapper;
	}
	
	return false;
}


/**
 * Truncate a string at a given length.
 * 
 * @param string $str
 * @param integer $length
 * @return string
 */
function truncate($str, $length) {
	if (strlen($str) > $length) {
		$str = substr($str, 0, $length) . '...';
	}
	
	return $str;
}


/**
 * Write formatted message to log
 * 
 * @param mixed $msg
 * @return void
 */
function log_msg($msg, $result = null) {
	error_log(print_r($msg, true), 0);
	if (!is_null($result)) {
		echo $result;
	}
}


/**
 * Get highest score from highscore table
 * 
 * @param object $db
 * @return integer
 */
function getHighestScore($db) {
	$sql = "SELECT score
			FROM highscores
			ORDER BY score DESC
			LIMIT 1;";
	if ($db->query($sql)) {
		return $db->getOne();
	}
	
	$msg = $db->ErrorMsg() . "\n" . $sql;
	log_msg($msg);

	return 'FAILED';
}


/**
 * Load scores from highscore table
 * 
 * @param object $db
 * @return string|false
 */
function loadScore($db) {
	$sql = "SELECT player, score
			FROM highscores
			ORDER BY score DESC, player ASC
			LIMIT 10;";
	
	if ($db->query($sql)) {
		$results = $db->getAll();
		$tmp = array();

		// Virtually fill empty positions. 
		$count = count($results);
		while ($count < 10) {
			$results[] = array('player' => 'player', 'score' => 0);
			$count++;
		}
		
		foreach ($results as $result) {
			$tmp[] = array(
				'player' => truncate($result['player'], 20),
				'score' => $result['score']
			);
		}

		return $tmp;
		/*
		$results = json_encode($tmp, JSON_UNESCAPED_UNICODE | JSON_FORCE_OBJECT);
		unset($tmp);
		
		return $results;
		*/
	}
	
	$msg = $db->ErrorMsg() . "\n" . $sql;
	log_msg($msg);
	
	return 'FAILED';
}


/**
 * Check if a given score qualifies for being entered into the highscore table.
 * 
 * @param object $db
 * @param int $score
 * @return boolean
 */
function isHighscore($db, $score) {
	$score = preg_replace('/\D/', '', $score);
	
	// This is a workaround to fetch the total row count if a limit is used.
	// By default COUNT(*) is faster than COUNT(id).
	$sql = "SELECT score, c.found_rows
			FROM overkill.highscores
			JOIN (SELECT COUNT(*) AS found_rows FROM overkill.highscores) AS c
			ORDER BY score ASC
			LIMIT 1;";
	
	if ($db->query($sql)) {
		$results = $db->getAll();
		
		if (isset($results[0]) && isset($results[0]['score']) && isset($results[0]['found_rows']) && $score > $results[0]['score'] || $results[0]['found_rows'] < 10) {
			return true;
		}
	}
	
	return false;
}


/**
 * Save score to highscore table
 * 
 * @param object $db
 * @param int $score
 * @return string
 */
function saveScore($db, $player, $score) {
	// Sanitize input
	$player = preg_replace('/[^a-zA-Z0-9\s]/', '', $player);
	$player = truncate($player, 20);
	$score  = preg_replace('/\D/', '', $score);
	
	// Make sure we don't exceed the limit. Requires PHP's GMP extension to be loaded.
	//
	// Since PHP uses signed integers and SQL uses unsigned integers, we use PHP_INT_MAX
	// as limit (e.g. limit of BIGINT = PHP_INT_MAX * 2). However, in normal situations
	// this case should never happen, but we need to take care of it anyway.
	//
	if (extension_loaded('gmp')) {
		if (gmp_cmp(gmp_abs($score), PHP_INT_MAX) === 1) {
			$score = PHP_INT_MAX;
		}
	}
	
	if (isHighscore($db, $score)) {
		$sql = "INSERT INTO highscores (player, score) VALUES (?, ?);";
		$values = array($player, $score);
		
		if ($db->Execute($sql, $values)) {
			return 'OK';
		}
		
		$msg = $db->ErrorMsg() . "\n" . $sql . "\nValue: " . print_r($values, true);
		log_msg($msg);
	}
	
	return 'FAILED';
}


/**
 * Evaluate POST requests
 * 
 * @return string
 */
function evaluatePost($post) {
	$db = connectToDatabase();
	if (!$db) {
		log_msg('Failed to connect to database.', 'FAILED');
		return false;
	}

	if (isset($post['log']) && !empty($post['log'])) {
		log_msg($post);
	}
	
	if (isset($post['data']) && !empty($post['data'])) {
		$json = base64_decode($post['data']);
		$data = json_decode($json);
		$result = '';
		
		if (isset($data->action)) {
			switch ($data->action) {
				case 'saveScore':
					if (isset($data->player) && !empty($data->player) && isset($data->score) && !empty($data->score)) {
						$result = saveScore($db, $data->player, $data->score);
					}
					break;
				case 'loadScore':
					$result = loadScore($db);
					break;
				case 'getHighestScore':
					$result = getHighestScore($db);
					break;
			}
		}
		
		$result = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
		if ($result !== false) {
			return $result;
		}
	}
	
	return 'FAILED';
}


if (!function_exists('apache_request_headers')) {
	/**
	 * Workaround to get request headers from nginx web-server.
	 * 
	 * @return array
	 */
	function apache_request_headers() {
		$headers = array();
		$regex_http = '/\AHTTP_/';
		$exceptions = array(
			'CONTENT_TYPE'   => 'Content-Type',
			'CONTENT_LENGTH' => 'Content-Length',
			'CONTENT_MD5'    => 'Content-Md5',
		);
		
		foreach ($_SERVER as $server_key => $server_val) {
			if (preg_match($regex_http, $server_key)) {
				$headers_key = preg_replace($regex_http, '', $server_key);
				$regex_matches = array();
				
				// Try to restore the original letter case.
				$regex_matches = explode('_', $headers_key);
				
				if (count($regex_matches) > 0 and strlen($headers_key) > 2) {
					foreach($regex_matches as $regex_key => $regex_val) {
						// Special case for DNT header.
						if (strtolower($regex_key) === 'dnt') {
							$regex_matches[$regex_key] = $regex_val;
						} else {
							$regex_matches[$regex_key] = ucfirst(strtolower($regex_val));
						}
					}
					
					$headers_key = implode('-', $regex_matches);
				}
				
				$headers[$headers_key] = $server_val;
			} else if (isset($exceptions[$server_key])) {
				$headers[$exceptions[$server_key]] = $server_val;
			}
		}
		
		if (!isset($headers['Authorization'])) {
			if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
				$headers['Authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
			} elseif (isset($_SERVER['PHP_AUTH_USER'])) {
				$basic_pass = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
				$headers['Authorization'] = 'Basic ' . base64_encode($_SERVER['PHP_AUTH_USER'] . ':' . $basic_pass);
			} elseif (isset($_SERVER['PHP_AUTH_DIGEST'])) {
				$headers['Authorization'] = $_SERVER['PHP_AUTH_DIGEST'];
			}
		}
		
		return $headers;
	}
}


/**
 * Init
 */
// Validate request.
if (file_exists('bbq.php')) {
	include_once 'bbq.php';
	bbq_core();
}

// Start session and set CSRF token if not already done.
session_start();
if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

if (isset($_POST) && count($_POST) > 0) {
	// Check headers for valid CSRF token.
	$headers = apache_request_headers();
	if ( !isset($headers['Csrf-Token']) || $headers['Csrf-Token'] !== $_SESSION['csrf_token'] ) {
		// Wrong or missing CSRF token.
		header('HTTP/1.1 403 Forbidden');
		header('Status: 403 Forbidden');
		header('Connection: Close');
		die();
	}
	
	// Evaluate our POST request.
	echo evaluatePost($_POST);
	die();
}
