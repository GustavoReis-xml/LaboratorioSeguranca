CREATE TABLE IF NOT EXISTS tipo_usuario (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(100)
);
INSERT INTO tipo_usuario (tipo)
VALUES
('Admin'),
('Gerente'),
('Municipe');

CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    tipo_usuario_id INTEGER NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT fk_usuario_tipo
        FOREIGN KEY (tipo_usuario_id)
        REFERENCES tipo_usuario (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

INSERT INTO usuario (nome, email, senha, tipo_usuario_id)
VALUES 
('Rodrigo Silva Peres', 'rodrigo@email.com', 'senha123', 1),
('Gerente Marvado', 'marvadinho@email.com', 'senha123',2),
('Aluno Hacker Saliente', 'aluno@email.com', 'senha123', 3);

CREATE TABLE IF NOT EXISTS iptu (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuario(id) NULL,
    nome VARCHAR(100),
    valor NUMERIC(10,2)
);

INSERT INTO iptu (usuario_id, nome, valor)
VALUES
(2, 'Roberval', 1000.00),
(3, 'Aluno Hacker Saliente', 1000.00),
(1, 'Rodrigo Silva Peres', 10.00);



CREATE TABLE IF NOT EXISTS comentario (
    id SERIAL PRIMARY KEY,
    texto VARCHAR(255),
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_comentario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
INSERT INTO comentario (texto, usuario_id) VALUES
('Nossa pirapora é linda e tem uma ótima gestão.', 1),
('Concordo chefinho!', 2);

CREATE TABLE IF NOT EXISTS dados_roubados (
    id SERIAL PRIMARY KEY,
    dados VARCHAR(255)
);