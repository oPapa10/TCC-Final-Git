USE loja_motos;
-- ==========================================================
-- TABELA: adm
-- ==========================================================
CREATE TABLE adm (
  ID INT NOT NULL AUTO_INCREMENT,
  Nome VARCHAR(100) NOT NULL,
  CPF CHAR(11) NOT NULL UNIQUE,
  PRIMARY KEY (ID)
);

-- ==========================================================
-- TABELA: categoria
-- ==========================================================
CREATE TABLE categoria (
  ID INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  PRIMARY KEY (ID)
);

-- ==========================================================
-- TABELA: cliente
-- ==========================================================
CREATE TABLE cliente (
  ID INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(15),
  email VARCHAR(100) UNIQUE,
  CPF VARCHAR(14) UNIQUE,
  genero ENUM('Masculino','Feminino','Outro','Prefiro não informar'),
  senha VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  estado VARCHAR(50),
  cidade VARCHAR(100),
  rua VARCHAR(100),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  PRIMARY KEY (ID)
);

-- ==========================================================
-- TABELA: produto
-- ==========================================================
CREATE TABLE produto (
  ID INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(25),
  tamanho VARCHAR(15),
  peso DECIMAL(10,2),
  valor DECIMAL(10,2),
  cilindrada VARCHAR(50),
  descricao VARCHAR(255),
  potencia VARCHAR(50),
  tanque VARCHAR(50),
  estoque INT DEFAULT 0,
  material VARCHAR(100),
  protecao VARCHAR(100),
  imagem VARCHAR(255),
  thumbnails TEXT,
  Categoria_ID INT,
  slug VARCHAR(150) NOT NULL UNIQUE,
  valor_promocional DECIMAL(10,2),
  PRIMARY KEY (ID),
  FOREIGN KEY (Categoria_ID) REFERENCES categoria(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- ==========================================================
-- TABELA: cadastra
-- ==========================================================
CREATE TABLE cadastra (
  ID INT NOT NULL AUTO_INCREMENT,
  ADM_ID INT,
  Produto_ID INT,
  PRIMARY KEY (ID),
  FOREIGN KEY (ADM_ID) REFERENCES adm(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  FOREIGN KEY (Produto_ID) REFERENCES produto(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ==========================================================
-- TABELA: carrinho
-- ==========================================================
CREATE TABLE carrinho (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT,
  produto_id INT,
  quantidade INT,
  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES cliente(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produto(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ==========================================================
-- TABELA: promocao
-- ==========================================================
CREATE TABLE promocao (
  id INT NOT NULL AUTO_INCREMENT,
  produto_id INT NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  imagem VARCHAR(255) NOT NULL,
  valor_promocional DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_fim DATETIME,
  PRIMARY KEY (id),
  FOREIGN KEY (produto_id) REFERENCES produto(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ==========================================================
-- TABELA: vende
-- ==========================================================
CREATE TABLE vende (
  ID INT NOT NULL AUTO_INCREMENT,
  Cliente_ID INT,
  Produto_ID INT,
  ADM_ID INT,
  hora_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
  quem_fez VARCHAR(100),
  comentario VARCHAR(255),
  estrela INT,
  valor_venda DECIMAL(10,2),
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (ID),
  FOREIGN KEY (Cliente_ID) REFERENCES cliente(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  FOREIGN KEY (Produto_ID) REFERENCES produto(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  FOREIGN KEY (ADM_ID) REFERENCES adm(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- ==========================================================
-- TABELA: avaliacao
-- ==========================================================
CREATE TABLE avaliacao (
  id INT NOT NULL AUTO_INCREMENT,
  produto_id INT,
  usuario_id INT,
  estrela INT,
  titulo VARCHAR(100),
  descricao TEXT,
  data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  venda_id INT,
  created_at DATETIME,
  PRIMARY KEY (id),
  FOREIGN KEY (produto_id) REFERENCES produto(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES cliente(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (venda_id) REFERENCES vende(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- ==========================================================
-- TABELA: notificacoes
-- ==========================================================
CREATE TABLE notificacoes (
  id INT NOT NULL AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  venda_id INT,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'preparando',
  lida TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (cliente_id) REFERENCES cliente(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (venda_id) REFERENCES vende(ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- ==========================================================
-- TABELA: password_resets
-- ==========================================================
CREATE TABLE password_resets (
  id INT NOT NULL AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  token VARCHAR(128) NOT NULL,
  expires DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  FOREIGN KEY (cliente_id) REFERENCES cliente(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- ==========================================================
-- TABELA: pedido_itens
-- ==========================================================
CREATE TABLE pedido_itens (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  data_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (usuario_id) REFERENCES cliente(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produto(ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);