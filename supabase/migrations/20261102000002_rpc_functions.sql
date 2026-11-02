-- Migração 3: RPCs e Funções de Negócio

-- 1. Função de cálculo da taxa de entrega baseado nas faixas cadastradas
CREATE OR REPLACE FUNCTION calcular_entrega_faixa(p_distancia_km NUMERIC)
RETURNS TABLE (valor NUMERIC(10, 2), entregavel BOOLEAN) AS $$
DECLARE
    v_valor NUMERIC(10, 2);
BEGIN
    SELECT fe.valor INTO v_valor
    FROM faixas_entrega fe
    WHERE fe.ativo = true AND fe.km_ate >= p_distancia_km
    ORDER BY fe.km_ate ASC
    LIMIT 1;

    IF v_valor IS NOT NULL THEN
        RETURN QUERY SELECT v_valor, true;
    ELSE
        RETURN QUERY SELECT 0.00::NUMERIC(10, 2), false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função RPC atômica para criação do pedido com proteção de concorrência e snapshots
CREATE OR REPLACE FUNCTION criar_pedido_completo(
    p_cliente_nome TEXT,
    p_cliente_telefone TEXT,
    p_tipo TEXT,
    p_endereco TEXT,
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_distancia_km NUMERIC,
    p_forma_pagamento TEXT,
    p_troco_para NUMERIC,
    p_observacoes TEXT,
    p_itens JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_loja_aberta BOOLEAN;
    v_valor_minimo NUMERIC(10, 2);
    v_proximo_numero INT;
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_taxa_entrega NUMERIC(10, 2) := 0.00;
    v_total NUMERIC(10, 2) := 0.00;
    v_entregavel BOOLEAN := true;
    v_pedido_id UUID;
    v_item RECORD;
    v_prod_preco NUMERIC(10, 2);
    v_prod_nome TEXT;
    v_item_subtotal NUMERIC(10, 2);
    v_opc JSONB;
    v_opc_nome TEXT;
    v_opc_preco NUMERIC(10, 2);
    v_opcionais_array JSONB;
BEGIN
    -- Validação 1: Loja aberta
    SELECT loja_aberta, valor_minimo INTO v_loja_aberta, v_valor_minimo FROM configuracoes WHERE id = 1;
    IF v_loja_aberta IS FALSE THEN
        RAISE EXCEPTION 'A loja está fechada no momento.';
    END IF;

    -- Validação 2: Tipo de pedido e cálculo de entrega
    IF p_tipo = 'entrega' THEN
        IF p_distancia_km IS NULL OR p_distancia_km < 0 THEN
            RAISE EXCEPTION 'Distância inválida para entrega.';
        END IF;

        SELECT valor, entregavel INTO v_taxa_entrega, v_entregavel FROM calcular_entrega_faixa(p_distancia_km);
        IF v_entregavel IS FALSE THEN
            RAISE EXCEPTION 'O endereço está fora da nossa área de entrega. Por favor, escolha a opção Retirada.';
        END IF;
    ELSE
        v_taxa_entrega := 0.00;
    END IF;

    -- Validação e Cálculo dos Itens no Servidor (Prevenção de fraude de preço)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_itens) AS x(
        produto_id UUID,
        quantidade INT,
        opcionais JSONB,
        observacao TEXT
    )
    LOOP
        IF v_item.quantidade <= 0 THEN
            RAISE EXCEPTION 'Quantidade de item inválida.';
        END IF;

        -- Busca produto oficial no banco
        SELECT nome, preco INTO v_prod_nome, v_prod_preco
        FROM produtos
        WHERE id = v_item.produto_id AND disponivel = true;

        IF v_prod_nome IS NULL THEN
            RAISE EXCEPTION 'Produto não encontrado ou indisponível.';
        END IF;

        v_item_subtotal := v_prod_preco;
        v_opcionais_array := '[]'::jsonb;

        -- Processa opcionais/adicionais
        IF v_item.opcionais IS NOT NULL AND jsonb_array_length(v_item.opcionais) > 0 THEN
            FOR v_opc IN SELECT * FROM jsonb_array_elements(v_item.opcionais)
            LOOP
                SELECT nome, preco_adicional INTO v_opc_nome, v_opc_preco
                FROM opcionais
                WHERE id = (v_opc->>'id')::UUID AND disponivel = true;

                IF v_opc_nome IS NOT NULL THEN
                    v_item_subtotal := v_item_subtotal + v_opc_preco;
                    v_opcionais_array := v_opcionais_array || jsonb_build_object('nome', v_opc_nome, 'preco', v_opc_preco);
                END IF;
            END LOOP;
        END IF;

        v_subtotal := v_subtotal + (v_item_subtotal * v_item.quantidade);
    END LOOP;

    -- Validação do valor mínimo
    IF v_valor_minimo > 0 AND v_subtotal < v_valor_minimo THEN
        RAISE EXCEPTION 'O valor mínimo para pedidos é de R$ %', to_char(v_valor_minimo, 'FM999G990D00');
    END IF;

    v_total := v_subtotal + v_taxa_entrega;

    -- Geração atômica com trava diária
    -- Bloqueia a contagem do dia corrente
    PERFORM pg_advisory_xact_lock(hashtext('pedidos_seq_' || CURRENT_DATE::text));
    
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO v_proximo_numero
    FROM pedidos
    WHERE data_pedido = CURRENT_DATE;

    -- Inserir Pedido
    INSERT INTO pedidos (
        numero,
        data_pedido,
        cliente_nome,
        cliente_telefone,
        tipo,
        endereco,
        lat,
        lng,
        distancia_km,
        forma_pagamento,
        troco_para,
        subtotal,
        taxa_entrega,
        total,
        observacoes,
        status
    ) VALUES (
        v_proximo_numero,
        CURRENT_DATE,
        p_cliente_nome,
        p_cliente_telefone,
        p_tipo::tipo_pedido,
        p_endereco,
        p_lat,
        p_lng,
        p_distancia_km,
        p_forma_pagamento,
        p_troco_para,
        v_subtotal,
        v_taxa_entrega,
        v_total,
        p_observacoes,
        'novo'
    ) RETURNING id INTO v_pedido_id;

    -- Inserir Itens do Pedido com Snapshot
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_itens) AS x(
        produto_id UUID,
        quantidade INT,
        opcionais JSONB,
        observacao TEXT
    )
    LOOP
        SELECT nome, preco INTO v_prod_nome, v_prod_preco
        FROM produtos WHERE id = v_item.produto_id;

        v_opcionais_array := '[]'::jsonb;
        IF v_item.opcionais IS NOT NULL AND jsonb_array_length(v_item.opcionais) > 0 THEN
            FOR v_opc IN SELECT * FROM jsonb_array_elements(v_item.opcionais)
            LOOP
                SELECT nome, preco_adicional INTO v_opc_nome, v_opc_preco
                FROM opcionais WHERE id = (v_opc->>'id')::UUID;
                IF v_opc_nome IS NOT NULL THEN
                    v_opcionais_array := v_opcionais_array || jsonb_build_object('nome', v_opc_nome, 'preco', v_opc_preco);
                END IF;
            END LOOP;
        END IF;

        INSERT INTO pedido_itens (
            pedido_id,
            produto_id,
            nome_snapshot,
            preco_snapshot,
            quantidade,
            opcionais_json,
            observacao
        ) VALUES (
            v_pedido_id,
            v_item.produto_id,
            v_prod_nome,
            v_prod_preco,
            v_item.quantidade,
            v_opcionais_array,
            v_item.observacao
        );
    END LOOP;

    RETURN jsonb_build_object(
        'sucesso', true,
        'pedido_id', v_pedido_id,
        'numero', v_proximo_numero,
        'subtotal', v_subtotal,
        'taxa_entrega', v_taxa_entrega,
        'total', v_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
