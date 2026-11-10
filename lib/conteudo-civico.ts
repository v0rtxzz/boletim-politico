/** Conteúdo didático da área Política brasileira: Constituição e conceitos políticos. Linguagem neutra. */

const CF = "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm";
export const FONTE_CF = CF;

export type Topico = { id: string; titulo: string; artigos?: string; link?: string; itens: string[] };

export const CONSTITUICAO: Topico[] = [
  {
    id: "o-que-e", titulo: "O que é e como está organizada", link: CF,
    itens: [
      "A Constituição é a lei mais importante do país: todas as outras leis precisam respeitá-la. A atual foi promulgada em 5 de outubro de 1988, após a redemocratização, e ficou conhecida como “Constituição Cidadã”.",
      "Tem um preâmbulo, 9 títulos (com mais de 250 artigos) e o Ato das Disposições Constitucionais Transitórias (ADCT), que trata de regras de transição.",
      "Os títulos: I. Princípios fundamentais · II. Direitos e garantias · III. Organização do Estado · IV. Organização dos Poderes · V. Defesa do Estado e das instituições · VI. Tributação e orçamento · VII. Ordem econômica · VIII. Ordem social · IX. Disposições gerais.",
    ],
  },
  {
    id: "principios", titulo: "Princípios fundamentais", artigos: "arts. 1º a 4º", link: `${CF}#art1`,
    itens: [
      "O Brasil é uma república federativa e um Estado democrático de direito. Fundamentos: soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político.",
      "“Todo o poder emana do povo”, exercido por representantes eleitos ou diretamente (plebiscito, referendo e projetos de lei de iniciativa popular).",
      "Os Poderes Legislativo, Executivo e Judiciário são independentes e harmônicos entre si.",
      "Objetivos: construir uma sociedade livre, justa e solidária; garantir o desenvolvimento; erradicar a pobreza e reduzir desigualdades; promover o bem de todos, sem preconceitos.",
    ],
  },
  {
    id: "direitos", titulo: "Direitos e garantias individuais", artigos: "art. 5º", link: `${CF}#art5`,
    itens: [
      "Todos são iguais perante a lei. Ninguém é obrigado a fazer ou deixar de fazer algo senão em virtude de lei.",
      "Liberdade de expressão (vedado o anonimato), de consciência, de crença e de associação. A casa é inviolável e o sigilo das comunicações é protegido, salvo exceções previstas em lei e com ordem judicial.",
      "Direito de propriedade, que deve cumprir sua função social.",
      "Devido processo legal, contraditório e ampla defesa. Presunção de inocência: ninguém é considerado culpado até o fim do processo (trânsito em julgado).",
      "Proibidas as penas de morte (salvo guerra declarada), de prisão perpétua, de trabalhos forçados, de banimento e as cruéis. Tortura e racismo são crimes graves; o racismo é inafiançável e imprescritível.",
      "Instrumentos para defender direitos: habeas corpus (liberdade de locomoção), mandado de segurança, habeas data (dados pessoais), mandado de injunção e ação popular.",
    ],
  },
  {
    id: "sociais", titulo: "Direitos sociais e do trabalhador", artigos: "arts. 6º a 11", link: `${CF}#art6`,
    itens: [
      "Direitos sociais: educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência, proteção à maternidade e à infância e assistência aos desamparados.",
      "Do trabalhador: salário mínimo, 13º salário, férias com adicional de um terço, FGTS, limite de jornada, licença-maternidade e paternidade, direito de greve e de organização sindical."
    ],
  },
  {
    id: "voto", titulo: "Votar e ser votado", artigos: "arts. 14 a 17", link: `${CF}#art14`,
    itens: [
      "O voto é direto, secreto, universal e periódico. É obrigatório dos 18 aos 70 anos e facultativo para analfabetos, maiores de 70 e jovens de 16 e 17 anos.",
      "Idade mínima para se candidatar: 35 anos (presidente, vice e senador), 30 (governador), 21 (deputado e prefeito) e 18 (vereador).",
      "Partidos políticos são livres para se criar, mas devem ter caráter nacional e respeitar a democracia e os direitos fundamentais.",
    ],
  },
  {
    id: "estado", titulo: "Como o Estado se organiza", artigos: "arts. 18 a 43", link: `${CF}#art18`,
    itens: [
      "O Brasil é uma federação: União, 26 estados, o Distrito Federal e mais de 5.500 municípios, todos com autonomia.",
      "A Constituição divide as competências: a União cuida de temas nacionais (moeda, defesa, relações exteriores, direito penal e civil); estados e municípios, de temas regionais e locais. Saúde, educação e meio ambiente são responsabilidades compartilhadas.",
      "A intervenção federal em um estado é exceção, prevista para casos graves, como ameaça à ordem pública.",
    ],
  },
  {
    id: "legislativo", titulo: "Poder Legislativo e como nasce uma lei", artigos: "arts. 44 a 75", link: `${CF}#art44`,
    itens: [
      "O Congresso Nacional tem duas Casas. A Câmara tem 513 deputados, eleitos por 4 anos em número proporcional à população de cada estado (mínimo de 8 e máximo de 70). O Senado tem 81 senadores, 3 por estado e pelo DF, eleitos por 8 anos e renovados alternadamente em um terço e dois terços.",
      "Lei ordinária: aprovada por maioria simples. Lei complementar: maioria absoluta. Emenda à Constituição (PEC): 3/5 dos votos, em dois turnos, em cada Casa.",
      "O presidente pode sancionar ou vetar leis; o veto pode ser derrubado pela maioria absoluta do Congresso em sessão conjunta.",
      "Medida provisória: o presidente edita em caso de relevância e urgência, com força de lei imediata, mas ela perde a validade se não for aprovada pelo Congresso em até 120 dias.",
      "O Congresso fiscaliza o Executivo, com ajuda do Tribunal de Contas da União, e pode criar CPIs (comissões parlamentares de inquérito).",
    ],
  },
  {
    id: "executivo", titulo: "Poder Executivo e impeachment", artigos: "arts. 76 a 91", link: `${CF}#art76`,
    itens: [
      "O presidente é chefe de Estado e de governo. É eleito com mais da metade dos votos válidos (se ninguém alcançar, há segundo turno), para mandato de 4 anos, com direito a uma reeleição consecutiva.",
      "Nomeia ministros, edita decretos e medidas provisórias, comanda as Forças Armadas e conduz as relações exteriores.",
      "Impeachment: por crime de responsabilidade, a Câmara autoriza a abertura do processo por 2/3 dos deputados; o Senado julga, sob a presidência do presidente do STF, e a condenação exige 2/3 dos senadores.",
    ],
  },
  {
    id: "judiciario", titulo: "Poder Judiciário e funções essenciais à Justiça", artigos: "arts. 92 a 135", link: `${CF}#art92`,
    itens: [
      "O STF guarda a Constituição. O STJ uniformiza a interpretação das leis federais. Há também as Justiças Federal, Estaduais, do Trabalho, Eleitoral e Militar, e o Conselho Nacional de Justiça (CNJ), que fiscaliza a administração do Judiciário.",
      "Juízes têm garantias para decidir com independência: vitaliciedade, inamovibilidade e irredutibilidade de salário.",
      "Ministério Público: defende a ordem jurídica e o interesse público e é autor das ações penais. Defensoria Pública: presta assistência jurídica gratuita a quem não pode pagar. Advocacia-Geral da União: defende juridicamente a União.",
    ],
  },
  {
    id: "defesa", titulo: "Estado de defesa, estado de sítio e Forças Armadas", artigos: "arts. 136 a 144", link: `${CF}#art136`,
    itens: [
      "Estado de defesa: medida temporária e localizada, decretada pelo presidente para restabelecer a ordem em situações graves; o Congresso precisa aprová-la.",
      "Estado de sítio: medida mais ampla, para comoção grave ou guerra; depende de autorização prévia do Congresso.",
      "As Forças Armadas (Marinha, Exército e Aeronáutica) estão sob a autoridade suprema do presidente e se destinam à defesa da pátria e à garantia dos Poderes constitucionais.",
      "A segurança pública é exercida pelas polícias (Federal, Rodoviária Federal, civis, militares, penais) e corpos de bombeiros.",
    ],
  },
  {
    id: "tributos", titulo: "Impostos e orçamento", artigos: "arts. 145 a 169", link: `${CF}#art145`,
    itens: [
      "A Constituição define quais impostos cada ente pode cobrar e limites ao poder de tributar (por exemplo, nenhum tributo pode ser cobrado sem lei que o crie).",
      "A reforma tributária aprovada em 2023 (Emenda 132) substitui gradualmente impostos sobre consumo pela CBS (federal) e pelo IBS (estadual e municipal).",
      "O orçamento segue três leis propostas pelo Executivo e votadas pelo Congresso: o Plano Plurianual (PPA, 4 anos), a Lei de Diretrizes Orçamentárias (LDO) e a Lei Orçamentária Anual (LOA).",
    ],
  },
  {
    id: "economia-social", titulo: "Ordem econômica e ordem social", artigos: "arts. 170 a 232", link: `${CF}#art170`,
    itens: [
      "A ordem econômica se baseia na valorização do trabalho e na livre iniciativa, com princípios como função social da propriedade, livre concorrência, defesa do consumidor e do meio ambiente.",
      "Saúde é direito de todos e dever do Estado (art. 196), garantida pelo Sistema Único de Saúde (SUS). A educação também é direito de todos (art. 205).",
      "Previdência e assistência social formam, com a saúde, a seguridade social.",
      "Todos têm direito ao meio ambiente ecologicamente equilibrado (art. 225). Crianças e adolescentes têm prioridade absoluta (art. 227). Os povos indígenas têm direitos sobre as terras que tradicionalmente ocupam (art. 231).",
      "A comunicação social é livre, sem censura.",
    ],
  },
  {
    id: "clausulas", titulo: "Cláusulas pétreas e emendas", artigos: "art. 60", link: `${CF}#art60`,
    itens: [
      "Algumas regras não podem ser abolidas nem por emenda: a forma federativa, o voto direto, secreto, universal e periódico, a separação dos Poderes e os direitos e garantias individuais. São as cláusulas pétreas.",
      "Podem propor emendas: um terço dos deputados ou dos senadores, o presidente ou mais da metade das assembleias legislativas estaduais.",
      "A Constituição não pode ser emendada durante intervenção federal, estado de defesa ou estado de sítio. Desde 1988 recebeu mais de 130 emendas.",
    ],
  },
];

export const CONCEITOS: { id: string; titulo: string; texto: string[] }[] = [
  { id: "origem", titulo: "De onde vêm “esquerda” e “direita”", texto: [
    "Os termos surgiram na Revolução Francesa (1789): na Assembleia, quem defendia mudanças profundas sentava à esquerda; quem defendia a ordem tradicional, à direita.",
    "Hoje são rótulos aproximados. Pessoas e partidos misturam posições, e o sentido muda entre países e épocas. Muitos estudiosos usam dois eixos — o econômico e o dos costumes — em vez de uma linha só.",
  ] },
  { id: "extrema-esquerda", titulo: "Extrema-esquerda", texto: [
    "Defende mudança radical da ordem econômica, com fim ou forte limitação da propriedade privada dos meios de produção (correntes socialistas revolucionárias, comunistas e anarquistas).",
    "No uso acadêmico, o termo costuma indicar quem aceita ou defende romper com a democracia representativa para alcançar esses fins. Críticos apontam que regimes inspirados nessas ideias restringiram liberdades e eleições.",
  ] },
  { id: "esquerda", titulo: "Esquerda", texto: [
    "Prioriza a igualdade social: Estado atuante para reduzir desigualdades, com serviços públicos, programas sociais, direitos trabalhistas e tributação mais progressiva, além da ampliação de direitos de grupos historicamente excluídos.",
    "Críticos apontam riscos de expansão dos gastos e da dívida pública e de intervenção excessiva na economia.",
  ] },
  { id: "centro-esquerda", titulo: "Centro-esquerda", texto: [
    "Combina economia de mercado com Estado de bem-estar social, como na social-democracia europeia: aceita o mercado, mas com regulação e políticas sociais amplas.",
    "É criticada à esquerda por ser moderada demais e à direita por manter um Estado grande e caro.",
  ] },
  { id: "centro", titulo: "Centro", texto: [
    "Posições moderadas e pragmáticas, que variam conforme o tema; valoriza negociação, estabilidade institucional e reformas graduais.",
    "No Brasil, “centro” não é o mesmo que “Centrão”: este é o nome informal de um grupo de partidos do Congresso conhecido por negociar apoio a governos de diferentes orientações em troca de espaço, como cargos e emendas. O termo é usado tanto como descrição quanto como crítica.",
  ] },
  { id: "centro-direita", titulo: "Centro-direita", texto: [
    "Defende economia de mercado e responsabilidade fiscal, com Estado menor, mas mantendo políticas sociais básicas; tende a valores mais tradicionais, com moderação.",
    "É criticada à esquerda por dar pouca atenção à desigualdade e à direita por ceder demais ao Estado.",
  ] },
  { id: "direita", titulo: "Direita", texto: [
    "Prioriza a liberdade econômica e a propriedade privada: menos impostos e Estado menor, livre iniciativa e, com frequência, valores tradicionais (família, religião) e segurança pública mais rígida.",
    "Críticos apontam que pode aumentar desigualdades e reduzir proteções sociais.",
  ] },
  { id: "extrema-direita", titulo: "Extrema-direita", texto: [
    "Associada a nacionalismo intenso, forte ênfase em ordem e autoridade e rejeição a imigrantes ou a grupos vistos como ameaça.",
    "No uso acadêmico, o termo costuma indicar quem questiona regras da democracia liberal, como a independência de tribunais e da imprensa ou resultados eleitorais. Quem recebe o rótulo costuma rejeitá-lo, e sua aplicação é politicamente disputada.",
  ] },
  { id: "liberal-conservador", titulo: "Liberal, conservador, progressista", texto: [
    "Liberal: no Brasil, costuma indicar liberalismo econômico (menos Estado), mais associado à direita. Nos EUA, “liberal” significa progressista.",
    "Conservador: valoriza tradições e mudanças lentas, sobretudo em costumes. Progressista: defende mudanças sociais e ampliação de direitos.",
    "Uma pessoa pode ser liberal na economia e progressista nos costumes, ou o contrário.",
  ] },
  { id: "ideologias", titulo: "Social-democracia, socialismo, comunismo e libertarianismo", texto: [
    "Social-democracia: economia de mercado com Estado de bem-estar e forte proteção social.",
    "Socialismo: propõe propriedade coletiva ou estatal dos principais meios de produção; há vertentes democráticas e revolucionárias.",
    "Comunismo: na teoria marxista, sociedade sem classes e sem Estado, a ser alcançada após uma fase socialista.",
    "Libertarianismo: defende o mínimo possível de Estado, tanto na economia quanto na vida privada.",
  ] },
  { id: "populismo", titulo: "Populismo", texto: [
    "É um estilo político, não uma ideologia: opõe um “povo” virtuoso a uma “elite” e costuma concentrar a representação em um líder. Pode aparecer tanto na esquerda quanto na direita.",
  ] },
  { id: "neutralidade", titulo: "Por que este site não rotula partidos", texto: [
    "Classificar partidos e políticos no espectro é uma tarefa disputada, e diferentes pesquisas chegam a resultados distintos. Para manter a neutralidade, o site explica os conceitos, mas não atribui rótulos a partidos ou pessoas.",
  ] },
];
