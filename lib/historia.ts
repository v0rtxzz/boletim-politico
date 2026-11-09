/**
 * Chefes de Estado do Brasil (Império e República).
 * Critério objetivo, sem juízo de importância: todos os imperadores e todos que exerceram a Presidência da República,
 * inclusive interinos que assumiram pela linha de sucessão. Juntas militares e regências não estão listadas
 * individualmente. Mesmos campos para todos: período, como chegou ao cargo, como saiu e partido (quando houver).
 * Fonte de referência: Biblioteca da Presidência da República (galeria de ex-presidentes).
 */

export type ChefeDeEstado = {
  slug: string;
  nome: string;
  periodo: string;
  periodoGeral: "Império" | "Primeira República" | "Era Vargas" | "República de 1946" | "Regime militar" | "Nova República";
  chegada: string;
  saida: string;
  partido?: string;
  wiki: string;
};

export const FONTE_HISTORIA = "https://www.biblioteca.presidencia.gov.br/";

export const CHEFES: ChefeDeEstado[] = [
  { slug: "pedro-i", nome: "D. Pedro I", periodo: "1822–1831", periodoGeral: "Império", chegada: "Proclamou a Independência e foi aclamado imperador.", saida: "Abdicou do trono em favor do filho.", wiki: "Pedro_I_do_Brasil" },
  { slug: "pedro-ii", nome: "D. Pedro II", periodo: "1840–1889", periodoGeral: "Império", chegada: "Declarado maior de idade antecipadamente, encerrando o período regencial.", saida: "Deposto com a Proclamação da República.", wiki: "Pedro_II_do_Brasil" },
  { slug: "deodoro", nome: "Deodoro da Fonseca", periodo: "1889–1891", periodoGeral: "Primeira República", chegada: "Liderou a Proclamação da República e chefiou o Governo Provisório; depois foi eleito indiretamente pelo Congresso Constituinte.", saida: "Renunciou.", wiki: "Deodoro_da_Fonseca" },
  { slug: "floriano", nome: "Floriano Peixoto", periodo: "1891–1894", periodoGeral: "Primeira República", chegada: "Era vice-presidente e assumiu após a renúncia de Deodoro.", saida: "Fim do mandato.", wiki: "Floriano_Peixoto" },
  { slug: "prudente", nome: "Prudente de Morais", periodo: "1894–1898", periodoGeral: "Primeira República", chegada: "Eleição direta; primeiro presidente civil.", saida: "Fim do mandato.", partido: "Partido Republicano Paulista", wiki: "Prudente_de_Morais" },
  { slug: "campos-sales", nome: "Campos Sales", periodo: "1898–1902", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Fim do mandato.", partido: "Partido Republicano Paulista", wiki: "Campos_Sales" },
  { slug: "rodrigues-alves", nome: "Rodrigues Alves", periodo: "1902–1906", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Fim do mandato.", partido: "Partido Republicano Paulista", wiki: "Rodrigues_Alves" },
  { slug: "afonso-pena", nome: "Afonso Pena", periodo: "1906–1909", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Morreu no cargo.", partido: "Partido Republicano Mineiro", wiki: "Afonso_Pena" },
  { slug: "nilo-pecanha", nome: "Nilo Peçanha", periodo: "1909–1910", periodoGeral: "Primeira República", chegada: "Era vice-presidente e assumiu após a morte de Afonso Pena.", saida: "Fim do mandato.", wiki: "Nilo_Peçanha" },
  { slug: "hermes", nome: "Hermes da Fonseca", periodo: "1910–1914", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Fim do mandato.", wiki: "Hermes_da_Fonseca" },
  { slug: "venceslau", nome: "Venceslau Brás", periodo: "1914–1918", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Fim do mandato.", partido: "Partido Republicano Mineiro", wiki: "Venceslau_Brás" },
  { slug: "delfim", nome: "Delfim Moreira", periodo: "1918–1919", periodoGeral: "Primeira República", chegada: "Vice eleito; assumiu porque o presidente eleito, Rodrigues Alves, adoeceu e morreu sem tomar posse.", saida: "Deixou o cargo após nova eleição.", wiki: "Delfim_Moreira" },
  { slug: "epitacio", nome: "Epitácio Pessoa", periodo: "1919–1922", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Fim do mandato.", wiki: "Epitácio_Pessoa" },
  { slug: "bernardes", nome: "Artur Bernardes", periodo: "1922–1926", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Fim do mandato.", partido: "Partido Republicano Mineiro", wiki: "Artur_Bernardes" },
  { slug: "washington-luis", nome: "Washington Luís", periodo: "1926–1930", periodoGeral: "Primeira República", chegada: "Eleição direta.", saida: "Deposto pela Revolução de 1930.", partido: "Partido Republicano Paulista", wiki: "Washington_Luís" },
  { slug: "vargas-1", nome: "Getúlio Vargas", periodo: "1930–1945", periodoGeral: "Era Vargas", chegada: "Assumiu com a Revolução de 1930; eleito indiretamente pela Constituinte em 1934; governou sob o Estado Novo a partir de 1937.", saida: "Deposto pelos militares.", wiki: "Getúlio_Vargas" },
  { slug: "linhares", nome: "José Linhares", periodo: "1945–1946", periodoGeral: "Era Vargas", chegada: "Presidente do STF; assumiu após a deposição de Vargas.", saida: "Entregou o cargo ao presidente eleito.", wiki: "José_Linhares" },
  { slug: "dutra", nome: "Eurico Gaspar Dutra", periodo: "1946–1951", periodoGeral: "República de 1946", chegada: "Eleição direta.", saida: "Fim do mandato.", partido: "PSD", wiki: "Eurico_Gaspar_Dutra" },
  { slug: "vargas-2", nome: "Getúlio Vargas", periodo: "1951–1954", periodoGeral: "República de 1946", chegada: "Eleição direta.", saida: "Morreu no cargo.", partido: "PTB", wiki: "Getúlio_Vargas" },
  { slug: "cafe-filho", nome: "Café Filho", periodo: "1954–1955", periodoGeral: "República de 1946", chegada: "Era vice-presidente e assumiu após a morte de Vargas.", saida: "Afastou-se por motivo de saúde e foi impedido pelo Congresso de reassumir.", partido: "PSP", wiki: "Café_Filho" },
  { slug: "carlos-luz", nome: "Carlos Luz", periodo: "1955", periodoGeral: "República de 1946", chegada: "Presidente da Câmara; assumiu interinamente.", saida: "Afastado pelo Congresso após o movimento militar de 11 de novembro de 1955.", wiki: "Carlos_Luz" },
  { slug: "nereu-ramos", nome: "Nereu Ramos", periodo: "1955–1956", periodoGeral: "República de 1946", chegada: "Vice-presidente do Senado; assumiu por decisão do Congresso.", saida: "Entregou o cargo ao presidente eleito.", wiki: "Nereu_Ramos" },
  { slug: "jk", nome: "Juscelino Kubitschek", periodo: "1956–1961", periodoGeral: "República de 1946", chegada: "Eleição direta.", saida: "Fim do mandato.", partido: "PSD", wiki: "Juscelino_Kubitschek" },
  { slug: "janio", nome: "Jânio Quadros", periodo: "1961", periodoGeral: "República de 1946", chegada: "Eleição direta.", saida: "Renunciou após cerca de sete meses.", wiki: "Jânio_Quadros" },
  { slug: "mazzilli", nome: "Ranieri Mazzilli", periodo: "1961 e 1964", periodoGeral: "República de 1946", chegada: "Presidente da Câmara; assumiu interinamente duas vezes.", saida: "Entregou o cargo nas duas ocasiões.", wiki: "Ranieri_Mazzilli" },
  { slug: "jango", nome: "João Goulart", periodo: "1961–1964", periodoGeral: "República de 1946", chegada: "Era vice-presidente e assumiu após a renúncia de Jânio, inicialmente sob regime parlamentarista.", saida: "Deposto em 1964, com a instauração do regime militar.", partido: "PTB", wiki: "João_Goulart" },
  { slug: "castelo", nome: "Castelo Branco", periodo: "1964–1967", periodoGeral: "Regime militar", chegada: "Eleito indiretamente pelo Congresso.", saida: "Fim do mandato.", wiki: "Humberto_de_Alencar_Castelo_Branco" },
  { slug: "costa-e-silva", nome: "Costa e Silva", periodo: "1967–1969", periodoGeral: "Regime militar", chegada: "Eleito indiretamente pelo Congresso.", saida: "Afastado por doença; uma junta militar assumiu.", wiki: "Artur_da_Costa_e_Silva" },
  { slug: "medici", nome: "Emílio Garrastazu Médici", periodo: "1969–1974", periodoGeral: "Regime militar", chegada: "Eleito indiretamente pelo Congresso.", saida: "Fim do mandato.", wiki: "Emílio_Garrastazu_Médici" },
  { slug: "geisel", nome: "Ernesto Geisel", periodo: "1974–1979", periodoGeral: "Regime militar", chegada: "Eleito indiretamente pelo Colégio Eleitoral.", saida: "Fim do mandato.", wiki: "Ernesto_Geisel" },
  { slug: "figueiredo", nome: "João Figueiredo", periodo: "1979–1985", periodoGeral: "Regime militar", chegada: "Eleito indiretamente pelo Colégio Eleitoral.", saida: "Fim do mandato; último presidente do regime militar.", wiki: "João_Figueiredo" },
  { slug: "sarney", nome: "José Sarney", periodo: "1985–1990", periodoGeral: "Nova República", chegada: "Eleito vice indiretamente na chapa de Tancredo Neves, que adoeceu e morreu antes da posse.", saida: "Fim do mandato.", partido: "PMDB", wiki: "José_Sarney" },
  { slug: "collor", nome: "Fernando Collor", periodo: "1990–1992", periodoGeral: "Nova República", chegada: "Eleição direta.", saida: "Afastado após a Câmara autorizar o processo de impeachment; renunciou antes do fim do julgamento no Senado, que o declarou inelegível por oito anos.", partido: "PRN", wiki: "Fernando_Collor_de_Mello" },
  { slug: "itamar", nome: "Itamar Franco", periodo: "1992–1994", periodoGeral: "Nova República", chegada: "Era vice-presidente e assumiu após o afastamento de Collor.", saida: "Fim do mandato.", wiki: "Itamar_Franco" },
  { slug: "fhc", nome: "Fernando Henrique Cardoso", periodo: "1995–2002", periodoGeral: "Nova República", chegada: "Eleição direta, duas vezes.", saida: "Fim do segundo mandato.", partido: "PSDB", wiki: "Fernando_Henrique_Cardoso" },
  { slug: "lula-1", nome: "Luiz Inácio Lula da Silva", periodo: "2003–2010", periodoGeral: "Nova República", chegada: "Eleição direta, duas vezes.", saida: "Fim do segundo mandato.", partido: "PT", wiki: "Luiz_Inácio_Lula_da_Silva" },
  { slug: "dilma", nome: "Dilma Rousseff", periodo: "2011–2016", periodoGeral: "Nova República", chegada: "Eleição direta, duas vezes.", saida: "Destituída pelo Senado em processo de impeachment.", partido: "PT", wiki: "Dilma_Rousseff" },
  { slug: "temer", nome: "Michel Temer", periodo: "2016–2018", periodoGeral: "Nova República", chegada: "Era vice-presidente e assumiu após o impeachment de Dilma.", saida: "Fim do mandato.", partido: "MDB", wiki: "Michel_Temer" },
  { slug: "bolsonaro", nome: "Jair Bolsonaro", periodo: "2019–2022", periodoGeral: "Nova República", chegada: "Eleição direta.", saida: "Fim do mandato; não foi reeleito.", partido: "PSL (na eleição); depois PL", wiki: "Jair_Bolsonaro" },
  { slug: "lula-2", nome: "Luiz Inácio Lula da Silva", periodo: "2023–atual", periodoGeral: "Nova República", chegada: "Eleição direta; reeleito em 2026 para mandato a partir de 2027.", saida: "Em exercício.", partido: "PT", wiki: "Luiz_Inácio_Lula_da_Silva" },
];

export const PERIODOS_HISTORIA = ["Império", "Primeira República", "Era Vargas", "República de 1946", "Regime militar", "Nova República"] as const;

export const CONTEXTO_PERIODO: Record<(typeof PERIODOS_HISTORIA)[number], string> = {
  "Império": "Monarquia constitucional, da Independência (1822) à Proclamação da República (1889).",
  "Primeira República": "De 1889 a 1930. Presidentes eleitos por voto direto, com participação eleitoral restrita.",
  "Era Vargas": "De 1930 a 1945, incluindo o Governo Provisório, a Constituição de 1934 e o Estado Novo (1937–1945).",
  "República de 1946": "De 1946 a 1964, sob a Constituição de 1946, com eleições diretas para presidente.",
  "Regime militar": "De 1964 a 1985. Presidentes militares escolhidos por eleição indireta.",
  "Nova República": "De 1985 em diante. Constituição de 1988 e eleições diretas desde 1989.",
};
