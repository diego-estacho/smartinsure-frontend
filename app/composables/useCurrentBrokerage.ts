/**
 * Corretora do usuário logado. TODO(OPEN-03): o vínculo Usuário→Corretora ainda não existe no backend
 * (OPEN-03 aberto); enquanto isso, esta é uma **corretora MOCK fixa** para destravar a jornada de cotação.
 * Quando OPEN-03 existir, trocar pela corretora derivada do usuário autenticado — a assinatura não muda.
 *
 * ATENÇÃO: para o disparo funcionar AO VIVO, o `id` precisa corresponder a uma Corretora real do ambiente
 * (Pessoa com papel Corretor, com Habilitações Ativas). Ajustar `MOCK_BROKERAGE.id` para o id do dev.
 */
export interface CurrentBrokerage {
  id: string
  cnpj: string
  name: string
}

const MOCK_BROKERAGE: CurrentBrokerage = {
  // TODO(OPEN-03): trocar pelo id da Corretora real do ambiente (placeholder até o vínculo existir).
  id: '11111111-1111-1111-1111-111111111111',
  cnpj: '34060267000196',
  name: 'Corretora Bravo Ltda.',
}

export function useCurrentBrokerage(): { brokerage: CurrentBrokerage } {
  return { brokerage: { ...MOCK_BROKERAGE } }
}
