<?php
if (isset($_REQUEST) && count($_REQUEST) > 0) {
	if (error_log(print_r($_REQUEST, true), 0)) {
		echo 'OK';
	} else {
		echo 'FAILED';
	}
}