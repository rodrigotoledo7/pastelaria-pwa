-- Migração 1: Esquema Inicial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categorias do Cardápio
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    imagem_url TEXT,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    ordem INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Opcionais / Adicionais
CREATE TABLE IF NOT EXISTS opcionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE, -- NULL se aplicável a produtos gerais
    nome TEXT NOT NULL,
    preco_adicional NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (preco_adicional >= 0),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Faixas de Entrega
CREATE TABLE IF NOT EXISTS faixas_entrega (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    km_ate NUMERIC(6, 2) NOT NULL, -- Ex: 2.00, 4.00, 6.00
    valor NUMERIC(10, 2) NOT NULL CHECK (valor >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Configurações Globais da Loja
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nome_loja TEXT NOT NULL DEFAULT 'Pastelaria Pastel Dourado',
    whatsapp_loja TEXT NOT NULL DEFAULT '5511999999999',
    endereco_loja TEXT NOT NULL DEFAULT 'Rua dos Pastéis, 123 - Centro',
    lat_loja NUMERIC(10, 7) NOT NULL DEFAULT -23.550520,
    lng_loja NUMERIC(10, 7) NOT NULL DEFAULT -46.633308,
    valor_minimo NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    loja_aberta BOOLEAN NOT NULL DEFAULT TRUE,
    horario_funcionamento TEXT NOT NULL DEFAULT 'Terça a Domingo: 18:00 às 23:30',
    mensagem_fechada TEXT NOT NULL DEFAULT 'Estamos fechados no momento. Abrimos hoje às 18:00!',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Enums e Tabela de Pedidos
DO $$ BEGIN
    CREATE TYPE status_pedido AS ENUM ('novo', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_pedido AS ENUM ('retirada', 'entrega');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INT NOT NULL,
    data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT NOT NULL,
    tipo tipo_pedido NOT NULL,
    endereco TEXT,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    distancia_km NUMERIC(6, 2),
    forma_pagamento TEXT NOT NULL,
    troco_para NUMERIC(10, 2),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    taxa_entrega NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (taxa_entrega >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    observacoes TEXT,
    status status_pedido NOT NULL DEFAULT 'novo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pedido_diario UNIQUE (data_pedido, numero)
);

-- 7. Itens do Pedido (Snapshot imutável do momento da compra)
CREATE TABLE IF NOT EXISTS pedido_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    nome_snapshot TEXT NOT NULL,
    preco_snapshot NUMERIC(10, 2) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    opcionais_json JSONB DEFAULT '[]'::jsonb,
    observacao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_data_numero ON pedidos(data_pedido, numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id, ordem);
