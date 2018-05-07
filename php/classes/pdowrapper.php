<?php

/**
 * Simple PDO wrapper class which is compatible with basic ADOdb features.
 * 
 * The goal was to migrate web-applications from ADOdb to plain PDO,
 * when there's no need to have a fully featured database framework.
 * Especially if just a few basic features (CRUD) are used. In order
 * to switch from ADOdb to PDO you just need to replace the way how
 * you connect to the database (e.g. replace your ADOdb database
 * connection object with the Wrapper object) and it should work out
 * of the box.
 * 
 * Some features like setting ADOdb's fetch-mode are not implemented,
 * and for now it's not planned to change that. 
 * 
 * Usage:
 * 
 * 		Establish database connection:
 *			$db = new Database\Wrapper($host, $database, $username, $password);
 *		
 *		Fetch data from database:
 *			$sql = "SELECT * FROM users WHERE is_active = 1 ORDER BY surname ASC LIMIT 10;";
 *			$users = $db->getAll();
 *
 *		Iterate over the fetched result:
 *			foreach ($users as $user) {
 *				echo $user['surname'] . ', ' . $user['forename'];
 *			}
 *
 *		Insert data into database using prepared statements:
 *			$sql = "INSERT INTO users (surname, forename, is_active) VALUES (?, ?, 1);";
 *			$db->execute($sql, array('Smith', 'Alice'));
 *
 *		Update date in database using hardcoded values (e.g. don't use prepared statements):
 *			$sql = "UPDATE users SET is_active = 0 WHERE forename = 'Bob';";
 *			$db->execute($sql);
 *
 * 
 * @author nrekow
 *
 */

namespace PDO;

use PDO, PDOException, PDOStatement;


interface WrapperFunctions {
	public function ErrorMsg();
	public function execute($query, $data = null);
	public function update($query, $data);
	public function delete($query, $data);
	public function getOne($query = null, $data = null);
	public function getAll($query = null, $data = null);
	public function query($query, $data = null);
}


class Wrapper extends PDO implements WrapperFunctions {
	private $connection = null;
	private $database_error = null;
	private $query = null;
	private $stmt = null;
	
	
	/**
	 * Creates a wrapper object around the PDO class to provide basic ADOdb compatibility.
	 * 
	 * @param string $host
	 * @param string $database
	 * @param string $user
	 * @param string $pass
	 * @param string $driver
	 * @param string $charset
	 * @param array $opt
	 * 
	 * @return object|boolean
	 */
	public function __construct($host, $database, $user, $pass, $driver = 'mysql:', $charset = 'utf8mb4', $opt = [
			//PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8",
			PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
			PDO::ATTR_EMULATE_PREPARES   => false
	]) {
		$dsn = $driver . 'host=' . $host . ';dbname=' . $database . ';charset=' . $charset;
		
		try {
			$this->connection = new PDO($dsn, $user, $pass, $opt);
		} catch (PDOException $e) {
			$this->database_error = $e->getMessage();
			return false;
		}
	}
	
	
	/**
	 * Returns last database error
	 * 
	 * @return string
	 */
	public function ErrorMsg() {
		if (is_null($this->database_error)) {
			$this->database_error = PDO::errorInfo();
			
			if (empty($this->database_error)) {
				$this->database_error = PDOStatement::errorInfo();
			}
		}
		
		return $this->database_error;
	}
	
	
	/**
	 * Executes statement against database, returns last id on INSERT and row count on UPDATE or DELETE.
	 * 
	 * @param string $query
	 * @param array $data
	 * @return string|boolean
	 */
	public function execute($query, $data = null) {
		if (is_null($this->connection)) {
			$this->database_error = 'No database connection.';
			return false;
		}
		
		try {
			$this->stmt = $this->connection->prepare($query);
			$this->stmt->execute($data);
			
			if (strpos(strtoupper($query), 'INSERT') === 0) {
				return $this->connection->lastInsertId();
			}
			
			if (strpos(strtoupper($query), 'UPDATE') === 0 || strpos(strtoupper($query), 'DELETE') === 0) {
				return $this->stmt->rowCount();
			}
			
			if (strpos(strtoupper($query), 'SELECT') === 0) {
				return $this->stmt->fetchAll();
			}
		} catch (PDOException $e) {
			$this->database_error = $e->getMessage();
			return false;
		}
		
		return false;
	}
	
	
	/**
	 * Updates data in database.
	 * 
	 * @param string $query
	 * @param array $data
	 * @return number
	 */
	public function update($query, $data) {
		$stmt = $this->query($query, $data);
		return $stmt->rowCount();
	}
	
	
	/**
	 * Deletes data from database.
	 * 
	 * @param string $query
	 * @param array $data
	 * @return number
	 */
	public function delete($query, $data) {
		$stmt = $this->query($query, $data);
		return $stmt->rowCount();
	}
	
	
	/**
	 * Fetches single value from database table.
	 * 
	 * @param string
	 * @param array
	 * @return string|integer
	 */
	public function getOne($query = null, $data = null) {
		if (!is_null($query) && $query != $this->query) {
			$this->stmt = $this->query($query, $data);
		}
		
		$obj = $this->stmt->fetchObject();
		if (is_array($obj) || is_object($obj)) {
			return reset($obj);
		}
		
		return $obj;
	}
	
	
	/**
	 * Fetches all data as specified from database.
	 * 
	 * @param string $query
	 * @param array $data
	 * @return array
	 */
	public function getAll($query = null, $data = null) {
		if (!is_null($query) && $query != $this->query) {
			$this->stmt = $this->query($query, $data);
		}
		
		return ($this->stmt->fetchAll());
	}
	
	
	/**
	 * Executes query against database.
	 * 
	 * @param string $query
	 * @param mixed $data
	 * @return PDOStatement|boolean
	 */
	public function query($query, $data = null) {
		if (!is_null($this->connection)) {
			$this->query = $query;
			$this->stmt = $this->connection->prepare($query);
			$this->stmt->execute($data);
			return $this->stmt;
		}
		
		return false;
	}
}