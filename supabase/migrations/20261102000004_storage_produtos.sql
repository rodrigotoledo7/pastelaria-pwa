-- Migração 4: Bucket e Políticas de Storage para Fotos dos Produtos

-- 1. Criação do bucket público 'produtos' se ainda não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Leitura Pública
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Fotos dos produtos públicas para leitura'
    ) THEN
        CREATE POLICY "Fotos dos produtos públicas para leitura"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'produtos');
    END IF;
END $$;

-- 3. Políticas de Upload e Modificação para Usuários Autenticados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin autenticado pode fazer upload de fotos'
    ) THEN
        CREATE POLICY "Admin autenticado pode fazer upload de fotos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'produtos');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin autenticado pode atualizar fotos'
    ) THEN
        CREATE POLICY "Admin autenticado pode atualizar fotos"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'produtos');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin autenticado pode deletar fotos'
    ) THEN
        CREATE POLICY "Admin autenticado pode deletar fotos"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'produtos');
    END IF;
END $$;
