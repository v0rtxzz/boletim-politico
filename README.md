# Boletim Político Diário

Site pessoal que publica um boletim político diário (Brasil e mundo), gerado por um agente agendado que pesquisa a web, segue regras editoriais de imparcialidade e verificação de fontes, e grava o resultado no Supabase.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel. PWA instalável, mobile-first, com modo escuro automático.

## Páginas
- `/` — boletim mais recente
- `/arquivo` — boletins anteriores, com busca por texto
- `/boletim/AAAA-MM-DD` — boletim de um dia
- `/glossario` — termos políticos, jurídicos e econômicos

## Rodando localmente
```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev
```

## Banco
O esquema está em `supabase/schema.sql`. RLS ativado: leitura pública; escrita apenas com privilégios de serviço (usados pelo agente diário, nunca pelo site).

## Segurança
Nenhum segredo é versionado. O site usa somente a chave pública (anon/publishable) do Supabase, que só permite leitura por causa das políticas RLS.
