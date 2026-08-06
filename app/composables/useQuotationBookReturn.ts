/**
 * Guarda a URL do livro de Cotações (com filtros/página na query) para o detalhe voltar preservando o
 * recorte (RN-081 — "voltar preserva filtros e página"). A listagem escreve o `fullPath` ao abrir um
 * detalhe; o detalhe lê para o breadcrumb/voltar. Em entrada direta pela URL, cai no `/cotacoes` limpo.
 */
export function useQuotationBookReturn() {
  return useState<string>('si-quotation-book-return', () => '/cotacoes')
}
