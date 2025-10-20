USE loja_motos;
e
-- Tabela ADM
CREATE TABLE ADM (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    CPF CHAR(11) NOT NULL UNIQUE
);

-- Tabela CATEGORIA
CREATE TABLE CATEGORIA (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255)
);

-- Tabela CLIENTE
CREATE TABLE CLIENTE (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    CPF VARCHAR(14) UNIQUE,
    genero ENUM('Masculino', 'Feminino', 'Outro'),
    senha VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    estado VARCHAR(50),
    cidade VARCHAR(100),
    rua VARCHAR(100),
    numero VARCHAR(20),
    complemento VARCHAR(100)
);


-- Tabela PRODUTO
CREATE TABLE PRODUTO (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
    slug VARCHAR(150) UNIQUE,
    FOREIGN KEY (Categoria_ID) REFERENCES CATEGORIA(ID)
);

-- Tabela CADASTRA
CREATE TABLE CADASTRA (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ADM_ID INT,
    Produto_ID INT,
    FOREIGN KEY (ADM_ID) REFERENCES ADM(ID),
    FOREIGN KEY (Produto_ID) REFERENCES PRODUTO(ID)
);

-- Tabela VENDE
CREATE TABLE VENDE (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Cliente_ID INT,
    Produto_ID INT,
    ADM_ID INT,
    hora_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    quem_fez VARCHAR(100),
    comentario VARCHAR(255),
    estrela INT,
    valor_venda DECIMAL(10,2),
    FOREIGN KEY (Cliente_ID) REFERENCES CLIENTE(ID),
    FOREIGN KEY (Produto_ID) REFERENCES PRODUTO(ID),
    FOREIGN KEY (ADM_ID) REFERENCES ADM(ID)
);

CREATE TABLE IF NOT EXISTS Promocao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(60) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    link VARCHAR(255)
);

CREATE TABLE CARRINHO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    produto_id INT,
    quantidade INT,
    UNIQUE KEY (usuario_id, produto_id)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  token VARCHAR(128) NOT NULL,
  expires DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (token),
  FOREIGN KEY (cliente_id) REFERENCES Cliente(ID) ON DELETE CASCADE
);

-- ...existing code...
CREATE TABLE IF NOT EXISTS notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'preparando', -- 'preparando', 'enviado', 'entregue', etc.
  lida TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (cliente_id),
  FOREIGN KEY (cliente_id) REFERENCES Cliente(ID) ON DELETE CASCADE
);
-- ...existing code...