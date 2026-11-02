-- Migração 2: Row Level Security (RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE opcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE faixas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- 1. Categorias
CREATE POLICY "Categorias leitura pública" ON categorias
    FOR SELECT TO public USING (ativo = true OR auth.role() = 'authenticated');

CREATE POLICY "Categorias modificação somente admin" ON categorias
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Produtos
CREATE POLICY "Produtos leitura pública" ON produtos
    FOR SELECT TO public USING (disponivel = true OR auth.role() = 'authenticated');

CREATE POLICY "Produtos modificação somente admin" ON produtos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Opcionais
CREATE POLICY "Opcionais leitura pública" ON opcionais
    FOR SELECT TO public USING (disponivel = true OR auth.role() = 'authenticated');

CREATE POLICY "Opcionais modificação somente admin" ON opcionais
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Faixas de Entrega
CREATE POLICY "Faixas entrega leitura pública" ON faixas_entrega
    FOR SELECT TO public USING (ativo = true OR auth.role() = 'authenticated');

CREATE POLICY "Faixas entrega modificação somente admin" ON faixas_entrega
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Configurações
CREATE POLICY "Configurações leitura pública" ON configuracoes
    FOR SELECT TO public USING (true);

CREATE POLICY "Configurações modificação somente admin" ON configuracoes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Pedidos (Somente admin lê e gerencia diretamente; anon só cria via RPC security definer)
CREATE POLICY "Pedidos somente admin autenticado" ON pedidos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Itens de Pedido
CREATE POLICY "Pedido itens somente admin autenticado" ON pedido_itens
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
