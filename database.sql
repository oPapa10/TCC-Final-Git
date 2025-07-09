-- Criação do banco de dados
CREATE DATABASE  LojaMotos;
USE LojaMotos;

-- Tabela de Administradores
CREATE TABLE  ADM (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    CPF CHAR(11) NOT NULL UNIQUE
);

-- Tabela de Clientes
CREATE TABLE  Cliente (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    CPF CHAR(11) NOT NULL UNIQUE,
    genero ENUM('Masculino', 'Feminino', 'Outro'),
    endereco VARCHAR(255),
    senha VARCHAR(255) NOT NULL
);

-- Tabela de Categorias
CREATE TABLE  Categoria (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255)
);

-- Tabela de Produtos
CREATE TABLE  Produto (
    ID INT AUTO_INCREMENT PRIMARY KEY,
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
    FOREIGN KEY (Categoria_ID) REFERENCES Categoria(ID)
);

-- Relacionamento: ADM cadastra Produto
CREATE TABLE  Cadastra (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ADM_ID INT,
    Produto_ID INT,
    FOREIGN KEY (ADM_ID) REFERENCES ADM(ID),
    FOREIGN KEY (Produto_ID) REFERENCES Produto(ID)
);

-- Relacionamento: Cliente vende Produto
CREATE TABLE  Vende (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Cliente_ID INT,
    Produto_ID INT,
    ADM_ID INT,
    hora_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    quem_fez VARCHAR(100),
    comentario VARCHAR(255),
    estrela INT CHECK (estrela >= 0 AND estrela <= 5),
    valor_venda DECIMAL(10,2),
    FOREIGN KEY (Cliente_ID) REFERENCES Cliente(ID),
    FOREIGN KEY (Produto_ID) REFERENCES Produto(ID),
    FOREIGN KEY (ADM_ID) REFERENCES ADM(ID)
);

-- Exemplo de categoria fictícia
INSERT INTO Categoria (nome, descricao) VALUES ('Fictícia', 'Categoria de teste para funcionamento do site');
