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
		$result = $db->getOne();
	} else {
		$msg = $db->ErrorMsg() . "\n" . $sql;
		log_msg($msg);
	}
	
	//error_log(print_r($result,true));
	
	return $result;
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
	
	$results = false;
	
	if ($db->query($sql)) {
		$results = $db->getAll();
		$tmp = array();

		foreach ($results as $result) {
			$tmp[] = array('player' => truncate($result['player'], 16), 'score' => $result['score']);
		}
		
		$results = json_encode($tmp, JSON_UNESCAPED_UNICODE);
		unset($tmp);
	} else {
		$msg = $db->ErrorMsg() . "\n" . $sql;
		log_msg($msg);
	}
	
	return $results;
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
	$score = preg_replace('/\D/', '', $score);
	$result = 'FAILED';
	$min_score = 0;
	
	$sql = "SELECT MIN(score) AS min_score FROM highscores LIMIT 1;";
	if ($db->query($sql)) {
		$min_score = $db->getOne();
	}
	
	if ($score > $min_score) {
		$sql = "INSERT INTO highscores (player, score) VALUES (?, ?);";
		$values = array($player, $score);
		
		if (!$db->Execute($sql, $values)) {
			$msg = $db->ErrorMsg() . "\n" . $sql . "\nValue: " . print_r($values, true);
			log_msg($msg);
		} else {
			$result = 'OK';
		}
	}
	
	return $result;
}


/**
 * Evaluate POST requests
 * 
 * @return string|boolean
 */
function evaluatePost() {
	$db = connectToDatabase();
	if (!$db) {
		log_msg('Failed to connect to database.', 'FAILED');
		return false;
	}
	
	if (isset($_POST['data']) && !empty($_POST['data'])) {
		$json = base64_decode($_POST['data']);
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
	
	if (isset($_POST['log']) && !empty($_POST['log'])) {
		log_msg($_REQUEST);
	}
}

/**
 * Init
 */
if (isset($_POST) && count($_POST) > 0) {
	evaluatePost();
	die();
}