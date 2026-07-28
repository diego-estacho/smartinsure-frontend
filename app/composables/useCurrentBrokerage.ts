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
  // TODO(OPEN-03): id da Corretora do seed de dev (dev-seed-cotacao.local.sql). Trocar pela Corretora
  // do usuário autenticado quando o vínculo Usuário→Corretora existir.
  id: '01900000-c07e-7000-8000-0000000000a1',
  cnpj: '12233445000109',
  name: 'Alfa Corretora de Seguros LTDA',
}

export function useCurrentBrokerage(): { brokerage: CurrentBrokerage } {
  return { brokerage: { ...MOCK_BROKERAGE } }
}
