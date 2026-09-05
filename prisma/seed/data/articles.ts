export type SeedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  body: string;
};

export const ARTICLE_CATEGORIES = [
  'Cuidados básicos',
  'Solo e nutrição',
  'Multiplicação',
  'Biodiversidade',
  'Consumo consciente',
] as const;

export const ARTICLES: SeedArticle[] = [
  {
    slug: 'como-regar-corretamente',
    title: 'Como regar corretamente',
    excerpt:
      'A rega é o cuidado mais simples e o que mais mata planta. O segredo não é a frequência: é o substrato.',
    category: 'Cuidados básicos',
    readingMinutes: 5,
    body: `## O calendário não sabe se a sua planta tem sede

"Regar toda terça-feira" é a regra mais comum e a mais problemática. A necessidade de água depende do calor, da umidade do ar, do tamanho do vaso, do tipo de substrato e da fase da planta. Uma mesma jiboia pode pedir água a cada três dias no verão e a cada dez no inverno.

## O teste do dedo

Enfie o dedo no substrato até a segunda falange, cerca de 3 a 5 centímetros.

- **Sai limpo e seco:** é hora de regar.
- **Sai com terra grudada e úmida:** espere.

Para vasos grandes, use um palito de madeira: enfie até o meio do vaso e observe se sai escuro e úmido.

## Regue até escorrer

Quando decidir regar, regue de verdade: molhe todo o substrato até a água sair pelos furos de drenagem. Regas pequenas e frequentes molham só a superfície e fazem as raízes crescerem para cima, deixando a planta frágil.

Depois de escorrer, **descarte a água do prato**. Vaso parado em água é a causa número um de apodrecimento de raiz.

## Sinais de excesso e de falta

| Sinal | Provável causa |
| --- | --- |
| Folhas amarelas e moles, substrato úmido | Excesso de água |
| Folhas murchas que voltam após a rega | Falta de água |
| Pontas marrons e secas | Ar seco ou substrato ressecado |
| Cheiro de terra azeda | Raízes apodrecendo |

## Uma regra que vale para quase tudo

Na dúvida, espere mais um dia. Quase toda planta de interior se recupera de um dia a mais de sede. Poucas se recuperam de raízes apodrecidas.`,
  },
  {
    slug: 'entendendo-a-luminosidade',
    title: 'Entendendo a luminosidade do seu espaço',
    excerpt:
      'Antes de escolher a planta, entenda a luz que você tem. É o fator que mais determina o sucesso.',
    category: 'Cuidados básicos',
    readingMinutes: 6,
    body: `## Luz não é a mesma coisa que claridade

Um cômodo pode parecer claro para os nossos olhos e ser escuro para uma planta. A visão humana se adapta muito bem à penumbra; a fotossíntese, não.

## As quatro faixas que o BROTA usa

**Sol direto por várias horas.** O sol bate fisicamente na planta durante quatro horas ou mais. Típico de quintais, lajes e varandas voltadas para o norte no hemisfério sul.

**Sol direto por algumas horas.** Duas a quatro horas de sol, normalmente pela manhã ou no fim da tarde. Janelas para leste e oeste.

**Claridade indireta abundante.** Muita luz, mas o sol não bate diretamente na folha. Perto de uma janela grande, ou atrás de uma cortina fina. É a condição preferida da maioria das plantas de interior.

**Pouca luz natural.** Longe de janelas, corredores, banheiros com janela pequena. Poucas espécies prosperam — mas espada-de-são-jorge e zamioculca dão conta.

## O teste da sombra

Em um dia claro, por volta do meio-dia, coloque a mão a 30 cm da parede, no lugar onde a planta vai ficar:

- **Sombra nítida, com contorno definido:** luz forte.
- **Sombra visível mas de bordas suaves:** claridade indireta abundante.
- **Sombra fraca, quase imperceptível:** pouca luz.

## Sinais de que a luz está errada

Planta esticada, com espaço grande entre uma folha e outra, e folhas novas menores que as antigas: **falta luz**. O nome técnico é estiolamento.

Manchas claras, esbranquiçadas ou amarronzadas que aparecem de repente na face voltada para a janela: **luz demais**, provavelmente queimadura de sol.`,
  },
  {
    slug: 'substrato-o-que-realmente-importa',
    title: 'Substrato: o que realmente importa',
    excerpt:
      'Terra de jardim em vaso é armadilha. Entenda por que o substrato precisa de ar tanto quanto de nutrientes.',
    category: 'Solo e nutrição',
    readingMinutes: 5,
    body: `## Raiz precisa respirar

As raízes fazem respiração celular e consomem oxigênio. Em um substrato compactado e encharcado, o oxigênio acaba, as raízes morrem e, em seguida, fungos e bactérias se instalam. É isso que chamamos de "apodrecimento".

## Os três papéis do substrato

1. **Sustentar** a planta fisicamente.
2. **Reter** água e nutrientes suficientes entre as regas.
3. **Drenar** o excesso e permitir a entrada de ar.

Terra de jardim pura falha no terceiro item quando colocada dentro de um vaso.

## Componentes e o que cada um faz

- **Terra vegetal / composto orgânico:** nutrientes e retenção.
- **Perlita:** pedrinha branca e leve que cria bolsões de ar. Não se decompõe.
- **Fibra de coco:** retém umidade sem compactar.
- **Casca de pinus:** estrutura e aeração, essencial para aroides e orquídeas.
- **Areia grossa:** drenagem para cactos e suculentas. Areia fina faz o contrário — compacta.

## Três misturas que resolvem quase tudo

**Folhagens de interior:** 2 partes de terra vegetal, 1 de perlita, 1 de fibra de coco.

**Aroides (jiboia, costela-de-adão, filodendro):** 2 partes de casca de pinus, 1 de perlita, 1 de fibra de coco.

**Cactos e suculentas:** 1 parte de terra vegetal, 1 de areia grossa, 1 de perlita.

## A camada de pedra no fundo do vaso

É uma prática tradicional que não funciona como se imagina: ela não melhora a drenagem, apenas eleva a zona encharcada. O que importa é **o furo no fundo** e a estrutura de todo o substrato.`,
  },
  {
    slug: 'propagacao-multiplicando-plantas',
    title: 'Propagação: multiplicando suas plantas',
    excerpt:
      'Uma planta pode virar dez. Aprenda estaquia, divisão de touceira e propagação por folha.',
    category: 'Multiplicação',
    readingMinutes: 7,
    body: `## Estaquia: o método mais comum

Funciona com jiboia, filodendro, peperômia, hortelã, alecrim e muitas outras.

1. Escolha um ramo saudável com pelo menos **um nó** — o pontinho de onde nasce a folha. É ali que as raízes surgem.
2. Corte logo abaixo do nó, com tesoura limpa.
3. Retire as folhas de baixo, deixando duas ou três no topo.
4. Coloque em água limpa ou direto em substrato úmido.
5. Troque a água a cada três dias. Raízes aparecem entre 2 e 4 semanas.

**Importante:** mudas enraizadas em água formam raízes diferentes das de terra. Passe para o substrato quando as raízes tiverem cerca de 5 cm, para a adaptação ser mais fácil.

## Divisão de touceira

Para plantas que crescem em moitas: samambaia, clorofito, maranta, capim-limão, lírio-da-paz.

Retire a planta do vaso, afaste o substrato e separe cuidadosamente os grupos de hastes que já tenham raízes próprias. Replante cada grupo em seu vaso.

Faça na primavera, quando a planta está em crescimento ativo.

## Folha isolada

Suculentas e violetas se multiplicam a partir de uma única folha.

- **Suculentas:** destaque a folha inteira, com a base, deixe secar por dois dias e apoie sobre substrato seco. Borrife de leve a cada três dias.
- **Violetas:** corte a folha com 2 cm de pecíolo e enterre só o pecíolo no substrato úmido.

## Paciência é parte do método

Propagação não é rápida. Uma suculenta de folha leva de dois a três meses para formar uma muda visível. O processo é lento porque a planta está construindo um organismo inteiro a partir de um pedaço.`,
  },
  {
    slug: 'plantas-nativas-por-que-plantar',
    title: 'Plantas nativas: por que plantar',
    excerpt:
      'Espécies nativas sustentam a fauna local, gastam menos água e contam a história do lugar onde você vive.',
    category: 'Biodiversidade',
    readingMinutes: 6,
    body: `## O que é uma planta nativa

É uma espécie que ocorre naturalmente em uma região, sem ter sido levada para lá por pessoas. O Brasil abriga cerca de 50 mil espécies de plantas — a maior diversidade vegetal do planeta.

## Três razões práticas

**Adaptação.** Uma espécie nativa já resolveu o problema do clima local ao longo de milhares de anos. Precisa de menos água, menos adubo e menos correção de solo.

**Fauna.** Beija-flores, abelhas nativas sem ferrão, borboletas e pássaros evoluíram junto com plantas específicas. Uma pitangueira em um quintal urbano alimenta sabiás; um ipê sustenta abelhas em plena seca.

**Identidade.** Mandacaru, ora-pro-nóbis, flor-de-maio, bromélia-imperial — todas brasileiras, todas presentes neste catálogo. Cultivar o que é daqui é uma forma de conhecer o lugar onde se vive.

## Nativa não é o mesmo que "do mato"

Muitas nativas são plantas ornamentais de primeira linha e estão em jardins do mundo inteiro. A flor-de-maio, vendida no hemisfério norte como "cacto de natal", vem da Mata Atlântica.

## Cuidado com as invasoras

O oposto de nativa não é "exótica" — é **invasora**. Espécies exóticas invasoras escapam do cultivo, se espalham e substituem a vegetação local. No Brasil, casos conhecidos incluem o lírio-do-brejo, a leucena e o capim-gordura.

Antes de plantar uma espécie exótica em área aberta, verifique se ela é considerada invasora na sua região.`,
  },
  {
    slug: 'polinizadores-no-quintal',
    title: 'Polinizadores: quem visita o seu jardim',
    excerpt:
      'Abelhas, borboletas, beija-flores e até morcegos. Como criar um espaço que os recebe.',
    category: 'Biodiversidade',
    readingMinutes: 5,
    body: `## Por que isso importa

Cerca de três em cada quatro tipos de cultivo agrícola no mundo dependem, em alguma medida, de animais polinizadores. Um jardim que os acolhe é uma contribuição pequena e real.

## Quem são

**Abelhas nativas sem ferrão.** Jataí, mandaçaia, uruçu. São dezenas de espécies brasileiras, muitas delas inofensivas e excelentes polinizadoras.

**Borboletas e mariposas.** Precisam de duas coisas: flores com néctar para os adultos e plantas hospedeiras para as lagartas. Um jardim sem lagartas é um jardim sem borboletas.

**Beija-flores.** Atraídos por flores tubulares, frequentemente vermelhas ou alaranjadas.

**Morcegos.** Polinizam flores noturnas grandes e claras — como as do mandacaru.

## O que fazer

- Prefira **flores simples** às dobradas: as dobradas costumam ter menos néctar acessível.
- Plante em **grupos** da mesma espécie: é mais fácil de encontrar.
- Escalone as floradas ao longo do ano para haver alimento sempre.
- Deixe um canto com **água rasa** e pedras para pouso.

## O que não fazer

Inseticidas de amplo espectro matam o polinizador junto com a praga. Antes de aplicar qualquer coisa, identifique o problema: boa parte dos insetos em um jardim é neutra ou benéfica.`,
  },
  {
    slug: 'compostagem-em-apartamento',
    title: 'Compostagem em apartamento',
    excerpt:
      'Restos de cozinha viram adubo em uma caixa que cabe embaixo da pia — e não cheira mal.',
    category: 'Consumo consciente',
    readingMinutes: 6,
    body: `## O princípio

Compostagem é decomposição controlada de matéria orgânica. Feita certo, não tem cheiro ruim: o mau cheiro é sinal de falta de oxigênio ou de excesso de material úmido.

## A proporção que resolve

Para cada parte de material **úmido** (restos de vegetais, borra de café, cascas de fruta), acrescente **duas a três partes** de material **seco** (folhas secas, serragem sem tratamento, papelão picado, palha).

É essa proporção que evita chorume, mosquitinhos e odor.

## O que não entra

Carnes, laticínios, óleos, fezes de animais domésticos, alimentos cozidos com sal ou tempero. Todos atraem pragas e desequilibram o processo.

## Composteira doméstica

Uma composteira de minhocas (vermicompostagem) com três caixas empilhadas cabe embaixo da pia e processa os resíduos de duas pessoas. As minhocas californianas fazem o trabalho pesado.

Dois produtos saem dela:
- **Húmus sólido**, pronto em cerca de dois meses, usado misturado ao substrato.
- **Chorume**, um líquido escuro que deve ser diluído (1 parte para 10 de água) antes de usar como adubo líquido.

## O impacto

Resíduo orgânico representa cerca de metade do lixo doméstico brasileiro. Quando vai para aterro, decompõe sem oxigênio e gera metano. Compostar em casa transforma esse mesmo material em adubo.`,
  },
  {
    slug: 'adubacao-sem-mito',
    title: 'Adubação sem mito',
    excerpt:
      'Adubo não é remédio nem alimento mágico. Entenda NPK, quando adubar e por que menos costuma ser mais.',
    category: 'Solo e nutrição',
    readingMinutes: 5,
    body: `## O que os números significam

Todo adubo traz três números, como 10-10-10. São as proporções de:

- **N — Nitrogênio:** folhas e crescimento vegetativo.
- **P — Fósforo:** raízes, flores e frutos.
- **K — Potássio:** resistência geral, qualidade dos tecidos.

Uma folhagem quer mais N. Uma florífera se beneficia de mais P na fase de botão.

## Quando adubar

Só quando a planta está **crescendo**. Adubo em planta parada — no inverno, logo após um replantio, ou em uma planta doente — não é aproveitado e se acumula no substrato, queimando as raízes.

Na maior parte do Brasil, a estação de crescimento vai da primavera ao fim do verão.

## Menos é mais

O erro mais comum não é adubar de menos: é adubar demais. Sinais de excesso incluem crosta esbranquiçada na superfície do substrato, pontas de folha queimadas e crescimento desordenado e frágil.

Na dúvida, use **metade da dose** indicada no rótulo. Nenhuma planta morre por receber pouco adubo em um mês; muitas morrem por receber demais em uma vez.

## Adubo orgânico e mineral

Não há um "melhor". O orgânico (húmus, torta de mamona, bokashi) libera nutrientes devagar e melhora a estrutura do substrato. O mineral age rápido e é preciso. Muitos cultivos combinam os dois.

## Replantio conta como adubação

Substrato novo já vem com nutrientes. Depois de replantar, espere de seis a oito semanas antes da primeira adubação.`,
  },
];
