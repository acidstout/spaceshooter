<?php

/**
 * Tries to establish a database connection
 * 
 * @return PDO\Wrapper|false
 */
function connectToDatabase() {
	if (!file_exists('connect.php')) {
		return false;
	}
	
	include_once 'connect.php';
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

	return false;
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
		
		$results = json_encode($tmp, JSON_UNESCAPED_UNICODE);
		unset($tmp);
		
		return $results;
	}
	
	$msg = $db->ErrorMsg() . "\n" . $sql;
	log_msg($msg);
	
	return false;
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
	$player = preg_replace('/[^a-zA-Z0-9\s]/', '', $player);
	$player = truncate($player, 20);
	$score  = preg_replace('/\D/', '', $score);
	
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
 * @return string|boolean
 */
function evaluatePost($post) {
	$db = connectToDatabase();
	if (!$db) {
		log_msg('Failed to connect to database.', 'FAILED');
		return false;
	}
	
	if (isset($post['data']) && !empty($post['data'])) {
		$json = base64_decode($post['data']);
		$data = json_decode($json);
		
		if (isset($data->action)) {
			switch ($data->action) {
				case 'saveScore':
					if (isset($data->player) && !empty($data->player) && isset($data->score) && !empty($data->score)) {
						echo saveScore($db, $data->player, $data->score);
					}
					break;
				case 'loadScore':
					echo loadScore($db);
					break;
				case 'getHighestScore':
					echo getHighestScore($db);
					break;
			}
		}
	}
	
	if (isset($post['log']) && !empty($post['log'])) {
		log_msg($_REQUEST);
	}
}

/**
 * Init
 */
if (isset($_POST) && count($_POST) > 0) {
	evaluatePost($_POST);
}

die();
