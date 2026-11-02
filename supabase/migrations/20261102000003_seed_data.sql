-- Migração 4: Seeds Iniciais da Pastelaria

-- 1. Limpeza opcional para seeds
DELETE FROM configuracoes WHERE id = 1;

-- 2. Configurações da Loja
INSERT INTO configuracoes (
    id,
    nome_loja,
    whatsapp_loja,
    endereco_loja,
    lat_loja,
    lng_loja,
    valor_minimo,
    loja_aberta,
    horario_funcionamento,
    mensagem_fechada
) VALUES (
    1,
    'Pastelaria Pastel Dourado',
    '5511999999999',
    'Av. dos Bandeirantes, 1500 - Vila Olímpia, São Paulo - SP',
    -23.595496,
    -46.685324,
    15.00,
    true,
    'Terça a Domingo: 18:00 às 23:30',
    'Pastelaria fechada no momento! Nosso forno e tacho acendem às 18:00.'
) ON CONFLICT (id) DO UPDATE SET
    nome_loja = EXCLUDED.nome_loja,
    whatsapp_loja = EXCLUDED.whatsapp_loja,
    endereco_loja = EXCLUDED.endereco_loja,
    lat_loja = EXCLUDED.lat_loja,
    lng_loja = EXCLUDED.lng_loja;

-- 3. Faixas de Entrega
INSERT INTO faixas_entrega (km_ate, valor, ativo) VALUES
    (2.50, 5.00, true),
    (5.00, 8.50, true),
    (7.50, 12.00, true),
    (10.00, 16.00, true);

-- 4. Categorias
DO $$
DECLARE
    cat_salgados UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    cat_doces UUID := 'a0000000-0000-0000-0000-000000000002'::UUID;
    cat_bebidas UUID := 'a0000000-0000-0000-0000-000000000003'::UUID;
    cat_combos UUID := 'a0000000-0000-0000-0000-000000000004'::UUID;

    p_carne UUID := 'b0000000-0000-0000-0000-000000000001'::UUID;
    p_queijo UUID := 'b0000000-0000-0000-0000-000000000002'::UUID;
    p_pizza UUID := 'b0000000-0000-0000-0000-000000000003'::UUID;
    p_frango UUID := 'b0000000-0000-0000-0000-000000000004'::UUID;
    p_especial UUID := 'b0000000-0000-0000-0000-000000000005'::UUID;
    p_nutella UUID := 'b0000000-0000-0000-0000-000000000006'::UUID;
    p_romeu UUID := 'b0000000-0000-0000-0000-000000000007'::UUID;
    p_caldo UUID := 'b0000000-0000-0000-0000-000000000008'::UUID;
    p_coca UUID := 'b0000000-0000-0000-0000-000000000009'::UUID;
    p_combo1 UUID := 'b0000000-0000-0000-0000-000000000010'::UUID;
BEGIN
    INSERT INTO categorias (id, nome, ordem, ativo) VALUES
        (cat_salgados, 'Pastéis Salgados', 1, true),
        (cat_doces, 'Pastéis Doces', 2, true),
        (cat_combos, 'Combos Promocionais', 3, true),
        (cat_bebidas, 'Bebidas & Caldos', 4, true)
    ON CONFLICT (id) DO NOTHING;

    -- 5. Produtos
    INSERT INTO produtos (id, categoria_id, nome, descricao, preco, imagem_url, disponivel, ordem) VALUES
        (p_carne, cat_salgados, 'Pastel de Carne Especial', 'Carne moída selecionada bem temperada, azeitonas e ovos cozidos.', 11.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80', true, 1),
        (p_queijo, cat_salgados, 'Pastel de Queijo Muçarela', 'Generosa porção de muçarela artesanal derretida com orégano fresco.', 10.00, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80', true, 2),
        (p_pizza, cat_salgados, 'Pastel de Pizza Tradicional', 'Muçarela farta, presunto picado, tomate fresco e orégano.', 12.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', true, 3),
        (p_frango, cat_salgados, 'Pastel Frango com Catupiry', 'Peito de frango desfiado com tempero caseiro e Catupiry legítimo.', 13.50, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80', true, 4),
        (p_especial, cat_salgados, 'Pastel Campeão da Casa (30cm)', 'Carne moída, queijo, presunto, bacon crocante, ovo, azeitona e catupiry.', 22.00, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', true, 5),

        (p_nutella, cat_doces, 'Pastel Nutella com Banana', 'Nutella original com rodelas de banana fresca e toque de canela.', 14.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', true, 1),
        (p_romeu, cat_doces, 'Pastel Romeu e Julieta', 'Queijo minas frescal com goiabada cascão cremosa.', 12.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80', true, 2),

        (p_combo1, cat_combos, 'Combo Individual Crocante', '1 Pastel de Carne Especial + 1 Caldo de Cana 500ml geladinho.', 18.00, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80', true, 1),

        (p_caldo, cat_bebidas, 'Caldo de Cana Natural (500ml)', 'Extraído na hora, gelado com opção de limão ou abacaxi.', 8.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', true, 1),
        (p_coca, cat_bebidas, 'Coca-Cola Lata 350ml', 'Lata trincando de gelada.', 6.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80', true, 2)
    ON CONFLICT (id) DO NOTHING;

    -- 6. Opcionais Globais e Específicos
    INSERT INTO opcionais (produto_id, nome, preco_adicional, disponivel) VALUES
        (NULL, 'Catupiry Original Extra', 4.00, true),
        (NULL, 'Cheddar Cremoso', 3.50, true),
        (NULL, 'Bacon Crocante em Cubos', 4.50, true),
        (NULL, 'Vinagrete Especial da Casa (Pote 50ml)', 2.50, true),
        (NULL, 'Pimenta Caseira Especial (Pote 30ml)', 2.00, true),
        (NULL, 'Queijo Muçarela Extra', 4.00, true);
END $$;
