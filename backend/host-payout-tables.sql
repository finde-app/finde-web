CREATE TABLE IF NOT EXISTS finde_host_bank (
 host_id INT UNSIGNED PRIMARY KEY,
 datos VARBINARY(2048) NOT NULL,
 FOREIGN KEY (host_id) REFERENCES finde_host_accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS finde_host_documents (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 host_id INT UNSIGNED NOT NULL,
 tipo ENUM('Boleta','Factura') NOT NULL,
 folio VARCHAR(20) NOT NULL,
 monto INT UNSIGNED NOT NULL,
 referencia VARCHAR(100) NOT NULL,
 archivo MEDIUMBLOB NOT NULL,
 estado ENUM('revision','observado','aprobado','pagado') NOT NULL DEFAULT 'revision',
 nota VARCHAR(500) NOT NULL DEFAULT '',
 FOREIGN KEY (host_id) REFERENCES finde_host_accounts(id),
 UNIQUE KEY documento_anfitrion (host_id,tipo,folio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
