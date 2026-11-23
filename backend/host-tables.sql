CREATE TABLE IF NOT EXISTS finde_host_accounts (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(120) NOT NULL,
 email VARCHAR(180) NOT NULL UNIQUE,
 password_hash VARCHAR(161) NOT NULL,
 reset_hash CHAR(64) UNIQUE,
 reset_until DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS finde_host_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 host_id INT UNSIGNED NOT NULL,
 expires_at DATETIME NOT NULL,
 FOREIGN KEY (host_id) REFERENCES finde_host_accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS finde_host_listings (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 host_id INT UNSIGNED NOT NULL,
 ficha MEDIUMTEXT NOT NULL,
 publicada MEDIUMTEXT,
 estado ENUM('borrador','pendiente','devuelta','publicada') NOT NULL,
 nota VARCHAR(1000) NOT NULL DEFAULT '',
 FOREIGN KEY (host_id) REFERENCES finde_host_accounts(id),
 INDEX (estado,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
