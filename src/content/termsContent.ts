export type TermsVariant = 'customer' | 'tenant';

export interface TermsSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  afterBullets?: string[];
  quote?: string;
}

export interface TermsDocument {
  variant: TermsVariant;
  title: string;
  version: string;
  publishedAt: string;
  intro: string;
  sections: TermsSection[];
  checkboxLabel: string;
  acceptanceQuote: string;
}

export const CUSTOMER_TERMS: TermsDocument = {
  variant: 'customer',
  title: 'TERMO DE USO E POLÍTICA DE PRIVACIDADE — CLIENTE FINAL',
  version: 'Versão 01',
  publishedAt: 'Publicada em 26.06.2026',
  intro:
    'Ao criar uma conta e utilizar a plataforma Connect/Konect+, o cliente declara que leu, compreendeu e aceita este Termo de Uso e Política de Privacidade.',
  sections: [
    {
      title: '1. Objetivo da Plataforma',
      paragraphs: [
        'A Connect/Konect+ é uma plataforma digital que conecta clientes a empresas cadastradas, permitindo a visualização de produtos, realização de pedidos, acompanhamento de compras e comunicação com o estabelecimento responsável.',
        'A Connect/Konect+ não fabrica, prepara, armazena ou entrega produtos diretamente, salvo quando houver serviço próprio expressamente informado.',
      ],
    },
    {
      title: '2. Dados Coletados do Cliente',
      paragraphs: [
        'Para funcionamento da plataforma, poderão ser coletados:',
      ],
      bullets: [
        'Nome',
        'Telefone',
        'E-mail',
        'Endereço de entrega',
        'Histórico de pedidos',
        'Dados de navegação',
        'IP, data e horário de acesso',
        'Informações do dispositivo utilizado',
      ],
      afterBullets: [
        'Esses dados são utilizados para identificação do cliente, processamento dos pedidos, comunicação, segurança, prevenção a fraudes e melhoria da experiência na plataforma.',
      ],
    },
    {
      title: '3. Dados Bancários e Cartão',
      paragraphs: ['A Connect/Konect+ nunca solicitará:'],
      bullets: [
        'Senha bancária',
        'Senha de aplicativo de banco',
        'Token bancário',
        'Dados de conta bancária',
        'Código de acesso ao banco',
        'Acesso remoto ao celular ou computador',
        'Chave privada ou senha PIX',
      ],
      afterBullets: [
        'Pagamentos poderão ocorrer por PIX, cartão, boleto ou outros meios disponíveis.',
        'Quando houver pagamento por cartão, a operação será processada por empresa especializada em pagamentos. A Connect/Konect+ não armazena o número completo do cartão, código de segurança ou senha.',
      ],
    },
    {
      title: '4. Compartilhamento de Dados',
      paragraphs: ['Os dados necessários ao pedido poderão ser compartilhados com:'],
      bullets: [
        'Empresa escolhida pelo cliente',
        'Entregador ou operador logístico',
        'Processador de pagamento',
        'Serviços de hospedagem, segurança e suporte',
        'Autoridades públicas, quando exigido por lei',
      ],
      afterBullets: ['A Connect/Konect+ não vende dados pessoais dos clientes.'],
    },
    {
      title: '5. Responsabilidade pelos Produtos',
      paragraphs: ['A empresa cadastrada é responsável por:'],
      bullets: [
        'Produto vendido',
        'Preço',
        'Promoção',
        'Qualidade',
        'Preparo',
        'Prazo de entrega',
        'Informações sobre ingredientes, validade e alergênicos',
        'Emissão de nota fiscal quando aplicável',
        'Atendimento ao cliente',
      ],
      afterBullets: [
        'A Connect/Konect+ atua como fornecedora da tecnologia e não como fabricante ou vendedora direta dos produtos anunciados pelas empresas.',
      ],
    },
    {
      title: '6. Segurança',
      paragraphs: [
        'A Connect/Konect+ utiliza medidas técnicas e administrativas para proteger os dados, incluindo controle de acesso, criptografia, conexão segura, monitoramento e registros de segurança.',
        'Mesmo assim, nenhum sistema digital é totalmente imune a falhas, ataques ou indisponibilidades.',
      ],
    },
    {
      title: '7. Direitos do Cliente',
      paragraphs: ['Nos termos da LGPD, o cliente poderá solicitar:'],
      bullets: [
        'Confirmação de tratamento de dados',
        'Acesso aos dados',
        'Correção de dados incorretos',
        'Atualização de informações',
        'Exclusão de dados, quando permitido por lei',
        'Revogação de consentimento',
        'Informações sobre compartilhamento',
      ],
      afterBullets: [
        'As solicitações deverão ser feitas pelo canal oficial de atendimento da Connect/Konect+.',
      ],
    },
    {
      title: '8. Condutas Proibidas',
      paragraphs: ['O cliente não poderá:'],
      bullets: [
        'Criar conta com dados falsos',
        'Realizar pedidos fraudulentos',
        'Tentar acessar áreas restritas',
        'Usar robôs, scripts ou automações indevidas',
        'Prejudicar empresas, entregadores ou a plataforma',
        'Praticar golpes, fraudes ou abuso do sistema',
      ],
      afterBullets: [
        'O descumprimento poderá gerar bloqueio, suspensão ou encerramento da conta.',
      ],
    },
    {
      title: '9. Retenção dos Dados',
      paragraphs: [
        'Os dados poderão ser mantidos pelo tempo necessário para cumprimento legal, prevenção a fraudes, segurança, auditoria, defesa em processos e execução dos serviços contratados.',
      ],
    },
    {
      title: '10. Alterações deste Termo',
      paragraphs: [
        'A Connect/Konect+ poderá atualizar este documento a qualquer momento. A continuidade de uso da plataforma significa concordância com a versão vigente.',
      ],
    },
    {
      title: '11. Aceite',
      quote:
        'Li e concordo com os Termos de Uso e Política de Privacidade da Connect/Konect+, autorizando o tratamento dos meus dados pessoais para utilização da plataforma, conforme a LGPD.',
    },
  ],
  checkboxLabel: 'Li e estou de acordo com os termos de uso',
  acceptanceQuote:
    'Li e concordo com os Termos de Uso e Política de Privacidade da Connect/Konect+, autorizando o tratamento dos meus dados pessoais para utilização da plataforma, conforme a LGPD.',
};

export const TENANT_TERMS: TermsDocument = {
  variant: 'tenant',
  title: 'TERMO DE USO E POLÍTICA DE PRIVACIDADE — EMPRESAS / TENANTS',
  version: 'Versão 01',
  publishedAt: 'Publicada em 26.06.2026',
  intro:
    'Ao cadastrar sua empresa na plataforma Connect/Konect+, o responsável legal declara que leu, compreendeu e aceita este Termo de Uso e Política de Privacidade.',
  sections: [
    {
      title: '1. Objetivo da Plataforma',
      paragraphs: [
        'A Connect/Konect+ fornece uma plataforma tecnológica para empresas divulgarem seus produtos, receberem pedidos, gerenciarem cardápio, preços, informações comerciais, atendimento e operação digital.',
        'A Connect/Konect+ não atua como sócia, representante, franqueadora ou responsável operacional da empresa cadastrada.',
      ],
    },
    {
      title: '2. Dados Coletados da Empresa',
      paragraphs: ['Para cadastro e operação, poderão ser coletados:'],
      bullets: [
        'Razão social',
        'Nome fantasia',
        'CNPJ',
        'Inscrição estadual ou municipal, quando aplicável',
        'Endereço comercial',
        'Nome do responsável',
        'CPF do responsável, quando necessário',
        'Telefone',
        'E-mail',
        'Dados de acesso',
        'Logs de uso',
        'IP, data e horário de acesso',
        'Informações dos produtos cadastrados',
      ],
      afterBullets: [
        'Esses dados serão utilizados para cadastro, autenticação, suporte, cobrança, segurança, auditoria, cumprimento legal e prestação dos serviços.',
      ],
    },
    {
      title: '3. Dados Bancários e Financeiros',
      paragraphs: ['A Connect/Konect+ nunca solicitará:'],
      bullets: [
        'Senha bancária',
        'Senha de internet banking',
        'Token de banco',
        'Código de acesso bancário',
        'Senha PIX',
        'Dados sigilosos de conta bancária',
        'Acesso remoto ao dispositivo da empresa',
      ],
      afterBullets: [
        'A Connect/Konect+ poderá cobrar planos por PIX, cartão, boleto ou outros meios de pagamento.',
        'Quando houver pagamento por cartão, o processamento será feito por empresa especializada. A Connect/Konect+ não armazena número completo do cartão, CVV ou senha.',
      ],
    },
    {
      title: '4. Responsabilidades da Empresa',
      paragraphs: ['A empresa cadastrada é integralmente responsável por:'],
      bullets: [
        'Produtos anunciados',
        'Preços',
        'Promoções',
        'Estoque',
        'Cardápio',
        'Imagens cadastradas',
        'Descrições dos produtos',
        'Qualidade dos alimentos ou serviços',
        'Informações sobre ingredientes e alergênicos',
        'Atendimento ao cliente',
        'Entrega, quando realizada por conta própria',
        'Cumprimento de normas sanitárias, fiscais, trabalhistas e consumeristas',
        'Emissão de documentos fiscais quando aplicável',
      ],
      afterBullets: [
        'A empresa declara que todas as informações inseridas na plataforma são verdadeiras, atualizadas e de sua responsabilidade.',
      ],
    },
    {
      title: '5. Pagamento dos Planos',
      paragraphs: [
        'O uso da plataforma poderá depender da contratação de plano.',
        'Em caso de atraso ou inadimplência, a Connect/Konect+ poderá suspender temporariamente o acesso, limitar funcionalidades, bloquear recebimento de novos pedidos, encerrar a conta após aviso prévio ou cobrar valores em aberto.',
      ],
    },
    {
      title: '6. Uso Correto da Plataforma',
      paragraphs: ['A empresa não poderá:'],
      bullets: [
        'Cadastrar produtos ilegais',
        'Usar imagens sem autorização',
        'Informar preços enganosos',
        'Realizar publicidade falsa',
        'Fraudar pedidos ou pagamentos',
        'Tentar acessar dados de outras empresas',
        'Compartilhar login e senha com terceiros não autorizados',
        'Utilizar a plataforma para finalidade ilegal',
      ],
    },
    {
      title: '7. Segurança e Confidencialidade',
      paragraphs: [
        'A empresa deverá manter seus dados de acesso em sigilo.',
        'A Connect/Konect+ não se responsabiliza por acessos realizados com login e senha válidos, salvo quando comprovada falha exclusiva da plataforma.',
        'A empresa deve comunicar imediatamente qualquer suspeita de uso indevido da conta.',
      ],
    },
    {
      title: '8. Compartilhamento de Dados',
      paragraphs: ['A Connect/Konect+ poderá compartilhar dados com:'],
      bullets: [
        'Processadores de pagamento',
        'Serviços de hospedagem',
        'Serviços de segurança',
        'Ferramentas de suporte',
        'Serviços de envio de mensagens',
        'Autoridades públicas, quando exigido por lei',
      ],
      afterBullets: ['A Connect/Konect+ não vende dados das empresas cadastradas.'],
    },
    {
      title: '9. Dados dos Clientes',
      paragraphs: [
        'A empresa poderá receber dados dos clientes necessários para execução dos pedidos.',
        'A empresa se compromete a usar esses dados somente para preparar o pedido, realizar entrega, prestar atendimento, cumprir obrigações legais e resolver problemas relacionados ao pedido.',
        'É proibido usar dados dos clientes para spam, venda de informações, contatos abusivos ou finalidade não autorizada.',
      ],
    },
    {
      title: '10. LGPD',
      paragraphs: [
        'A Connect/Konect+ e a empresa cadastrada deverão observar a Lei Geral de Proteção de Dados.',
        'Quando a empresa tratar dados pessoais de clientes recebidos pela plataforma, deverá adotar medidas adequadas de segurança, confidencialidade e uso limitado à finalidade do pedido.',
      ],
    },
    {
      title: '11. Disponibilidade da Plataforma',
      paragraphs: [
        'A Connect/Konect+ buscará manter a plataforma disponível, segura e funcional.',
        'Entretanto, poderão ocorrer interrupções por manutenção, atualizações, falhas de internet, problemas em servidores, serviços de terceiros ou caso fortuito ou força maior.',
      ],
    },
    {
      title: '12. Limitação de Responsabilidade',
      paragraphs: ['A Connect/Konect+ não será responsável por:'],
      bullets: [
        'Produtos vendidos pela empresa',
        'Prejuízos causados por má operação da empresa',
        'Erros de cadastro feitos pela empresa',
        'Atrasos de entrega da empresa',
        'Problemas fiscais, sanitários ou trabalhistas',
        'Reclamações decorrentes da relação entre empresa e cliente',
        'Uso indevido da conta por negligência da empresa',
      ],
    },
    {
      title: '13. Suspensão ou Encerramento',
      paragraphs: [
        'A Connect/Konect+ poderá suspender ou encerrar contas em caso de inadimplência, fraude, violação destes termos, uso ilegal da plataforma, risco à segurança, reclamações recorrentes graves ou determinação legal ou judicial.',
      ],
    },
    {
      title: '14. Propriedade Intelectual',
      paragraphs: [
        'A plataforma, marca, layout, código, sistemas, recursos e funcionalidades pertencem à Connect/Konect+.',
        'A empresa recebe apenas uma licença limitada de uso enquanto estiver ativa e adimplente.',
      ],
    },
    {
      title: '15. Alterações deste Termo',
      paragraphs: [
        'A Connect/Konect+ poderá atualizar este documento sempre que necessário.',
        'A continuidade de uso da plataforma após a atualização representa concordância com a nova versão.',
      ],
    },
    {
      title: '16. Aceite',
      quote:
        'Declaro que li e concordo integralmente com os Termos de Uso e Política de Privacidade da Connect/Konect+, autorizando o tratamento dos dados necessários para prestação dos serviços, cobrança dos planos e operação da plataforma, conforme a LGPD.',
    },
  ],
  checkboxLabel: 'Li e estou de acordo com os termos de uso',
  acceptanceQuote:
    'Declaro que li e concordo integralmente com os Termos de Uso e Política de Privacidade da Connect/Konect+, autorizando o tratamento dos dados necessários para prestação dos serviços, cobrança dos planos e operação da plataforma, conforme a LGPD.',
};

export function getTermsDocument(variant: TermsVariant): TermsDocument {
  return variant === 'customer' ? CUSTOMER_TERMS : TENANT_TERMS;
}
