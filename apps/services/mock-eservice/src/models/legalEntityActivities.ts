// ATECO 2025 economic-activity codes (6-digit category level) → Italian/English
// title, from the official "Struttura ATECO 2025 vs NACE Rev. 2.1" classification.
// Single source of truth for the legalEntityActivity enum (see models/api.ts).

export const legalEntityActivities = {
  "01.11.00": {
    en: "Growing of cereals, other than rice, leguminous crops and oil seeds",
    it: "Coltivazione di cereali, legumi da granella e semi oleosi, escluso il riso",
  },
  "01.12.00": {
    en: "Growing of rice",
    it: "Coltivazione di riso",
  },
  "01.13.11": {
    en: "Growing of vegetables and melons in open fields",
    it: "Coltivazione di ortaggi e meloni in piena aria",
  },
  "01.13.12": {
    en: "Growing of vegetables and melons in greenhouses as soil-less culture",
    it: "Coltivazione di ortaggi e meloni in colture protette fuori suolo",
  },
  "01.13.13": {
    en: "Growing of vegetables and melons in greenhouses, other than soil-less culture",
    it: "Coltivazione di ortaggi e meloni in altre colture protette, escluse colture fuori suolo",
  },
  "01.13.20": {
    en: "Growing of roots, including sugar beet",
    it: "Coltivazione di radici, incluse barbabietole da zucchero",
  },
  "01.13.30": {
    en: "Growing of tubers, including potatoes",
    it: "Coltivazione di tuberi, incluse patate",
  },
  "01.14.00": {
    en: "Growing of sugar cane",
    it: "Coltivazione di canna da zucchero",
  },
  "01.15.00": {
    en: "Growing of tobacco",
    it: "Coltivazione di tabacco",
  },
  "01.16.00": {
    en: "Growing of fibre crops",
    it: "Coltivazione di piante tessili",
  },
  "01.19.11": {
    en: "Growing of flowers in open fields",
    it: "Coltivazione di fiori in piena aria",
  },
  "01.19.12": {
    en: "Growing of flowers in greenhouses as soil-less culture",
    it: "Coltivazione di fiori in colture protette fuori suolo",
  },
  "01.19.13": {
    en: "Growing of flowers in greenhouses, other than soil-less culture",
    it: "Coltivazione di fiori in altre colture protette, escluse colture fuori suolo",
  },
  "01.19.90": {
    en: "Growing of crops for fodder and of other non-perennial crops n.e.c.",
    it: "Coltivazione di piante da foraggio e di altre colture agricole non permanenti n.c.a.",
  },
  "01.21.00": {
    en: "Growing of grapes",
    it: "Coltivazione di uva",
  },
  "01.22.00": {
    en: "Growing of tropical and subtropical fruits",
    it: "Coltivazione di frutta di origine tropicale e subtropicale",
  },
  "01.23.00": {
    en: "Growing of citrus fruits",
    it: "Coltivazione di agrumi",
  },
  "01.24.00": {
    en: "Growing of pome fruits and stone fruits",
    it: "Coltivazione di pomacee e frutta a nocciolo",
  },
  "01.25.00": {
    en: "Growing of other tree and bush fruits and nuts",
    it: "Coltivazione di altri alberi da frutto, frutti di bosco e frutta in guscio",
  },
  "01.26.00": {
    en: "Growing of oleaginous fruits",
    it: "Coltivazione di frutti oleosi",
  },
  "01.27.00": {
    en: "Growing of beverage crops",
    it: "Coltivazione di piante per la produzione di bevande",
  },
  "01.28.00": {
    en: "Growing of spices, aromatic, drug and pharmaceutical crops",
    it: "Coltivazione di spezie, piante aromatiche e farmaceutiche",
  },
  "01.29.00": {
    en: "Growing of other perennial crops",
    it: "Coltivazione di altre colture agricole permanenti",
  },
  "01.30.00": {
    en: "Plant propagation",
    it: "Riproduzione delle piante",
  },
  "01.41.00": {
    en: "Raising of dairy cattle",
    it: "Allevamento di bovini da latte",
  },
  "01.42.00": {
    en: "Raising of other cattle and buffaloes",
    it: "Allevamento di altri bovini e bufalini",
  },
  "01.43.00": {
    en: "Raising of horses and other equines",
    it: "Allevamento di cavalli e altri equini",
  },
  "01.44.00": {
    en: "Raising of camels and camelids",
    it: "Allevamento di cammelli e camelidi",
  },
  "01.45.00": {
    en: "Raising of sheep and goats",
    it: "Allevamento di ovini e caprini",
  },
  "01.46.00": {
    en: "Raising of swine and pigs",
    it: "Allevamento di suini",
  },
  "01.47.00": {
    en: "Raising of poultry",
    it: "Allevamento di pollame",
  },
  "01.48.10": {
    en: "Raising of rabbits",
    it: "Allevamento di conigli",
  },
  "01.48.20": {
    en: "Raising of other fur animals",
    it: "Allevamento di altri animali da pelliccia",
  },
  "01.48.30": {
    en: "Bee-keeping",
    it: "Apicoltura",
  },
  "01.48.40": {
    en: "Sericulture",
    it: "Bachicoltura",
  },
  "01.48.91": {
    en: "Raising of insects",
    it: "Allevamento di insetti",
  },
  "01.48.99": {
    en: "Raising of other various animals n.e.c.",
    it: "Allevamento di altri animali vari n.c.a.",
  },
  "01.50.00": {
    en: "Mixed farming",
    it: "Coltivazioni agricole associate all'allevamento di animali: attività mista",
  },
  "01.61.10": {
    en: "Maintenance of land keeping it in good condition",
    it: "Manutenzione del terreno per mantenerlo in buone condizioni",
  },
  "01.61.91": {
    en: "Pesticides application",
    it: "Trattamenti fitosanitari",
  },
  "01.61.99": {
    en: "Other support activities for crop production n.e.c.",
    it: "Altre attività di supporto alla produzione vegetale n.c.a.",
  },
  "01.62.01": {
    en: "Activities of farriers",
    it: "Attività di maniscalchi",
  },
  "01.62.09": {
    en: "Other support activities for animal production",
    it: "Altre attività di supporto alla produzione animale",
  },
  "01.63.10": {
    en: "Post-harvest crop activities",
    it: "Attività successive alla raccolta",
  },
  "01.63.20": {
    en: "Seed processing for propagation",
    it: "Lavorazione delle sementi per la semina",
  },
  "01.70.00": {
    en: "Hunting, trapping and related service activities",
    it: "Caccia, cattura di animali e servizi connessi",
  },
  "02.10.00": {
    en: "Silviculture and other forestry activities",
    it: "Silvicoltura e altre attività forestali",
  },
  "02.20.00": {
    en: "Logging",
    it: "Utilizzo di aree forestali",
  },
  "02.30.00": {
    en: "Gathering of wild growing non-wood products",
    it: "Raccolta di prodotti selvatici non legnosi",
  },
  "02.40.00": {
    en: "Support services to forestry",
    it: "Servizi di supporto per la silvicoltura",
  },
  "03.11.00": {
    en: "Marine fishing",
    it: "Pesca marina",
  },
  "03.12.00": {
    en: "Freshwater fishing",
    it: "Pesca in acque dolci",
  },
  "03.21.01": {
    en: "Marine algae cultivation",
    it: "Coltivazione di alghe marine",
  },
  "03.21.09": {
    en: "Other activities of marine aquaculture",
    it: "Altre attività di acquacoltura marina",
  },
  "03.22.01": {
    en: "Freshwater algae cultivation",
    it: "Coltivazione di alghe in acque dolci",
  },
  "03.22.09": {
    en: "Other activities of freshwater aquaculture",
    it: "Altre attività di acquacoltura in acque dolci",
  },
  "03.30.00": {
    en: "Support activities for fishing and aquaculture",
    it: "Attività di supporto alla pesca e all'acquacoltura",
  },
  "05.10.00": {
    en: "Mining of hard coal",
    it: "Estrazione di antracite",
  },
  "05.20.00": {
    en: "Mining of lignite",
    it: "Estrazione di lignite",
  },
  "06.10.00": {
    en: "Extraction of crude petroleum",
    it: "Estrazione di petrolio greggio",
  },
  "06.20.00": {
    en: "Extraction of natural gas",
    it: "Estrazione di gas naturale",
  },
  "07.10.00": {
    en: "Mining of iron ores",
    it: "Estrazione di minerali metalliferi ferrosi",
  },
  "07.21.00": {
    en: "Mining of uranium and thorium ores",
    it: "Estrazione di minerali di uranio e torio",
  },
  "07.29.00": {
    en: "Mining of other non-ferrous metal ores",
    it: "Estrazione di altri minerali metalliferi non ferrosi",
  },
  "08.11.00": {
    en: "Quarrying of ornamental stone, limestone, gypsum, slate and other stone",
    it: "Estrazione di pietre ornamentali, calcare, pietra di gesso, ardesia e altre pietre",
  },
  "08.12.00": {
    en: "Operation of gravel and sand pits and mining of clay and kaolin",
    it: "Estrazione di ghiaia, sabbia, argilla e caolino",
  },
  "08.91.00": {
    en: "Mining of chemical and fertiliser minerals",
    it: "Estrazione di minerali per l'industria chimica e per la produzione di fertilizzanti",
  },
  "08.92.00": {
    en: "Extraction of peat",
    it: "Estrazione di torba",
  },
  "08.93.01": {
    en: "Extraction of salt from underground",
    it: "Estrazione di sale dal sottosuolo",
  },
  "08.93.02": {
    en: "Marine saliculture",
    it: "Salicoltura marina",
  },
  "08.93.03": {
    en: "Salt production by evaporation of other saline waters",
    it: "Produzione di sale da salamoia",
  },
  "08.99.01": {
    en: "Mining and quarrying of asphalt and natural bitumen",
    it: "Estrazione di asfalto e bitume naturale",
  },
  "08.99.09": {
    en: "Mining and quarrying of other minerals n.e.c.",
    it: "Altre attività estrattive varie n.c.a.",
  },
  "09.10.00": {
    en: "Support activities for petroleum and natural gas extraction",
    it: "Attività di supporto all'estrazione di petrolio e gas naturale",
  },
  "09.90.00": {
    en: "Support activities for other mining and quarrying",
    it: "Attività di supporto ad altre attività estrattive",
  },
  "10.11.00": {
    en: "Processing and preserving of meat, except of poultry meat",
    it: "Lavorazione e conservazione di carne, esclusa la carne di volatili",
  },
  "10.12.00": {
    en: "Processing and preserving of poultry meat",
    it: "Lavorazione e conservazione di carne di volatili",
  },
  "10.13.00": {
    en: "Production of meat and poultry meat products",
    it: "Produzione di prodotti a base di carne, inclusi prodotti a base di carne di volatili",
  },
  "10.20.01": {
    en: "Processing of seaweed",
    it: "Lavorazione di alghe",
  },
  "10.20.09": {
    en: "Other activities of processing and preserving of fish, crustaceans and molluscs",
    it: "Altre attività di lavorazione e conservazione di pesce, crostacei e molluschi",
  },
  "10.31.00": {
    en: "Processing and preserving of potatoes",
    it: "Lavorazione e conservazione di patate",
  },
  "10.32.00": {
    en: "Manufacture of fruit and vegetable juice",
    it: "Produzione di succhi a base di frutta e ortaggi",
  },
  "10.39.00": {
    en: "Other processing and preserving of fruit and vegetables",
    it: "Altre attività di lavorazione e conservazione di frutta e ortaggi",
  },
  "10.41.10": {
    en: "Manufacture of olive oil",
    it: "Produzione di olio di oliva",
  },
  "10.41.20": {
    en: "Manufacture of vegetable oils, other than olive oil",
    it: "Produzione di altri oli vegetali",
  },
  "10.41.30": {
    en: "Manufacture of animal oils and fats",
    it: "Produzione di oli e grassi animali",
  },
  "10.42.00": {
    en: "Manufacture of margarine and similar edible fats",
    it: "Produzione di margarina e di grassi alimentari simili",
  },
  "10.51.10": {
    en: "Processing of liquid milk",
    it: "Trattamento igienico del latte",
  },
  "10.51.20": {
    en: "Manufacture of other dairy products",
    it: "Produzione di derivati del latte",
  },
  "10.52.00": {
    en: "Manufacture of ice cream and other edible ice",
    it: "Produzione di gelati",
  },
  "10.61.11": {
    en: "Wheat milling",
    it: "Lavorazione di frumento",
  },
  "10.61.19": {
    en: "Grain milling, other that wheat milling",
    it: "Lavorazione di altri cereali",
  },
  "10.61.20": {
    en: "Rice milling",
    it: "Lavorazione del riso",
  },
  "10.61.90": {
    en: "Manufacture of other grain mill products",
    it: "Lavorazioni di altre granaglie",
  },
  "10.62.00": {
    en: "Manufacture of starches and starch products",
    it: "Produzione di amidi e di prodotti amidacei",
  },
  "10.71.10": {
    en: "Manufacture of bread and similar products",
    it: "Produzione di pane e prodotti di panetteria simili",
  },
  "10.71.20": {
    en: "Manufacture of fresh pastry goods and cakes",
    it: "Produzione di prodotti di pasticceria freschi",
  },
  "10.72.00": {
    en: "Manufacture of rusks, biscuits, preserved pastries and cakes",
    it: "Produzione di fette biscottate, biscotti, prodotti di pasticceria conservati",
  },
  "10.73.01": {
    en: "Manufacture of fresh farinaceous products",
    it: "Produzione di prodotti farinacei freschi",
  },
  "10.73.02": {
    en: "Manufacture of preserved farinaceous products",
    it: "Produzione di prodotti farinacei conservati",
  },
  "10.81.00": {
    en: "Manufacture of sugar",
    it: "Produzione di zucchero",
  },
  "10.82.00": {
    en: "Manufacture of cocoa, chocolate and sugar confectionery",
    it: "Produzione di cacao, cioccolato, caramelle e confetterie",
  },
  "10.83.01": {
    en: "Processing of tea and other herb infusions",
    it: "Lavorazione di tè e di altri preparati per infusi",
  },
  "10.83.02": {
    en: "Processing of coffee",
    it: "Lavorazione di caffè",
  },
  "10.84.00": {
    en: "Manufacture of condiments and seasonings",
    it: "Produzione di condimenti e spezie",
  },
  "10.85.01": {
    en: "Manufacture of prepared meat or poultry meals and dishes",
    it: "Produzione di pasti e piatti preparati a base di carne, inclusi pasti e piatti preparati a base di carne di volatili",
  },
  "10.85.02": {
    en: "Manufacture of prepared fish meals and dishes",
    it: "Produzione di pasti e piatti preparati a base di pesce",
  },
  "10.85.03": {
    en: "Manufacture of prepared vegetable meals and dishes",
    it: "Produzione di pasti e piatti preparati a base di ortaggi",
  },
  "10.85.04": {
    en: "Manufacture of frozen or otherwise preserved pizza",
    it: "Produzione di pizza surgelata o altrimenti conservata",
  },
  "10.85.05": {
    en: "Manufacture of prepared pasta meals and dishes",
    it: "Produzione di pasti e piatti preparati a base di pasta",
  },
  "10.85.09": {
    en: "Manufacture of other prepared meals and dishes",
    it: "Produzione di altri pasti e piatti preparati",
  },
  "10.86.00": {
    en: "Manufacture of homogenised food preparations and dietetic food",
    it: "Produzione di preparati omogeneizzati e di alimenti dietetici",
  },
  "10.89.01": {
    en: "Manufacture of food supplements",
    it: "Produzione di integratori alimentari",
  },
  "10.89.09": {
    en: "Manufacture of other various food products n.e.c.",
    it: "Produzione di altri prodotti alimentari vari n.c.a.",
  },
  "10.91.00": {
    en: "Manufacture of prepared feeds for farm animals",
    it: "Produzione di mangimi per l'alimentazione degli animali da allevamento",
  },
  "10.92.00": {
    en: "Manufacture of prepared pet foods",
    it: "Produzione di prodotti per l'alimentazione degli animali da compagnia",
  },
  "11.01.00": {
    en: "Distilling, rectifying and blending of spirits",
    it: "Distillazione, rettifica e miscelatura di alcolici",
  },
  "11.02.10": {
    en: "Manufacture of wine of fresh grapes, other than sparkling wine and other special wines",
    it: "Produzione di vini, esclusi vini spumanti e altri vini speciali",
  },
  "11.02.20": {
    en: "Manufacture of sparkling wine and other special wines",
    it: "Produzione di vini spumanti e altri vini speciali",
  },
  "11.03.00": {
    en: "Manufacture of cider and other fermented fruit beverages",
    it: "Produzione di sidro e di altre bevande fermentate a base di frutta",
  },
  "11.04.00": {
    en: "Manufacture of other non-distilled fermented beverages",
    it: "Produzione di altre bevande fermentate non distillate",
  },
  "11.05.00": {
    en: "Manufacture of beer",
    it: "Produzione di birra",
  },
  "11.06.00": {
    en: "Manufacture of malt",
    it: "Produzione di malto",
  },
  "11.07.01": {
    en: "Manufacture of soft drinks",
    it: "Produzione di bibite analcoliche",
  },
  "11.07.02": {
    en: "Manufacture of bottled waters",
    it: "Produzione di acque in bottiglia",
  },
  "12.00.00": {
    en: "Manufacture of tobacco products",
    it: "Produzione di prodotti del tabacco",
  },
  "13.10.00": {
    en: "Preparation and spinning of textile fibres",
    it: "Preparazione e filatura di fibre tessili",
  },
  "13.20.00": {
    en: "Weaving of textiles",
    it: "Tessitura",
  },
  "13.30.00": {
    en: "Finishing of textiles",
    it: "Finissaggio dei tessili",
  },
  "13.91.00": {
    en: "Manufacture of knitted and crocheted fabrics",
    it: "Fabbricazione di tessuti a maglia e all'uncinetto",
  },
  "13.92.10": {
    en: "Manufacture of made-up household textiles articles",
    it: "Fabbricazione di tessili per la casa",
  },
  "13.92.20": {
    en: "Manufacture of made-up furnishing articles",
    it: "Fabbricazione di tessili per l'arredo",
  },
  "13.93.00": {
    en: "Manufacture of carpets and rugs",
    it: "Fabbricazione di tappeti e moquette",
  },
  "13.94.00": {
    en: "Manufacture of cordage, rope, twine and netting",
    it: "Fabbricazione di spago, corde, funi e reti",
  },
  "13.95.00": {
    en: "Manufacture of non-wovens and non-woven articles",
    it: "Fabbricazione di tessuti non-tessuti e di articoli in tessuto non-tessuto",
  },
  "13.96.00": {
    en: "Manufacture of other technical and industrial textiles",
    it: "Fabbricazione di altri tessuti per uso tecnico e industriale",
  },
  "13.99.10": {
    en: "Manufacture of tulles, lace and embroidery",
    it: "Fabbricazione di ricami, tulle, pizzi e merletti",
  },
  "13.99.90": {
    en: "Manufacture of felt and other various textile articles n.e.c.",
    it: "Fabbricazione di feltro e altri prodotti tessili diversi n.c.a.",
  },
  "14.10.10": {
    en: "Manufacture of knitted and crocheted hosiery",
    it: "Fabbricazione di articoli di calzetteria a maglia e all'uncinetto",
  },
  "14.10.20": {
    en: "Manufacture of pullovers, cardigans and other knitted and crocheted articles",
    it: "Fabbricazione di maglioni e altri articoli a maglia e all'uncinetto",
  },
  "14.21.10": {
    en: "Mass-manufacture of outerwear",
    it: "Fabbricazione in serie di abbigliamento esterno",
  },
  "14.21.20": {
    en: "Custom tailoring of outwear",
    it: "Sartoria e confezione su misura di abbigliamento esterno",
  },
  "14.22.00": {
    en: "Manufacture of underwear",
    it: "Fabbricazione di biancheria intima",
  },
  "14.23.00": {
    en: "Manufacture of workwear",
    it: "Fabbricazione di indumenti da lavoro",
  },
  "14.24.00": {
    en: "Manufacture of leather clothes and fur apparel",
    it: "Fabbricazione di abbigliamento in pelle e in pelliccia",
  },
  "14.29.00": {
    en: "Manufacture of other wearing apparel and accessories n.e.c.",
    it: "Fabbricazione di altri articoli di abbigliamento e accessori n.c.a.",
  },
  "15.11.00": {
    en: "Tanning, dressing, dyeing of leather and fur",
    it: "Concia, tintura e rifinizione di pelli, cuoi e pellicce",
  },
  "15.12.00": {
    en: "Manufacture of luggage, handbags, saddlery and harness of any material",
    it: "Fabbricazione di articoli da viaggio, borse, pelletteria e selleria di qualsiasi materiale",
  },
  "15.20.10": {
    en: "Manufacture of footwear, other than leather parts of footwear",
    it: "Fabbricazione di calzature, escluse parti in cuoio per calzature",
  },
  "15.20.20": {
    en: "Manufacture of leather parts of footwear",
    it: "Fabbricazione di parti in cuoio per calzature",
  },
  "16.11.00": {
    en: "Sawmilling and planing of wood",
    it: "Taglio e piallatura del legno",
  },
  "16.12.00": {
    en: "Processing and finishing of wood",
    it: "Lavorazione e finitura del legno",
  },
  "16.21.00": {
    en: "Manufacture of veneer sheets and wood-based panels",
    it: "Fabbricazione di fogli da impiallacciatura e di pannelli a base di legno",
  },
  "16.22.00": {
    en: "Manufacture of assembled parquet floors",
    it: "Fabbricazione di pavimenti di legno con elementi pre-assemblati",
  },
  "16.23.01": {
    en: "Manufacture of wooden stands and similar structures for conventions and trade shows",
    it: "Fabbricazione di stand e strutture simili in legno per convegni e fiere",
  },
  "16.23.09": {
    en: "Manufacture of other builders' carpentry and joinery n.e.c.",
    it: "Fabbricazione di altri prodotti di carpenteria in legno e falegnameria per l'edilizia n.c.a.",
  },
  "16.24.00": {
    en: "Manufacture of wooden containers",
    it: "Fabbricazione di imballaggi in legno",
  },
  "16.25.00": {
    en: "Manufacture of doors and windows of wood",
    it: "Fabbricazione di porte e finestre in legno",
  },
  "16.26.00": {
    en: "Manufacture of solid fuels from vegetable biomass",
    it: "Produzione di combustibili solidi da biomassa vegetale",
  },
  "16.27.00": {
    en: "Finishing of wooden products",
    it: "Finitura di prodotti in legno",
  },
  "16.28.11": {
    en: "Manufacture of frames",
    it: "Fabbricazione di cornici",
  },
  "16.28.19": {
    en: "Manufacture of other products of wood n.e.c.",
    it: "Fabbricazione di altri prodotti in legno n.c.a.",
  },
  "16.28.20": {
    en: "Manufacture of articles of cork materials",
    it: "Fabbricazione di articoli in sughero",
  },
  "16.28.30": {
    en: "Manufacture of straw and plaiting materials",
    it: "Fabbricazione di articoli in paglia e materiali da intreccio",
  },
  "17.11.00": {
    en: "Manufacture of pulp",
    it: "Fabbricazione di pasta-carta",
  },
  "17.12.00": {
    en: "Manufacture of paper and paperboard",
    it: "Fabbricazione di carta e cartone",
  },
  "17.21.00": {
    en: "Manufacture of corrugated paper, paperboard and containers of paper and paperboard",
    it: "Fabbricazione di carta, cartone ondulato e di imballaggi di carta e cartone",
  },
  "17.22.00": {
    en: "Manufacture of household and sanitary goods and of toilet requisites",
    it: "Fabbricazione di prodotti igienico-sanitari e per uso domestico in carta e ovatta di cellulosa",
  },
  "17.23.01": {
    en: "Manufacture of educational and commercial stationery",
    it: "Fabbricazione di prodotti cartotecnici scolastici e commerciali",
  },
  "17.23.09": {
    en: "Manufacture of other paper stationery",
    it: "Fabbricazione di altri prodotti cartotecnici",
  },
  "17.24.00": {
    en: "Manufacture of wallpaper",
    it: "Fabbricazione di carta da parati",
  },
  "17.25.00": {
    en: "Manufacture of other articles of paper and paperboard",
    it: "Fabbricazione di altri articoli di carta e cartone",
  },
  "18.11.00": {
    en: "Printing of newspapers",
    it: "Stampa di giornali",
  },
  "18.12.00": {
    en: "Other printing",
    it: "Altra stampa",
  },
  "18.13.00": {
    en: "Pre-press and pre-media services",
    it: "Lavorazioni preliminari alla stampa e ai media",
  },
  "18.14.00": {
    en: "Binding and related services",
    it: "Legatoria e servizi connessi",
  },
  "18.20.00": {
    en: "Reproduction of recorded media",
    it: "Riproduzione di supporti registrati",
  },
  "19.10.00": {
    en: "Manufacture of coke oven products",
    it: "Fabbricazione di prodotti di cokeria",
  },
  "19.20.10": {
    en: "Petroleum refining",
    it: "Raffinazione di petrolio",
  },
  "19.20.20": {
    en: "Manufacture of petroleum derivatives",
    it: "Fabbricazione di derivati del petrolio",
  },
  "19.20.30": {
    en: "Blending of LPG (Liquefied Petroleum Gases) and bottling",
    it: "Miscelazione di gas petroliferi liquefatti (GPL) e loro imbottigliamento",
  },
  "19.20.40": {
    en: "Manufacture of products for the manufacture of road coverings",
    it: "Fabbricazione di prodotti di base per la copertura stradale",
  },
  "19.20.90": {
    en: "Manufacture of other refined petroleum products and fossil fuel products",
    it: "Fabbricazione di altri prodotti derivanti dalla raffinazione del petrolio e prodotti da combustibili fossili",
  },
  "20.11.00": {
    en: "Manufacture of industrial gases",
    it: "Fabbricazione di gas industriali",
  },
  "20.12.00": {
    en: "Manufacture of dyes and pigments",
    it: "Fabbricazione di coloranti e pigmenti",
  },
  "20.13.00": {
    en: "Manufacture of other inorganic basic chemicals",
    it: "Fabbricazione di altri prodotti chimici di base inorganici",
  },
  "20.14.00": {
    en: "Manufacture of other organic basic chemicals",
    it: "Fabbricazione di altri prodotti chimici di base organici",
  },
  "20.15.00": {
    en: "Manufacture of fertilisers and nitrogen compounds",
    it: "Fabbricazione di fertilizzanti e composti azotati",
  },
  "20.16.00": {
    en: "Manufacture of plastics in primary forms",
    it: "Fabbricazione di materie plastiche in forme primarie",
  },
  "20.17.00": {
    en: "Manufacture of synthetic rubber in primary forms",
    it: "Fabbricazione di gomma sintetica in forme primarie",
  },
  "20.20.00": {
    en: "Manufacture of pesticides, disinfectants and other agrochemical products",
    it: "Fabbricazione di fitofarmaci, disinfettanti e altri prodotti chimici per l'agricoltura",
  },
  "20.30.00": {
    en: "Manufacture of paints, varnishes and similar coatings, printing ink and mastics",
    it: "Fabbricazione di pitture, vernici e smalti, inchiostri da stampa e adesivi sintetici",
  },
  "20.41.10": {
    en: "Manufacture of soap, detergents and surface-active preparations",
    it: "Fabbricazione di saponi, detergenti e preparazioni tensioattive",
  },
  "20.41.20": {
    en: "Manufacture of glycerol and other cleaning and polishing preparations",
    it: "Fabbricazione di glicerina e altri prodotti per la pulizia e la lucidatura",
  },
  "20.42.00": {
    en: "Manufacture of perfume and toilet preparations",
    it: "Fabbricazione di profumi e cosmetici",
  },
  "20.51.00": {
    en: "Manufacture of liquid biofuels",
    it: "Produzione di biocarburanti liquidi",
  },
  "20.59.11": {
    en: "Manufacture of matches",
    it: "Fabbricazione di fiammiferi",
  },
  "20.59.12": {
    en: "Manufacture of explosives",
    it: "Fabbricazione di articoli esplosivi",
  },
  "20.59.20": {
    en: "Manufacture of glues",
    it: "Fabbricazione di colle",
  },
  "20.59.30": {
    en: "Manufacture of essential oils",
    it: "Fabbricazione di oli essenziali",
  },
  "20.59.91": {
    en: "Manufacture of e-liquids used in vaping devices",
    it: "Fabbricazione di liquidi per inalazione per sigarette elettroniche",
  },
  "20.59.99": {
    en: "Manufacture of all other various chemical products n.e.c.",
    it: "Fabbricazione di tutti gli altri prodotti chimici vari n.c.a.",
  },
  "20.60.00": {
    en: "Manufacture of man-made fibres",
    it: "Fabbricazione di fibre sintetiche e artificiali",
  },
  "21.10.00": {
    en: "Manufacture of basic pharmaceutical products",
    it: "Fabbricazione di prodotti farmaceutici di base",
  },
  "21.20.01": {
    en: "Manufacture of radioactive in-vivo diagnostic substances",
    it: "Fabbricazione di sostanze diagnostiche radioattive in vivo",
  },
  "21.20.09": {
    en: "Manufacture of other pharmaceutical preparations",
    it: "Fabbricazione di medicinali e altri preparati farmaceutici",
  },
  "22.11.10": {
    en: "Manufacture of rubber tyres and manufacture of tubes",
    it: "Fabbricazione di pneumatici e camere d'aria",
  },
  "22.11.20": {
    en: "Retreading and rebuilding of rubber tyres",
    it: "Rigenerazione e ricostruzione di pneumatici",
  },
  "22.12.00": {
    en: "Manufacture of other rubber products",
    it: "Fabbricazione di altri prodotti in gomma",
  },
  "22.21.00": {
    en: "Manufacture of plastic plates, sheets, tubes and profiles",
    it: "Fabbricazione di lastre, fogli, tubi e profilati in materie plastiche",
  },
  "22.22.00": {
    en: "Manufacture of plastic packing goods",
    it: "Fabbricazione di imballaggi in materie plastiche",
  },
  "22.23.00": {
    en: "Manufacture of doors and windows of plastic",
    it: "Fabbricazione di porte e finestre in materie plastiche",
  },
  "22.24.01": {
    en: "Manufacture of wall and floor coverings of plastic",
    it: "Fabbricazione di rivestimenti per pareti e pavimenti in materie plastiche",
  },
  "22.24.09": {
    en: "Manufacture of other builders' ware of plastic",
    it: "Fabbricazione di altri articoli in materie plastiche per l'edilizia",
  },
  "22.25.00": {
    en: "Processing and finishing of plastic products",
    it: "Lavorazione e finitura di prodotti in materie plastiche",
  },
  "22.26.11": {
    en: "Manufacture of plastic equipment for cleaning for domestic use",
    it: "Fabbricazione di articoli e attrezzature per la pulizia per uso domestico in materie plastiche",
  },
  "22.26.12": {
    en: "Manufacture of plastic equipment for cleaning for non-domestic use",
    it: "Fabbricazione di articoli e attrezzature per la pulizia per uso non domestico in materie plastiche",
  },
  "22.26.91": {
    en: "Manufacture of plastic office and school supplies",
    it: "Fabbricazione di articoli per l'ufficio e la scuola in materie plastiche",
  },
  "22.26.99": {
    en: "Manufacture of other various plastic products n.e.c.",
    it: "Fabbricazione di altri prodotti vari in materie plastiche n.c.a.",
  },
  "23.11.00": {
    en: "Manufacture of flat glass",
    it: "Fabbricazione di vetro piano",
  },
  "23.12.00": {
    en: "Shaping and processing of flat glass",
    it: "Lavorazione e trasformazione del vetro piano",
  },
  "23.13.00": {
    en: "Manufacture of hollow glass",
    it: "Fabbricazione di vetro cavo",
  },
  "23.14.00": {
    en: "Manufacture of glass fibres",
    it: "Fabbricazione di fibre di vetro",
  },
  "23.15.10": {
    en: "Glass blowing",
    it: "Lavorazione di vetro a mano e a soffio artistico",
  },
  "23.15.90": {
    en: "Other manufacture and processing of other glass, including technical glassware",
    it: "Altre attività di fabbricazione e lavorazione di altro vetro incluso il vetro per usi tecnici",
  },
  "23.20.00": {
    en: "Manufacture of refractory products",
    it: "Fabbricazione di prodotti refrattari",
  },
  "23.31.00": {
    en: "Manufacture of ceramic tiles and flags",
    it: "Fabbricazione di piastrelle in ceramica per pavimenti e rivestimenti",
  },
  "23.32.00": {
    en: "Manufacture of bricks, tiles and construction products, in baked clay",
    it: "Fabbricazione di mattoni, tegole e altri prodotti per l'edilizia in terracotta",
  },
  "23.41.00": {
    en: "Manufacture of ceramic household and ornamental articles",
    it: "Fabbricazione di prodotti in ceramica per usi domestici e ornamentali",
  },
  "23.42.00": {
    en: "Manufacture of ceramic sanitary fixtures",
    it: "Fabbricazione di articoli sanitari in ceramica",
  },
  "23.43.00": {
    en: "Manufacture of ceramic insulators and insulating fittings",
    it: "Fabbricazione di isolatori e di pezzi isolanti in ceramica",
  },
  "23.44.00": {
    en: "Manufacture of other technical ceramic products",
    it: "Fabbricazione di altri prodotti in ceramica per uso tecnico e industriale",
  },
  "23.45.00": {
    en: "Manufacture of other ceramic products",
    it: "Fabbricazione di altri prodotti in ceramica",
  },
  "23.51.00": {
    en: "Manufacture of cement",
    it: "Produzione di cemento",
  },
  "23.52.10": {
    en: "Manufacture of lime",
    it: "Produzione di calce",
  },
  "23.52.20": {
    en: "Manufacture of plaster",
    it: "Produzione di gesso",
  },
  "23.61.01": {
    en: "Manufacture of prefabricated concrete pipes for drinking water",
    it: "Fabbricazione di tubi prefabbricati in calcestruzzo per acqua potabile",
  },
  "23.61.02": {
    en: "Manufacture of prefabricated concrete fireplaces",
    it: "Fabbricazione di caminetti prefabbricati in calcestruzzo",
  },
  "23.61.03": {
    en: "Manufacture of precast concrete articles for construction purposes",
    it: "Fabbricazione di elementi prefabbricati in calcestruzzo per l'edilizia",
  },
  "23.61.04": {
    en: "Manufacture of prefabricated concrete structures for construction purposes",
    it: "Fabbricazione di strutture prefabbricate in calcestruzzo per l'edilizia",
  },
  "23.61.09": {
    en: "Manufacture of concrete products for construction purposes n.e.c.",
    it: "Fabbricazione di prodotti in calcestruzzo per l'edilizia n.c.a.",
  },
  "23.62.00": {
    en: "Manufacture of plaster products for construction purposes",
    it: "Fabbricazione di prodotti in gesso per l'edilizia",
  },
  "23.63.00": {
    en: "Manufacture of ready-mixed concrete",
    it: "Produzione di calcestruzzo pronto per l'uso",
  },
  "23.64.00": {
    en: "Manufacture of mortars",
    it: "Produzione di malta",
  },
  "23.65.01": {
    en: "Manufacture of products of vegetable substances agglomerated with cement, plaster or other mineral binder",
    it: "Fabbricazione di prodotti in sostanze vegetali agglomerate con cemento, gesso o altri leganti minerali",
  },
  "23.65.02": {
    en: "Manufacture of articles of asbestos-cement or cellulose fibre-cement",
    it: "Fabbricazione di prodotti in asbesto-cemento o cellulosa fibrocemento",
  },
  "23.66.01": {
    en: "Manufacture of statuary, bas- and haut-reliefs, vases, flowerpots",
    it: "Fabbricazione di statue, bassorilievi e altorilievi, vasi e fioriere",
  },
  "23.66.09": {
    en: "Manufacture of other articles of concrete, cement and plaster n.e.c.",
    it: "Fabbricazione di altri prodotti in calcestruzzo, cemento e gesso n.c.a.",
  },
  "23.70.10": {
    en: "Cutting and processing of stone and marble",
    it: "Taglio e lavorazione di pietre e di marmo",
  },
  "23.70.20": {
    en: "Shaping and finishing of stone and marble",
    it: "Lavorazione artistica di marmo e di altre pietre affini",
  },
  "23.70.30": {
    en: "Crushing of stone",
    it: "Frantumazione di pietre",
  },
  "23.91.00": {
    en: "Manufacture of abrasive products",
    it: "Fabbricazione di prodotti abrasivi",
  },
  "23.99.00": {
    en: "Manufacture of other non-metallic mineral products n.e.c.",
    it: "Fabbricazione di altri prodotti in minerali non metalliferi n.c.a.",
  },
  "24.10.00": {
    en: "Manufacture of basic iron and steel and of ferro-alloys",
    it: "Fabbricazione di ferro, acciaio e ferroleghe",
  },
  "24.20.10": {
    en: "Manufacture of seamless tubes, pipes, hollow profiles and related fittings, of steel",
    it: "Fabbricazione di tubi, condotti, profilati cavi non saldati e relativi raccordi in acciaio",
  },
  "24.20.20": {
    en: "Manufacture of welded tubes, pipes, hollow profiles and related fittings, of steel",
    it: "Fabbricazione di tubi, condotti, profilati cavi saldati e relativi raccordi in acciaio",
  },
  "24.31.00": {
    en: "Cold drawing of bars",
    it: "Trafilatura a freddo di barre",
  },
  "24.32.00": {
    en: "Cold rolling of narrow strip",
    it: "Laminazione a freddo di nastri",
  },
  "24.33.01": {
    en: "Manufacture of open sections and ribbed sheets",
    it: "Profilatura mediante formatura o piegatura a freddo di profilati aperti e lamiere grecate",
  },
  "24.33.02": {
    en: "Manufacture of sandwich panels",
    it: "Profilatura mediante formatura o piegatura a freddo di pannelli stratificati",
  },
  "24.33.03": {
    en: "Pre-shaping of reinforcing steel and similar activities",
    it: "Presagomatura dell'acciaio per cemento armato e attività simili",
  },
  "24.34.00": {
    en: "Cold drawing of wire",
    it: "Trafilatura a freddo di fili",
  },
  "24.41.00": {
    en: "Precious metals production",
    it: "Produzione di metalli preziosi",
  },
  "24.42.00": {
    en: "Aluminium production",
    it: "Produzione di alluminio",
  },
  "24.43.00": {
    en: "Lead, zinc and tin production",
    it: "Produzione di piombo, zinco e stagno",
  },
  "24.44.00": {
    en: "Copper production",
    it: "Produzione di rame",
  },
  "24.45.00": {
    en: "Other non-ferrous metal production",
    it: "Produzione di altri metalli non ferrosi",
  },
  "24.46.00": {
    en: "Processing of nuclear fuel",
    it: "Trattamento di combustibili nucleari",
  },
  "24.51.01": {
    en: "Casting of grey iron",
    it: "Fusione di getti in ghisa grigia o lamellare",
  },
  "24.51.02": {
    en: "Casting of ductile iron",
    it: "Fusione di getti in ghisa duttile",
  },
  "24.51.09": {
    en: "Casting of iron n.e.c.",
    it: "Fusione di getti in ghisa n.c.a.",
  },
  "24.52.00": {
    en: "Casting of steel",
    it: "Fusione di getti in acciaio",
  },
  "24.53.01": {
    en: "Casting of aluminium",
    it: "Fusione di getti in alluminio",
  },
  "24.53.02": {
    en: "Casting of magnesium",
    it: "Fusione di getti in magnesio",
  },
  "24.53.03": {
    en: "Casting of cobalt",
    it: "Fusione di getti in superleghe a base cobalto",
  },
  "24.53.09": {
    en: "Casting of light metals n.e.c.",
    it: "Fusione di getti in metalli leggeri n.c.a.",
  },
  "24.54.01": {
    en: "Casting of copper",
    it: "Fusione di getti in rame",
  },
  "24.54.02": {
    en: "Casting of zinc",
    it: "Fusione di getti in zinco",
  },
  "24.54.03": {
    en: "Casting of nickel",
    it: "Fusione di getti in nichel",
  },
  "24.54.09": {
    en: "Casting of other non-ferrous metals n.e.c.",
    it: "Fusione di getti in altri metalli non ferrosi n.c.a.",
  },
  "25.11.00": {
    en: "Manufacture of metal structures and parts of structures",
    it: "Fabbricazione di strutture metalliche e di parti di strutture metalliche",
  },
  "25.12.10": {
    en: "Manufacture of metal doors, windows and their frames, shutters and gates",
    it: "Fabbricazione di porte, finestre e loro telai, imposte e cancelli in metallo",
  },
  "25.12.20": {
    en: "Manufacture of metal blinds and similar products",
    it: "Fabbricazione di tende in metallo e prodotti simili",
  },
  "25.21.10": {
    en: "Manufacture of central heating radiators and boilers",
    it: "Fabbricazione di radiatori e contenitori in metallo per caldaie per il riscaldamento centrale",
  },
  "25.21.20": {
    en: "Manufacture of steam generators",
    it: "Fabbricazione di generatori di vapore",
  },
  "25.22.00": {
    en: "Manufacture of other tanks, reservoirs and containers of metal",
    it: "Fabbricazione di altre cisterne, serbatoi e contenitori in metallo",
  },
  "25.30.10": {
    en: "Manufacture of military weapons and ammunition",
    it: "Fabbricazione di armi e munizioni per uso militare",
  },
  "25.30.20": {
    en: "Manufacture of sporting and civilian firearms and ammunition",
    it: "Fabbricazione di armi e munizioni per uso sportivo e civile",
  },
  "25.40.00": {
    en: "Forging and shaping metal and powder metallurgy",
    it: "Fucinatura e formatura dei metalli e metallurgia delle polveri",
  },
  "25.51.00": {
    en: "Coating of metals",
    it: "Rivestimento dei metalli",
  },
  "25.52.00": {
    en: "Heat treatment of metals",
    it: "Trattamento termico dei metalli",
  },
  "25.53.00": {
    en: "Machining of metals",
    it: "Lavori di meccanica generale dei metalli",
  },
  "25.61.00": {
    en: "Manufacture of cutlery",
    it: "Fabbricazione di articoli di coltelleria e posateria",
  },
  "25.62.00": {
    en: "Manufacture of locks and hinges",
    it: "Fabbricazione di serrature e cerniere",
  },
  "25.63.11": {
    en: "Manufacture of hand tools",
    it: "Fabbricazione di utensileria ad azionamento manuale",
  },
  "25.63.12": {
    en: "Manufacture of interchangeable tools",
    it: "Fabbricazione di parti intercambiabili per macchine utensili",
  },
  "25.63.20": {
    en: "Manufacture of moulding boxes and moulds",
    it: "Fabbricazione di stampi, portastampi, sagome, forme per macchine",
  },
  "25.91.00": {
    en: "Manufacture of steel drums and similar containers",
    it: "Fabbricazione di bidoni in acciaio e di contenitori simili",
  },
  "25.92.00": {
    en: "Manufacture of light metal packaging",
    it: "Fabbricazione di imballaggi in metallo leggero",
  },
  "25.93.10": {
    en: "Manufacture of wire products",
    it: "Fabbricazione di prodotti fabbricati con fili metallici",
  },
  "25.93.20": {
    en: "Manufacture of chain",
    it: "Fabbricazione di catene",
  },
  "25.93.30": {
    en: "Manufacture of springs",
    it: "Fabbricazione di molle",
  },
  "25.94.00": {
    en: "Manufacture of fasteners and screw machine products",
    it: "Fabbricazione di articoli di bulloneria",
  },
  "25.99.10": {
    en: "Manufacture of metal household articles for bathroom and kitchen",
    it: "Fabbricazione di articoli domestici in metallo per la cucina e le stanze da bagno",
  },
  "25.99.20": {
    en: "Manufacture of safes, strongboxes and metal armoured doors",
    it: "Fabbricazione di casseforti, cassette di sicurezza e porte metalliche blindate",
  },
  "25.99.90": {
    en: "Manufacture of other various fabricated metal products n.e.c.",
    it: "Fabbricazione di altri prodotti vari in metallo n.c.a.",
  },
  "26.11.00": {
    en: "Manufacture of electronic components",
    it: "Fabbricazione di componenti elettronici",
  },
  "26.12.00": {
    en: "Manufacture of loaded electronic boards",
    it: "Fabbricazione di schede elettroniche integrate",
  },
  "26.20.00": {
    en: "Manufacture of computers and peripheral equipment",
    it: "Fabbricazione di computer e unità periferiche",
  },
  "26.30.01": {
    en: "Manufacture of radio and television studio and broadcasting equipment",
    it: "Fabbricazione di apparecchiature trasmittenti radiotelevisive",
  },
  "26.30.09": {
    en: "Manufacture of other communication equipment",
    it: "Fabbricazione di altre apparecchiature per le comunicazioni",
  },
  "26.40.01": {
    en: "Manufacture of video game consoles",
    it: "Fabbricazione di console per videogiochi",
  },
  "26.40.09": {
    en: "Manufacture of other consumer electronics",
    it: "Fabbricazione di altri prodotti di elettronica di consumo",
  },
  "26.51.10": {
    en: "Manufacture of instruments and appliances for navigation, hydrology, geophysics and meteorology",
    it: "Fabbricazione di strumenti per navigazione, idrologia, geofisica e meteorologia",
  },
  "26.51.21": {
    en: "Manufacture of burglar and fire alarm systems",
    it: "Fabbricazione di sistemi antifurto e antincendio",
  },
  "26.51.29": {
    en: "Manufacture of other instruments and appliances for measuring and testing n.e.c.",
    it: "Fabbricazione di altri strumenti e apparecchi di misurazione e prova n.c.a.",
  },
  "26.52.00": {
    en: "Manufacture of watches and clocks",
    it: "Fabbricazione di orologi",
  },
  "26.60.01": {
    en: "Manufacture of medical irradiation, electromedical and electrotherapeutic equipment",
    it: "Fabbricazione di apparecchiature per irradiazione, elettromedicali ed elettroterapeutiche per usi medici",
  },
  "26.60.02": {
    en: "Manufacture of non-medical irradiation, electromedical and electrotherapeutic equipment",
    it: "Fabbricazione di apparecchiature per irradiazione, elettromedicali ed elettroterapeutiche per usi non medici",
  },
  "26.70.11": {
    en: "Manufacture of optical instruments and optical precision tools",
    it: "Fabbricazione di strumenti ottici e strumenti ottici di precisione",
  },
  "26.70.12": {
    en: "Manufacture of optical measuring and checking devices and instruments",
    it: "Fabbricazione di strumenti ottici di misurazione e controllo",
  },
  "26.70.20": {
    en: "Manufacture of magnetic and optical media",
    it: "Fabbricazione di supporti magnetici e ottici",
  },
  "26.70.30": {
    en: "Manufacture of photographic equipment",
    it: "Fabbricazione di apparecchiature fotografiche",
  },
  "27.11.00": {
    en: "Manufacture of electric motors, generators and transformers",
    it: "Fabbricazione di motori, generatori e trasformatori elettrici",
  },
  "27.12.00": {
    en: "Manufacture of electricity distribution and control apparatus",
    it: "Fabbricazione di apparecchiature per la distribuzione e il controllo dell'elettricità",
  },
  "27.20.00": {
    en: "Manufacture of batteries and accumulators",
    it: "Fabbricazione di batterie e accumulatori",
  },
  "27.31.00": {
    en: "Manufacture of fibre optic cables",
    it: "Fabbricazione di cavi in fibra ottica",
  },
  "27.32.00": {
    en: "Manufacture of other electronic and electric wires and cables",
    it: "Fabbricazione di altri fili e cavi elettronici ed elettrici",
  },
  "27.33.00": {
    en: "Manufacture of wiring devices",
    it: "Fabbricazione di attrezzature per cablaggio",
  },
  "27.40.01": {
    en: "Manufacture of lighting equipment for transportation equipment",
    it: "Fabbricazione di apparecchiature per l'illuminazione per mezzi di trasporto",
  },
  "27.40.02": {
    en: "Manufacture of festive illuminations",
    it: "Fabbricazione di luminarie per feste",
  },
  "27.40.09": {
    en: "Manufacture of other lighting equipment",
    it: "Fabbricazione di altre apparecchiature per l'illuminazione",
  },
  "27.51.00": {
    en: "Manufacture of electric domestic appliances",
    it: "Fabbricazione di elettrodomestici",
  },
  "27.52.00": {
    en: "Manufacture of non-electric domestic appliances",
    it: "Fabbricazione di apparecchi non elettrici per uso domestico",
  },
  "27.90.01": {
    en: "Manufacture of electrical welding and soldering equipment",
    it: "Fabbricazione di apparecchiature elettriche per saldatura e brasatura",
  },
  "27.90.02": {
    en: "Manufacture of electrical signs and electrical signalling equipment",
    it: "Fabbricazione di insegne elettriche e apparecchiature elettriche di segnalazione",
  },
  "27.90.03": {
    en: "Manufacture of electrical capacitors, resistors, condensers and similar components",
    it: "Fabbricazione di capacitori, resistenze, condensatori elettrici e simili",
  },
  "27.90.04": {
    en: "Manufacture of electrical equipment for hairdressers, solariums and beauty centres",
    it: "Fabbricazione di apparecchiature elettriche per parrucchieri, solarium e centri estetici",
  },
  "27.90.09": {
    en: "Manufacture of other electrical equipment n.e.c.",
    it: "Fabbricazione di altre apparecchiature elettriche n.c.a.",
  },
  "28.11.10": {
    en: "Manufacture of engines, except aircraft, vehicle and cycle engines",
    it: "Fabbricazione di motori, esclusi motori per aeromobili, veicoli e motocicli",
  },
  "28.11.20": {
    en: "Manufacture of turbines",
    it: "Fabbricazione di turbine",
  },
  "28.12.00": {
    en: "Manufacture of fluid power equipment",
    it: "Fabbricazione di apparecchiature fluidodinamiche",
  },
  "28.13.00": {
    en: "Manufacture of other pumps and compressors",
    it: "Fabbricazione di altre pompe e compressori",
  },
  "28.14.00": {
    en: "Manufacture of other taps and valves",
    it: "Fabbricazione di altri rubinetti e valvole",
  },
  "28.15.00": {
    en: "Manufacture of bearings, gears, gearing and driving elements",
    it: "Fabbricazione di cuscinetti, ingranaggi e organi di trasmissione",
  },
  "28.21.10": {
    en: "Manufacture of ovens and furnaces",
    it: "Fabbricazione di forni",
  },
  "28.21.20": {
    en: "Manufacture of permanent household heating equipment",
    it: "Fabbricazione di caldaie e apparecchiature fisse per il riscaldamento domestico",
  },
  "28.22.01": {
    en: "Manufacture of lifts, escalators and moving walkways",
    it: "Fabbricazione di ascensori, scale mobili e tappeti mobili",
  },
  "28.22.09": {
    en: "Manufacture of other lifting and handling equipment",
    it: "Fabbricazione di altri apparecchi di sollevamento e movimentazione",
  },
  "28.23.00": {
    en: "Manufacture of office machinery and equipment, except computers and peripheral equipment",
    it: "Fabbricazione di macchine e attrezzature per ufficio, esclusi computer e unità periferiche",
  },
  "28.24.00": {
    en: "Manufacture of power-driven hand tools",
    it: "Fabbricazione di utensili portatili a motore",
  },
  "28.25.00": {
    en: "Manufacture of non-domestic air conditioning equipment",
    it: "Fabbricazione di apparecchiature di climatizzazione per uso non domestico",
  },
  "28.29.10": {
    en: "Manufacture of weighing machinery and automatic goods vending machines",
    it: "Fabbricazione di bilance e distributori automatici",
  },
  "28.29.20": {
    en: "Manufacture of distilling or rectifying plant for petroleum refineries and chemical industries",
    it: "Fabbricazione di impianti di distillazione o rettificazione per raffinerie di petrolio e industrie chimiche",
  },
  "28.29.30": {
    en: "Manufacture of packing and wrapping machinery",
    it: "Fabbricazione di macchine per la dosatura, la confezione e per l'imballaggio",
  },
  "28.29.41": {
    en: "Manufacture of cleaning machines for cleaning floors, surfaces and rooms for non-domestic use",
    it: "Fabbricazione di macchine per la pulizia di pavimenti, superfici e ambienti per uso non domestico",
  },
  "28.29.49": {
    en: "Manufacture of other cleaning machines for non-domestic use",
    it: "Fabbricazione di altre macchine per la pulizia per uso non domestico",
  },
  "28.29.91": {
    en: "Manufacture of filtering or purifying machinery and apparatus for liquids",
    it: "Fabbricazione di apparecchi per depurare e filtrare liquidi",
  },
  "28.29.92": {
    en: "Manufacture of levels, tape measures and similar hand tools, machinists' precision tools",
    it: "Fabbricazione di livelle, metri doppi a nastro e utensili simili, strumenti di precisione per meccanica",
  },
  "28.29.99": {
    en: "Manufacture of other various general-purpose machinery n.e.c.",
    it: "Fabbricazione di altre macchine varie di impiego generale n.c.a.",
  },
  "28.30.10": {
    en: "Manufacture of agriculture and forestry tractors",
    it: "Fabbricazione di trattori per l'agricoltura e la silvicoltura",
  },
  "28.30.91": {
    en: "Manufacture of gardening and landscaping machinery",
    it: "Fabbricazione di macchine per il giardinaggio e la cura del verde",
  },
  "28.30.99": {
    en: "Manufacture of other agricultural and forestry machinery n.e.c.",
    it: "Fabbricazione di altre macchine per l'agricoltura e la silvicoltura n.c.a.",
  },
  "28.41.00": {
    en: "Manufacture of metal forming machinery and machine tools for metal work",
    it: "Fabbricazione di macchine per la deformazione dei metalli e di altre macchine utensili per la lavorazione dei metalli",
  },
  "28.42.00": {
    en: "Manufacture of other machine tools",
    it: "Fabbricazione di altre macchine utensili",
  },
  "28.91.00": {
    en: "Manufacture of machinery for metallurgy",
    it: "Fabbricazione di macchine per la metallurgia",
  },
  "28.92.00": {
    en: "Manufacture of machinery for mining, quarrying and construction",
    it: "Fabbricazione di macchine da miniera, cava e cantiere",
  },
  "28.93.00": {
    en: "Manufacture of machinery for food, beverage and tobacco processing",
    it: "Fabbricazione di macchine per l'industria alimentare, delle bevande e del tabacco",
  },
  "28.94.10": {
    en: "Manufacture of textile machinery",
    it: "Fabbricazione di macchine tessili",
  },
  "28.94.20": {
    en: "Manufacture of leather machinery",
    it: "Fabbricazione di macchine per la lavorazione delle pelli e del cuoio",
  },
  "28.94.30": {
    en: "Manufacture of laundry machinery",
    it: "Fabbricazione di macchine per lavanderie e stirerie",
  },
  "28.95.00": {
    en: "Manufacture of machinery for paper and paperboard production",
    it: "Fabbricazione di macchine per l'industria della carta e del cartone",
  },
  "28.96.00": {
    en: "Manufacture of plastics and rubber machinery",
    it: "Fabbricazione di macchine per l'industria delle materie plastiche e della gomma",
  },
  "28.97.01": {
    en: "Manufacture of additive manufacturing machinery by metal deposit",
    it: "Fabbricazione di macchine per la produzione additiva per deposizione di materiali metallici",
  },
  "28.97.02": {
    en: "Manufacture of additive manufacturing machinery by plastics or rubber deposit",
    it: "Fabbricazione di macchine per la produzione additiva per deposizione di materie plastiche o di gomma",
  },
  "28.97.09": {
    en: "Manufacture of additive manufacturing machinery n.e.c.",
    it: "Fabbricazione di macchine per la produzione additiva n.c.a.",
  },
  "28.99.10": {
    en: "Manufacture of printing and bookbinding machines",
    it: "Fabbricazione di macchine per la stampa e la legatoria",
  },
  "28.99.20": {
    en: "Manufacture of industrial robots for multiple uses",
    it: "Fabbricazione di robot industriali con compiti multipli per scopi speciali",
  },
  "28.99.91": {
    en: "Manufacture of aircraft launching gear, aircraft carrier catapults and related equipment",
    it: "Fabbricazione di apparecchiature per il lancio di aeromobili, catapulte per portaerei e relative attrezzature",
  },
  "28.99.92": {
    en: "Manufacture of roundabouts, swings and other fairground amusements",
    it: "Fabbricazione di giostre, altalene e altre attrazioni di divertimento",
  },
  "28.99.93": {
    en: "Manufacture of tyre alignment and balancing equipment and other balancing equipment",
    it: "Fabbricazione di apparecchiature per l'allineamento e il bilanciamento delle ruote e altre apparecchiature per il bilanciamento",
  },
  "28.99.99": {
    en: "Manufacture of all other various special-purpose machinery n.e.c.",
    it: "Fabbricazione di tutte le altre macchine varie per impieghi speciali n.c.a.",
  },
  "29.10.00": {
    en: "Manufacture of motor vehicles",
    it: "Fabbricazione di autoveicoli",
  },
  "29.20.00": {
    en: "Manufacture of bodies and coachwork for motor vehicles; manufacture of trailers and semi-trailers",
    it: "Fabbricazione di carrozzerie per autoveicoli; fabbricazione di rimorchi e semirimorchi",
  },
  "29.31.00": {
    en: "Manufacture of electrical and electronic equipment for motor vehicles",
    it: "Fabbricazione di apparecchiature elettriche ed elettroniche per autoveicoli",
  },
  "29.32.00": {
    en: "Manufacture of other parts and accessories for motor vehicles",
    it: "Fabbricazione di altre parti e accessori per autoveicoli",
  },
  "30.11.00": {
    en: "Building of civilian ships and floating structures",
    it: "Costruzione di navi e di strutture galleggianti per scopi civili",
  },
  "30.12.00": {
    en: "Building of pleasure and sporting boats",
    it: "Costruzione di imbarcazioni da diporto e sportive",
  },
  "30.13.00": {
    en: "Building of military ships and vessels",
    it: "Costruzione di navi e imbarcazioni per scopi militari",
  },
  "30.20.00": {
    en: "Manufacture of railway locomotives and rolling stock",
    it: "Costruzione di locomotive e di materiale rotabile ferro-tranviario",
  },
  "30.31.00": {
    en: "Manufacture of civilian air and spacecraft and related machinery",
    it: "Fabbricazione di aeromobili, veicoli spaziali e relativi equipaggiamenti per scopi civili",
  },
  "30.32.00": {
    en: "Manufacture of military air and spacecraft and related machinery",
    it: "Fabbricazione di aeromobili, veicoli spaziali e relativi equipaggiamenti per scopi militari",
  },
  "30.40.00": {
    en: "Manufacture of military fighting vehicles",
    it: "Fabbricazione di veicoli militari da combattimento",
  },
  "30.91.11": {
    en: "Manufacture of engines for motorcycles",
    it: "Fabbricazione di motori per motocicli",
  },
  "30.91.12": {
    en: "Manufacture of motorcycles, other than engines",
    it: "Fabbricazione di motocicli, esclusi motori",
  },
  "30.91.20": {
    en: "Manufacture of parts and accessories for motorcycles",
    it: "Fabbricazione di parti e accessori per motocicli",
  },
  "30.92.10": {
    en: "Manufacture of bicycles, other than parts and accessories",
    it: "Fabbricazione di biciclette, escluse parti e accessori",
  },
  "30.92.20": {
    en: "Manufacture of parts and accessories for bicycles",
    it: "Fabbricazione di parti e accessori per biciclette",
  },
  "30.92.30": {
    en: "Manufacture of invalid carriages",
    it: "Fabbricazione di veicoli per disabili",
  },
  "30.92.40": {
    en: "Manufacture of baby carriages",
    it: "Fabbricazione di carrozzine e passeggini",
  },
  "30.99.00": {
    en: "Manufacture of other transport equipment n.e.c.",
    it: "Fabbricazione di altri mezzi di trasporto n.c.a.",
  },
  "31.00.11": {
    en: "Manufacture of acoustic absorbing furniture for shops, offices and other similar places",
    it: "Fabbricazione di moduli dedicati al comfort acustico per negozi, uffici e altri spazi per collettività",
  },
  "31.00.12": {
    en: "Manufacture of chairs and seats for shops",
    it: "Fabbricazione di sedie e poltrone per negozi",
  },
  "31.00.13": {
    en: "Manufacture of furniture for shops other than chairs and seats",
    it: "Fabbricazione di altri mobili per negozi",
  },
  "31.00.14": {
    en: "Manufacture of chairs and seats for offices and other similar places",
    it: "Fabbricazione di sedie e poltrone per uffici e altri spazi per collettività",
  },
  "31.00.15": {
    en: "Manufacture of furniture for offices and other similar places other than chairs and seats",
    it: "Fabbricazione di altri mobili per uffici e altri spazi per collettività",
  },
  "31.00.20": {
    en: "Manufacture of kitchen furniture",
    it: "Fabbricazione di mobili da cucina",
  },
  "31.00.31": {
    en: "Manufacture of home furniture, excluding kitchen furniture, chairs, sofas and similar products",
    it: "Fabbricazione di mobili per arredo interno, esclusi mobili da cucina, sedie, divani e prodotti simili",
  },
  "31.00.32": {
    en: "Manufacture of outdoor furniture",
    it: "Fabbricazione di mobili per arredo esterno",
  },
  "31.00.33": {
    en: "Manufacture of chairs and seats",
    it: "Fabbricazione di sedie e sedili",
  },
  "31.00.34": {
    en: "Manufacture of sofas, sofa beds and sofa sets",
    it: "Fabbricazione di divani, divani letto e poltrone",
  },
  "31.00.35": {
    en: "Manufacture of mattresses",
    it: "Fabbricazione di materassi",
  },
  "31.00.36": {
    en: "Manufacture of furniture parts and accessories",
    it: "Fabbricazione di parti e accessori di mobili",
  },
  "31.00.37": {
    en: "Finishing of furniture",
    it: "Finitura di mobili",
  },
  "31.00.39": {
    en: "Manufacture of other furniture n.e.c.",
    it: "Fabbricazione di altri mobili n.c.a.",
  },
  "32.11.00": {
    en: "Striking of coins",
    it: "Coniazione di monete",
  },
  "32.12.10": {
    en: "Production of precious and semi-precious stones in the worked state",
    it: "Lavorazione di pietre preziose e semipreziose",
  },
  "32.12.20": {
    en: "Manufacture of jewellery and goldsmiths' articles of precious metals",
    it: "Fabbricazione di gioielli e articoli di oreficeria in metalli preziosi",
  },
  "32.13.00": {
    en: "Manufacture of imitation jewellery and related articles",
    it: "Fabbricazione di bigiotteria e articoli simili",
  },
  "32.20.00": {
    en: "Manufacture of musical instruments",
    it: "Fabbricazione di strumenti musicali",
  },
  "32.30.01": {
    en: "Manufacture of gymnasium, fitness centre or athletic equipment",
    it: "Fabbricazione di attrezzature da palestra, per centri di fitness e per atletica",
  },
  "32.30.09": {
    en: "Manufacture of other sports goods",
    it: "Fabbricazione di altri articoli sportivi",
  },
  "32.40.10": {
    en: "Manufacture of games",
    it: "Fabbricazione di giochi",
  },
  "32.40.20": {
    en: "Manufacture of toys",
    it: "Fabbricazione di giocattoli",
  },
  "32.50.10": {
    en: "Manufacture of dentures",
    it: "Fabbricazione di protesi dentarie",
  },
  "32.50.20": {
    en: "Manufacture of other prosthetic devices and aids",
    it: "Fabbricazione di altre protesi e ausili",
  },
  "32.50.30": {
    en: "Manufacture of ophthalmic lenses",
    it: "Fabbricazione di lenti oftalmiche",
  },
  "32.50.40": {
    en: "Manufacture of eyeglass frames",
    it: "Fabbricazione di montature per occhiali",
  },
  "32.50.51": {
    en: "Manufacture of medical and dental instruments and appliances",
    it: "Fabbricazione di strumenti e apparecchiature mediche e dentistiche",
  },
  "32.50.52": {
    en: "Manufacture of medical and dental supplies",
    it: "Fabbricazione di forniture mediche e dentistiche",
  },
  "32.50.53": {
    en: "Manufacture of medical and dental furniture",
    it: "Fabbricazione di mobili per uso medico e dentistico",
  },
  "32.91.00": {
    en: "Manufacture of brooms and brushes",
    it: "Fabbricazione di scope e spazzole",
  },
  "32.99.10": {
    en: "Manufacture of protective safety equipment",
    it: "Fabbricazione di dispositivi protettivi di sicurezza",
  },
  "32.99.20": {
    en: "Manufacture of umbrellas, buttons, zippers, wigs and similar articles",
    it: "Fabbricazione di ombrelli, bottoni, chiusure lampo, parrucche e affini",
  },
  "32.99.30": {
    en: "Manufacture of stationery articles",
    it: "Fabbricazione di articoli di cancelleria",
  },
  "32.99.40": {
    en: "Manufacture of burial coffins",
    it: "Fabbricazione di casse funebri",
  },
  "32.99.91": {
    en: "Manufacture of electronic cigarettes",
    it: "Fabbricazione di sigarette elettroniche",
  },
  "32.99.99": {
    en: "Manufacture of other various articles n.e.c.",
    it: "Fabbricazione di altri articoli vari n.c.a.",
  },
  "33.11.01": {
    en: "Repair and maintenance of metal tanks, reservoirs and containers",
    it: "Riparazione e manutenzione di cisterne, serbatoi e contenitori in metallo",
  },
  "33.11.02": {
    en: "Repair and maintenance of hand tools",
    it: "Riparazione e manutenzione di utensileria ad azionamento manuale",
  },
  "33.11.03": {
    en: "Repair and maintenance of moulding boxes and moulds",
    it: "Riparazione e manutenzione di stampi, portastampi, sagome, forme per macchine",
  },
  "33.11.04": {
    en: "Repair and maintenance of safes, strongboxes and metal armoured doors",
    it: "Riparazione e manutenzione di casseforti, cassette di sicurezza, porte metalliche blindate",
  },
  "33.11.05": {
    en: "Repair and maintenance of military weapons, ordnance and artillery",
    it: "Riparazione e manutenzione di armi da fuoco militari, di ordinanza e artiglieria",
  },
  "33.11.06": {
    en: "Repair and maintenance of sporting and civilian firearms",
    it: "Riparazione e manutenzione di armi per uso sportivo e civile",
  },
  "33.11.09": {
    en: "Repair and maintenance of other fabricated metal products",
    it: "Riparazione e manutenzione di altri prodotti in metallo",
  },
  "33.12.10": {
    en: "Repair and maintenance of engines, pumps, compressors and other similar machinery",
    it: "Riparazione e manutenzione di motori, turbine, pompe, compressori e altri elementi simili",
  },
  "33.12.20": {
    en: "Repair and maintenance of industrial process furnaces",
    it: "Riparazione e manutenzione di caldaie per processi industriali",
  },
  "33.12.30": {
    en: "Repair and maintenance of lifting and handling equipment",
    it: "Riparazione e manutenzione di apparecchi di sollevamento e movimentazione",
  },
  "33.12.40": {
    en: "Repair and maintenance of industrial refrigeration equipment and air-purifying equipment",
    it: "Riparazione e manutenzione di impianti di refrigerazione industriale e di depurazione dell'aria",
  },
  "33.12.51": {
    en: "Repair and maintenance of office machinery and equipment",
    it: "Riparazione e manutenzione di macchine e attrezzature per ufficio",
  },
  "33.12.52": {
    en: "Repair and maintenance of weighing machinery and automatic goods vending machines",
    it: "Riparazione e manutenzione di bilance e distributori automatici",
  },
  "33.12.53": {
    en: "Repair and maintenance of distilling or rectifying plant for petroleum refineries and chemical industries",
    it: "Riparazione e manutenzione di impianti di distillazione o rettificazione per raffinerie di petrolio e industrie chimiche",
  },
  "33.12.54": {
    en: "Repair and maintenance of packing and wrapping machinery",
    it: "Riparazione e manutenzione di macchine per impacchettare e imballare",
  },
  "33.12.59": {
    en: "Repair and maintenance of other general-purpose machinery n.e.c.",
    it: "Riparazione e manutenzione di altre macchine di impiego generale n.c.a.",
  },
  "33.12.60": {
    en: "Repair and maintenance of agricultural tractors",
    it: "Riparazione e manutenzione di trattori agricoli",
  },
  "33.12.70": {
    en: "Repair and maintenance of other machinery used in agriculture and forestry",
    it: "Riparazione e manutenzione di altre macchine per l'agricoltura e la silvicoltura",
  },
  "33.12.91": {
    en: "Sharpening of machinery blades and saws",
    it: "Affilatura di lame e seghe per macchinari",
  },
  "33.12.92": {
    en: "Repair and maintenance of roundabouts, swings and other fairground amusements",
    it: "Riparazione e manutenzione di giostre, altalene e altre attrazioni di divertimento",
  },
  "33.12.99": {
    en: "Repair and maintenance of other special-purpose machinery n.e.c.",
    it: "Riparazione e manutenzione di altre macchine per impieghi speciali n.c.a.",
  },
  "33.13.01": {
    en: "Repair and maintenance of irradiation, electromedical and electrotherapeutic equipment",
    it: "Riparazione e manutenzione di apparecchiature per irradiazione, elettromedicali ed elettroterapeutiche",
  },
  "33.13.02": {
    en: "Repair and maintenance of optical instruments and equipment",
    it: "Riparazione e manutenzione di strumenti e apparecchiature ottiche",
  },
  "33.13.09": {
    en: "Repair and maintenance of other electronic and optical equipment",
    it: "Riparazione e manutenzione di altre apparecchiature elettroniche e ottiche",
  },
  "33.14.00": {
    en: "Repair and maintenance of electrical equipment",
    it: "Riparazione e manutenzione di apparecchiature elettriche",
  },
  "33.15.00": {
    en: "Repair and maintenance of civilian ships and boats",
    it: "Riparazione e manutenzione di navi e imbarcazioni per scopi civili",
  },
  "33.16.00": {
    en: "Repair and maintenance of civilian air and spacecraft",
    it: "Riparazione e manutenzione di aeromobili e veicoli spaziali per scopi civili",
  },
  "33.17.00": {
    en: "Repair and maintenance of other civilian transport equipment",
    it: "Riparazione e manutenzione di altri mezzi di trasporto per scopi civili",
  },
  "33.18.10": {
    en: "Repair and maintenance of military fighting vehicles",
    it: "Riparazione e manutenzione di veicoli da combattimento per scopi militari",
  },
  "33.18.20": {
    en: "Repair and maintenance of military ships and boats",
    it: "Riparazione e manutenzione di navi e imbarcazioni per scopi militari",
  },
  "33.18.30": {
    en: "Repair and maintenance of military air and spacecraft",
    it: "Riparazione e manutenzione di aeromobili e veicoli spaziali per scopi militari",
  },
  "33.19.00": {
    en: "Repair and maintenance of other equipment",
    it: "Riparazione e manutenzione di altre apparecchiature",
  },
  "33.20.01": {
    en: "Installation of electric motors, generators, transformers and electricity distribution and control apparatus",
    it: "Installazione di motori, generatori e trasformatori elettrici e di apparecchiature per la distribuzione e il controllo della elettricità",
  },
  "33.20.02": {
    en: "Installation of communication, radio and television equipment",
    it: "Installazione di apparecchiature per le comunicazioni e di apparecchiature radiotelevisive",
  },
  "33.20.03": {
    en: "Installation of measurement and testing equipment",
    it: "Installazione di strumenti e apparecchi di misurazione e controllo",
  },
  "33.20.04": {
    en: "Installation of metal tanks, reservoirs and containers",
    it: "Installazione di cisterne, serbatoi e contenitori in metallo",
  },
  "33.20.05": {
    en: "Installation of steam or other generating boilers",
    it: "Installazione di generatori di vapore",
  },
  "33.20.06": {
    en: "Installation of professional office machinery and equipment",
    it: "Installazione di macchinari e attrezzature per ufficio",
  },
  "33.20.07": {
    en: "Installation of medical and dental instruments and appliances",
    it: "Installazione di strumenti e apparecchiature mediche e dentistiche",
  },
  "33.20.09": {
    en: "Installation of other industrial machinery and equipment",
    it: "Installazione di altre macchine e apparecchiature industriali",
  },
  "35.11.00": {
    en: "Production of electricity from non-renewable sources",
    it: "Produzione di energia elettrica da fonti non rinnovabili",
  },
  "35.12.00": {
    en: "Production of electricity from renewable sources",
    it: "Produzione di energia elettrica da fonti rinnovabili",
  },
  "35.13.00": {
    en: "Transmission of electricity",
    it: "Trasmissione di energia elettrica",
  },
  "35.14.00": {
    en: "Distribution of electricity",
    it: "Distribuzione di energia elettrica",
  },
  "35.15.00": {
    en: "Trade of electricity",
    it: "Commercio di energia elettrica",
  },
  "35.16.00": {
    en: "Storage of electricity",
    it: "Stoccaggio di energia elettrica",
  },
  "35.21.00": {
    en: "Manufacture of gas",
    it: "Produzione di gas",
  },
  "35.22.00": {
    en: "Distribution of gaseous fuels through mains",
    it: "Distribuzione di combustibili gassosi mediante condotte",
  },
  "35.23.00": {
    en: "Trade of gas through mains",
    it: "Commercio di gas distribuito mediante condotte",
  },
  "35.24.00": {
    en: "Storage of gas as part of network supply services",
    it: "Stoccaggio di gas nell'ambito dei servizi di fornitura della rete",
  },
  "35.30.00": {
    en: "Steam and air conditioning supply",
    it: "Fornitura di vapore e aria condizionata",
  },
  "35.40.00": {
    en: "Activities of brokers and agents for electric power and natural gas",
    it: "Attività di servizi di intermediazione per l'energia elettrica e il gas naturale",
  },
  "36.00.00": {
    en: "Water collection, treatment and supply",
    it: "Raccolta, trattamento e fornitura di acqua",
  },
  "37.00.00": {
    en: "Sewerage",
    it: "Gestione delle reti fognarie",
  },
  "38.11.00": {
    en: "Collection of non-hazardous waste",
    it: "Raccolta di rifiuti non pericolosi",
  },
  "38.12.00": {
    en: "Collection of hazardous waste",
    it: "Raccolta di rifiuti pericolosi",
  },
  "38.21.11": {
    en: "Dismantling of wrecks of ships for materials recovery",
    it: "Smantellamento di carcasse di navi per il recupero dei materiali",
  },
  "38.21.12": {
    en: "Dismantling of wrecks of any type for materials recovery, other than ships",
    it: "Smantellamento di altre carcasse",
  },
  "38.21.20": {
    en: "Recovery of materials from metal waste",
    it: "Recupero dei materiali da rifiuti metallici",
  },
  "38.21.30": {
    en: "Recovery of materials from plastics waste",
    it: "Recupero dei materiali da rifiuti plastici",
  },
  "38.21.40": {
    en: "Recovery of materials from other waste",
    it: "Recupero dei materiali da altri rifiuti",
  },
  "38.22.00": {
    en: "Energy recovery",
    it: "Recupero di energia",
  },
  "38.23.00": {
    en: "Other waste recovery",
    it: "Altre attività di recupero dei rifiuti",
  },
  "38.31.00": {
    en: "Incineration without energy recovery",
    it: "Incenerimento senza recupero di energia",
  },
  "38.32.00": {
    en: "Landfilling or permanent storage",
    it: "Conferimento in discarica o stoccaggio permanente",
  },
  "38.33.00": {
    en: "Other waste disposal",
    it: "Altre attività di smaltimento dei rifiuti",
  },
  "39.00.01": {
    en: "Asbestos, lead paint, and other toxic material abatement",
    it: "Attività di rimozione di amianto, vernici a base di piombo e altri materiali tossici",
  },
  "39.00.09": {
    en: "Remediation activities and other waste management service activities n.e.c.",
    it: "Attività di risanamento e altri servizi di gestione dei rifiuti n.c.a.",
  },
  "41.00.00": {
    en: "Construction of residential and non-residential buildings",
    it: "Costruzione di edifici residenziali e non residenziali",
  },
  "42.11.00": {
    en: "Construction of roads and motorways",
    it: "Costruzione di strade e autostrade",
  },
  "42.12.00": {
    en: "Construction of railways and underground railways",
    it: "Costruzione di linee ferroviarie e metropolitane",
  },
  "42.13.00": {
    en: "Construction of bridges and tunnels",
    it: "Costruzione di ponti e gallerie",
  },
  "42.21.00": {
    en: "Construction of utility projects for fluids",
    it: "Costruzione di opere di pubblica utilità per il trasporto dei fluidi",
  },
  "42.22.00": {
    en: "Construction of utility projects for electricity and telecommunications",
    it: "Costruzione di opere di pubblica utilità per l'energia elettrica e le telecomunicazioni",
  },
  "42.91.00": {
    en: "Construction of water projects",
    it: "Costruzione di opere idrauliche",
  },
  "42.99.00": {
    en: "Construction of other civil engineering projects n.e.c.",
    it: "Costruzione di altre opere di ingegneria civile n.c.a.",
  },
  "43.11.00": {
    en: "Demolition",
    it: "Demolizione",
  },
  "43.12.01": {
    en: "Site preparation for archaeological excavation",
    it: "Preparazione del sito per scavi archeologici",
  },
  "43.12.09": {
    en: "Other site preparation activities",
    it: "Altre attività di preparazione del cantiere edile",
  },
  "43.13.00": {
    en: "Test drilling and boring",
    it: "Trivellazioni e perforazioni",
  },
  "43.21.01": {
    en: "Installation of lighting and photovoltaic systems on buildings",
    it: "Installazione di impianti di illuminazione e fotovoltaici in edifici",
  },
  "43.21.02": {
    en: "Installation of telecommunication wiring and other similar systems",
    it: "Installazione di cablaggi per telecomunicazioni e altre reti",
  },
  "43.21.03": {
    en: "Installation of street lighting and airport runway lighting",
    it: "Installazione di impianti di illuminazione stradale e di piste aeroportuali",
  },
  "43.21.04": {
    en: "Installation of electrical signs and decorative lights",
    it: "Installazione di insegne elettriche e luminarie per feste",
  },
  "43.21.05": {
    en: "Installation of electrical votive and cemetery lighting systems",
    it: "Installazione di impianti di illuminazione elettrica votiva e cimiteriale",
  },
  "43.22.01": {
    en: "Installation of geothermal systems",
    it: "Installazione di impianti geotermici",
  },
  "43.22.02": {
    en: "Installation of pool filter systems",
    it: "Installazione di impianti di depurazione per piscine",
  },
  "43.22.03": {
    en: "Installation of fire sprinkler systems",
    it: "Installazione di impianti di spegnimento di incendi",
  },
  "43.22.04": {
    en: "Installation of lawn sprinkler systems",
    it: "Installazione di impianti di irrigazione per giardini",
  },
  "43.22.05": {
    en: "Installation of other thermo-hydraulic plumbing systems",
    it: "Installazione di altri impianti termo-idraulici",
  },
  "43.22.06": {
    en: "Installation of gas distribution systems",
    it: "Installazione di impianti per la distribuzione del gas",
  },
  "43.22.07": {
    en: "Installation of heat and air-conditioning systems",
    it: "Installazione di impianti di riscaldamento e di condizionamento dell'aria",
  },
  "43.23.00": {
    en: "Installation of insulation",
    it: "Installazione di sistemi per l'isolamento",
  },
  "43.24.01": {
    en: "Installation of elevators and escalators",
    it: "Installazione di ascensori e scale mobili",
  },
  "43.24.02": {
    en: "Installation of non-electrical signs",
    it: "Installazione di insegne non elettriche",
  },
  "43.24.09": {
    en: "Other construction installation n.e.c.",
    it: "Altri lavori di installazione edili n.c.a.",
  },
  "43.31.01": {
    en: "Dry-walling of walls",
    it: "Posa in opera di cartongesso",
  },
  "43.31.02": {
    en: "Other plastering activities",
    it: "Altri lavori di intonacatura",
  },
  "43.32.01": {
    en: "Installation of armoured doors",
    it: "Posa in opera di porte blindate",
  },
  "43.32.02": {
    en: "Installation of non-armoured doors and windows, ceilings, movable partitions and other joinery installation",
    it: "Posa in opera di porte non blindate, finestre, arredi, controsoffitti, pareti mobili e simili",
  },
  "43.33.00": {
    en: "Floor and wall covering",
    it: "Rivestimento di pavimenti e di pareti",
  },
  "43.34.01": {
    en: "Painting",
    it: "Tinteggiatura",
  },
  "43.34.02": {
    en: "Glazing",
    it: "Posa in opera di vetri",
  },
  "43.35.00": {
    en: "Other building completion and finishing",
    it: "Altri lavori di completamento e finitura degli edifici",
  },
  "43.41.00": {
    en: "Roofing activities",
    it: "Realizzazione di coperture",
  },
  "43.42.00": {
    en: "Other specialised construction activities in construction of buildings",
    it: "Altri lavori di costruzione specializzati nella costruzione di edifici",
  },
  "43.50.00": {
    en: "Specialised construction activities in civil engineering",
    it: "Lavori di costruzione specializzati nell'ingegneria civile",
  },
  "43.60.00": {
    en: "Intermediation service activities for specialised construction services",
    it: "Attività di servizi di intermediazione per servizi di costruzione specializzati",
  },
  "43.91.00": {
    en: "Masonry and bricklaying activities",
    it: "Lavori di muratura",
  },
  "43.99.01": {
    en: "Rental of cranes and other building equipment with operator",
    it: "Noleggio di gru e altre attrezzature edili con operatore",
  },
  "43.99.02": {
    en: "Activities on historical and archaeological sites and buildings",
    it: "Interventi su siti ed edifici storici e archeologici",
  },
  "43.99.09": {
    en: "Other various specialised construction activities n.e.c.",
    it: "Altri lavori vari di costruzione specializzati n.c.a.",
  },
  "46.11.01": {
    en: "Activities of agents involved in the wholesale of agricultural raw materials",
    it: "Attività di intermediari del commercio all'ingrosso di materie prime agricole",
  },
  "46.11.02": {
    en: "Activities of agents involved in the wholesale of flowers and plants",
    it: "Attività di intermediari del commercio all'ingrosso di fiori e piante",
  },
  "46.11.03": {
    en: "Activities of agents involved in the wholesale of live animals",
    it: "Attività di intermediari del commercio all'ingrosso di animali vivi",
  },
  "46.11.04": {
    en: "Activities of agents involved in the wholesale of textile raw materials and semi-finished goods",
    it: "Attività di intermediari del commercio all'ingrosso di materie prime tessili e semilavorati",
  },
  "46.12.01": {
    en: "Activities of agents involved in the wholesale of liquid and gaseous fuels",
    it: "Attività di intermediari del commercio all'ingrosso di combustibili liquidi e gassosi",
  },
  "46.12.02": {
    en: "Activities of agents involved in the wholesale of solid fuels",
    it: "Attività di intermediari del commercio all'ingrosso di combustibili solidi",
  },
  "46.12.03": {
    en: "Activities of agents involved in the wholesale of ores and metals",
    it: "Attività di intermediari del commercio all'ingrosso di minerali e metalli",
  },
  "46.12.04": {
    en: "Activities of agents involved in the wholesale of fertilisers and agrochemical products",
    it: "Attività di intermediari del commercio all'ingrosso di fertilizzanti e altri prodotti chimici per l'agricoltura",
  },
  "46.12.05": {
    en: "Activities of agents involved in the wholesale of industrial chemicals",
    it: "Attività di intermediari del commercio all'ingrosso di prodotti chimici per l'industria",
  },
  "46.13.01": {
    en: "Activities of agents involved in the wholesale of timber",
    it: "Attività di intermediari del commercio all'ingrosso di legname",
  },
  "46.13.02": {
    en: "Activities of agents involved in the wholesale of paints, varnishes and lacquers",
    it: "Attività di intermediari del commercio all'ingrosso di pitture, vernici e lacche",
  },
  "46.13.03": {
    en: "Activities of agents involved in the wholesale of other building materials",
    it: "Attività di intermediari del commercio all'ingrosso di altri materiali da costruzione",
  },
  "46.14.01": {
    en: "Activities of agents involved in the wholesale of machinery and industrial equipment for use in industry and trade",
    it: "Attività di intermediari del commercio all'ingrosso di macchine e attrezzature per l'industria e il commercio",
  },
  "46.14.02": {
    en: "Activities of agents involved in the wholesale of machinery and industrial equipment for use in construction",
    it: "Attività di intermediari del commercio all'ingrosso di macchine e attrezzature per l'edilizia",
  },
  "46.14.03": {
    en: "Activities of agents involved in the wholesale of office machinery, computers and communication equipment",
    it: "Attività di intermediari del commercio all'ingrosso di macchine per ufficio, computer e apparecchiature per le comunicazioni",
  },
  "46.14.04": {
    en: "Activities of agents involved in the wholesale of agricultural equipment",
    it: "Attività di intermediari del commercio all'ingrosso di attrezzature agricole",
  },
  "46.14.05": {
    en: "Activities of agents involved in the wholesale of ships and aircraft",
    it: "Attività di intermediari del commercio all'ingrosso di navi e aeromobili",
  },
  "46.15.01": {
    en: "Activities of agents involved in the wholesale of furniture made of wood, metal and plastic",
    it: "Attività di intermediari del commercio all'ingrosso di mobili in legno, metallo e materie plastiche",
  },
  "46.15.02": {
    en: "Activities of agents involved in the wholesale of furniture made of other materials and of home furnishings",
    it: "Attività di intermediari del commercio all'ingrosso di altri mobili e oggetti di arredamento per la casa",
  },
  "46.15.03": {
    en: "Activities of agents involved in the wholesale of household heating, ventilation and air conditioning equipment",
    it: "Attività di intermediari del commercio all'ingrosso di apparecchiature di riscaldamento, ventilazione e condizionamento domestico",
  },
  "46.15.04": {
    en: "Activities of agents involved in the wholesale of other household goods",
    it: "Attività di intermediari del commercio all'ingrosso di altri articoli per la casa",
  },
  "46.15.05": {
    en: "Activities of agents involved in the wholesale of hardware and ironmongery",
    it: "Attività di intermediari del commercio all'ingrosso di ferramenta",
  },
  "46.16.01": {
    en: "Activities of agents involved in the wholesale of apparel and furnishing fabrics",
    it: "Attività di intermediari del commercio all'ingrosso di tessuti per l'abbigliamento e l'arredamento",
  },
  "46.16.02": {
    en: "Activities of agents involved in the wholesale of home textile goods and carpets",
    it: "Attività di intermediari del commercio all'ingrosso di prodotti tessili per la casa e tappeti",
  },
  "46.16.03": {
    en: "Activities of agents involved in the wholesale of shirts, underwear and similar products",
    it: "Attività di intermediari del commercio all'ingrosso di camicie, biancheria intima e articoli simili",
  },
  "46.16.04": {
    en: "Activities of agents involved in the wholesale of other clothing and clothing accessories",
    it: "Attività di intermediari del commercio all'ingrosso di altri articoli di abbigliamento e accessori per l'abbigliamento",
  },
  "46.16.05": {
    en: "Activities of agents involved in the wholesale of fur",
    it: "Attività di intermediari del commercio all'ingrosso di pellicce",
  },
  "46.16.06": {
    en: "Activities of agents involved in the wholesale of footwear",
    it: "Attività di intermediari del commercio all'ingrosso di calzature",
  },
  "46.16.07": {
    en: "Activities of agents involved in the wholesale of leather goods and travel accessories",
    it: "Attività di intermediari del commercio all'ingrosso di articoli in pelle e articoli da viaggio",
  },
  "46.17.01": {
    en: "Activities of agents involved in the wholesale of fruit and vegetables",
    it: "Attività di intermediari del commercio all'ingrosso di frutta e ortaggi",
  },
  "46.17.02": {
    en: "Activities of agents involved in the wholesale of meat and meat products",
    it: "Attività di intermediari del commercio all'ingrosso di carne e prodotti a base di carne",
  },
  "46.17.03": {
    en: "Activities of agents involved in the wholesale of fish and fish products",
    it: "Attività di intermediari del commercio all'ingrosso di pesce e prodotti a base di pesce",
  },
  "46.17.04": {
    en: "Activities of agents involved in the wholesale of milk and dairy products",
    it: "Attività di intermediari del commercio all'ingrosso di latte e prodotti lattiero-caseari",
  },
  "46.17.05": {
    en: "Activities of agents involved in the wholesale of edible oils and fats",
    it: "Attività di intermediari del commercio all'ingrosso di oli e grassi alimentari",
  },
  "46.17.06": {
    en: "Activities of agents involved in the wholesale of beverages",
    it: "Attività di intermediari del commercio all'ingrosso di bevande",
  },
  "46.17.07": {
    en: "Activities of agents involved in the wholesale of other food and tobacco",
    it: "Attività di intermediari del commercio all'ingrosso di altri prodotti alimentari e tabacchi",
  },
  "46.18.11": {
    en: "Activities of agents involved in the wholesale of pharmaceutical goods",
    it: "Attività di intermediari del commercio all'ingrosso di prodotti farmaceutici",
  },
  "46.18.12": {
    en: "Activities of agents involved in the wholesale of medical goods",
    it: "Attività di intermediari del commercio all'ingrosso di articoli medicali",
  },
  "46.18.13": {
    en: "Activities of agents involved in the wholesale of perfumery and toilet articles",
    it: "Attività di intermediari del commercio all'ingrosso di profumi e articoli di profumeria",
  },
  "46.18.14": {
    en: "Activities of agents involved in the wholesale of cleaning materials",
    it: "Attività di intermediari del commercio all'ingrosso di prodotti per la pulizia",
  },
  "46.18.21": {
    en: "Activities of agents involved in the wholesale of games and toys",
    it: "Attività di intermediari del commercio all'ingrosso di giochi e giocattoli",
  },
  "46.18.22": {
    en: "Activities of agents involved in the wholesale of bicycles",
    it: "Attività di intermediari del commercio all'ingrosso di biciclette",
  },
  "46.18.23": {
    en: "Activities of agents involved in the wholesale of other sports goods",
    it: "Attività di intermediari del commercio all'ingrosso di altre attrezzature sportive",
  },
  "46.18.24": {
    en: "Activities of agents involved in the wholesale of watches, clocks and jewellery",
    it: "Attività di intermediari del commercio all'ingrosso di orologi e gioielli",
  },
  "46.18.25": {
    en: "Activities of agents involved in the wholesale of imitation jewellery",
    it: "Attività di intermediari del commercio all'ingrosso di oggetti di bigiotteria",
  },
  "46.18.26": {
    en: "Activities of agents involved in the wholesale of photographic and optical equipment",
    it: "Attività di intermediari del commercio all'ingrosso di apparecchiature fotografiche e strumenti ottici",
  },
  "46.18.31": {
    en: "Activities of agents involved in the wholesale of books",
    it: "Attività di intermediari del commercio all'ingrosso di libri",
  },
  "46.18.32": {
    en: "Activities of agents involved in the wholesale of newspapers and magazines",
    it: "Attività di intermediari del commercio all'ingrosso di giornali e riviste",
  },
  "46.18.33": {
    en: "Activities of agents involved in the wholesale of stationery",
    it: "Attività di intermediari del commercio all'ingrosso di articoli di cancelleria",
  },
  "46.18.41": {
    en: "Activities of agents involved in the wholesale of cars and light motor vehicles",
    it: "Attività di intermediari del commercio all'ingrosso di automobili e autoveicoli leggeri",
  },
  "46.18.42": {
    en: "Activities of agents involved in the wholesale of other motor vehicles",
    it: "Attività di intermediari del commercio all'ingrosso di altri autoveicoli",
  },
  "46.18.43": {
    en: "Activities of agents involved in the wholesale of parts and accessories for motor vehicles",
    it: "Attività di intermediari del commercio all'ingrosso di parti e accessori di autoveicoli",
  },
  "46.18.44": {
    en: "Activities of agents involved in the wholesale of motorcycles",
    it: "Attività di intermediari del commercio all'ingrosso di motocicli",
  },
  "46.18.45": {
    en: "Activities of agents involved in the wholesale of parts and accessories for motorcycles",
    it: "Attività di intermediari del commercio all'ingrosso di parti e accessori di motocicli",
  },
  "46.18.46": {
    en: "Activities of agents involved in the wholesale of rolling stock and parts and accessories for rolling stock",
    it: "Attività di intermediari del commercio all'ingrosso di materiale rotabile e di parti e accessori per materiale rotabile",
  },
  "46.18.50": {
    en: "Activities of agents involved in the wholesale of audio and video equipment",
    it: "Attività di intermediari del commercio all'ingrosso di apparecchiature audio e video",
  },
  "46.18.91": {
    en: "Activities of agents involved in the wholesale of waste",
    it: "Attività di intermediari del commercio all'ingrosso di rifiuti",
  },
  "46.18.92": {
    en: "Activities of agents involved in the wholesale of wall and floor coverings",
    it: "Attività di intermediari del commercio all'ingrosso di rivestimenti per pareti e per pavimenti",
  },
  "46.18.93": {
    en: "Activities of agents involved in the wholesale of musical instruments",
    it: "Attività di intermediari del commercio all'ingrosso di strumenti musicali",
  },
  "46.18.99": {
    en: "Activities of agents involved in the wholesale of other various particular products n.e.c.",
    it: "Attività di intermediari del commercio all'ingrosso di altri prodotti specifici vari n.c.a.",
  },
  "46.19.00": {
    en: "Activities of agents involved in non-specialised wholesale",
    it: "Attività di intermediari del commercio all'ingrosso non specializzato",
  },
  "46.21.10": {
    en: "Wholesale of grains",
    it: "Commercio all'ingrosso di cereali",
  },
  "46.21.21": {
    en: "Wholesale of unmanufactured tobacco",
    it: "Commercio all'ingrosso di tabacco grezzo",
  },
  "46.21.22": {
    en: "Wholesale of seeds and animal feeds",
    it: "Commercio all'ingrosso di sementi e alimenti per il bestiame",
  },
  "46.22.00": {
    en: "Wholesale of flowers and plants",
    it: "Commercio all'ingrosso di fiori e piante",
  },
  "46.23.00": {
    en: "Wholesale of live animals",
    it: "Commercio all'ingrosso di animali vivi",
  },
  "46.24.01": {
    en: "Wholesale of fur skins",
    it: "Commercio all'ingrosso di pelli per pellicceria",
  },
  "46.24.02": {
    en: "Wholesale of other hides and leather, other than fur skins",
    it: "Commercio all'ingrosso di pelli non per pellicceria e cuoio",
  },
  "46.31.10": {
    en: "Wholesale of fresh fruit and vegetables",
    it: "Commercio all'ingrosso di frutta e ortaggi freschi",
  },
  "46.31.20": {
    en: "Wholesale of preserved or frozen fruit and vegetables",
    it: "Commercio all'ingrosso di frutta e ortaggi conservati o surgelati",
  },
  "46.32.11": {
    en: "Wholesale of fresh meat",
    it: "Commercio all'ingrosso di carni fresche",
  },
  "46.32.12": {
    en: "Wholesale of frozen or preserved meat",
    it: "Commercio all'ingrosso di carni conservate o surgelate",
  },
  "46.32.20": {
    en: "Wholesale of charcuterie and other meat products",
    it: "Commercio all'ingrosso di salumi e di altri prodotti a base di carne",
  },
  "46.32.31": {
    en: "Wholesale of fresh fish",
    it: "Commercio all'ingrosso di pesci freschi",
  },
  "46.32.32": {
    en: "Wholesale of preserved or frozen fish and fish products",
    it: "Commercio all'ingrosso di pesci conservati o surgelati e di prodotti a base di pesce",
  },
  "46.33.10": {
    en: "Wholesale of dairy products and eggs",
    it: "Commercio all'ingrosso di prodotti lattiero-caseari e uova",
  },
  "46.33.20": {
    en: "Wholesale of edible oils and fats",
    it: "Commercio all'ingrosso di oli e grassi alimentari",
  },
  "46.34.10": {
    en: "Wholesale of alcoholic beverages",
    it: "Commercio all'ingrosso di bevande alcoliche",
  },
  "46.34.20": {
    en: "Wholesale of non-alcoholic beverages",
    it: "Commercio all'ingrosso di bevande analcoliche",
  },
  "46.35.01": {
    en: "Wholesale of electronic cigarettes",
    it: "Commercio all'ingrosso di sigarette elettroniche",
  },
  "46.35.09": {
    en: "Wholesale of tobacco products n.e.c.",
    it: "Commercio all'ingrosso di prodotti del tabacco n.c.a.",
  },
  "46.36.00": {
    en: "Wholesale of sugar, chocolate and sugar confectionery",
    it: "Commercio all'ingrosso di zucchero, cioccolato e dolciumi",
  },
  "46.37.01": {
    en: "Wholesale of coffee",
    it: "Commercio all'ingrosso di caffè",
  },
  "46.37.02": {
    en: "Wholesale of tea, cocoa and spices",
    it: "Commercio all'ingrosso di tè, cacao e spezie",
  },
  "46.38.00": {
    en: "Wholesale of other food",
    it: "Commercio all'ingrosso di altri prodotti alimentari",
  },
  "46.39.00": {
    en: "Non-specialised wholesale of food, beverages and tobacco",
    it: "Commercio all'ingrosso non specializzato di prodotti alimentari, bevande e tabacchi",
  },
  "46.41.10": {
    en: "Wholesale of fabrics",
    it: "Commercio all'ingrosso di tessuti",
  },
  "46.41.20": {
    en: "Wholesale of yarn and haberdashery",
    it: "Commercio all'ingrosso di filati e articoli di merceria",
  },
  "46.41.90": {
    en: "Wholesale of other textiles",
    it: "Commercio all'ingrosso di altri prodotti tessili",
  },
  "46.42.10": {
    en: "Wholesale of clothing and clothing accessories",
    it: "Commercio all'ingrosso di abbigliamento e di accessori per l'abbigliamento",
  },
  "46.42.20": {
    en: "Wholesale of fur articles",
    it: "Commercio all'ingrosso di articoli in pelliccia",
  },
  "46.42.30": {
    en: "Wholesale of footwear",
    it: "Commercio all'ingrosso di calzature",
  },
  "46.43.10": {
    en: "Wholesale of photographic and optical goods",
    it: "Commercio all'ingrosso di articoli per fotografia e ottica",
  },
  "46.43.20": {
    en: "Wholesale of radio and television equipment",
    it: "Commercio all'ingrosso di apparecchiature radiotelevisive",
  },
  "46.43.30": {
    en: "Wholesale of other electrical household appliances",
    it: "Commercio all'ingrosso di altri elettrodomestici",
  },
  "46.44.10": {
    en: "Wholesale of chinaware",
    it: "Commercio all'ingrosso di articoli di porcellana",
  },
  "46.44.20": {
    en: "Wholesale of glassware",
    it: "Commercio all'ingrosso di articoli di vetro",
  },
  "46.44.30": {
    en: "Wholesale of other household utensils, crockery and pottery",
    it: "Commercio all'ingrosso di altri utensili per la casa, stoviglie e vasellame",
  },
  "46.44.40": {
    en: "Wholesale of cleaning materials",
    it: "Commercio all'ingrosso di prodotti per la pulizia",
  },
  "46.45.00": {
    en: "Wholesale of perfume and cosmetics",
    it: "Commercio all'ingrosso di profumi e cosmetici",
  },
  "46.46.10": {
    en: "Wholesale of basic pharmaceutical products and pharmaceutical preparations",
    it: "Commercio all'ingrosso di prodotti farmaceutici di base e di preparati farmaceutici",
  },
  "46.46.20": {
    en: "Wholesale of herbal remedies",
    it: "Commercio all'ingrosso di rimedi erboristici",
  },
  "46.46.31": {
    en: "Wholesale of glasses, sunglasses and lenses",
    it: "Commercio all'ingrosso di occhiali e lenti",
  },
  "46.46.39": {
    en: "Wholesale of medical and orthopaedic goods n.e.c.",
    it: "Commercio all'ingrosso di prodotti medicali e ortopedici n.c.a.",
  },
  "46.47.10": {
    en: "Wholesale of household, office and shop furniture",
    it: "Commercio all'ingrosso di mobili per la casa, l'ufficio e i negozi",
  },
  "46.47.20": {
    en: "Wholesale of household, office and shop carpets",
    it: "Commercio all'ingrosso di tappeti per la casa, l'ufficio e i negozi",
  },
  "46.47.30": {
    en: "Wholesale of household, office and shop lighting equipment",
    it: "Commercio all'ingrosso di articoli per l'illuminazione per la casa, l'ufficio e i negozi",
  },
  "46.48.00": {
    en: "Wholesale of watches and jewellery",
    it: "Commercio all'ingrosso di orologi e di gioielleria",
  },
  "46.49.10": {
    en: "Wholesale of paper, paperboard and stationery",
    it: "Commercio all'ingrosso di carta, cartone e articoli di cartoleria",
  },
  "46.49.21": {
    en: "Wholesale of books",
    it: "Commercio all'ingrosso di libri",
  },
  "46.49.22": {
    en: "Wholesale of magazines and newspapers",
    it: "Commercio all'ingrosso di riviste e giornali",
  },
  "46.49.30": {
    en: "Wholesale of games, toys and baby equipment",
    it: "Commercio all'ingrosso di giochi, giocattoli e attrezzature per bambini",
  },
  "46.49.41": {
    en: "Wholesale of bicycles",
    it: "Commercio all'ingrosso di biciclette",
  },
  "46.49.49": {
    en: "Wholesale of other sports goods",
    it: "Commercio all'ingrosso di altre attrezzature e articoli sportivi",
  },
  "46.49.50": {
    en: "Wholesale of leather goods and travel accessories",
    it: "Commercio all'ingrosso di articoli in pelle e articoli da viaggio",
  },
  "46.49.91": {
    en: "Wholesale in promotional items",
    it: "Commercio all'ingrosso di articoli promozionali",
  },
  "46.49.92": {
    en: "Wholesale of party favours",
    it: "Commercio all'ingrosso di bomboniere",
  },
  "46.49.99": {
    en: "Wholesale of other various household goods n.e.c.",
    it: "Commercio all'ingrosso di altri beni di consumo vari n.c.a.",
  },
  "46.50.10": {
    en: "Wholesale of computers, computer peripheral equipment and software",
    it: "Commercio all'ingrosso di computer, unità periferiche e software",
  },
  "46.50.20": {
    en: "Wholesale of telephone and communication equipment",
    it: "Commercio all'ingrosso di apparecchiature per telecomunicazioni",
  },
  "46.50.30": {
    en: "Wholesale of other office machinery and equipment",
    it: "Commercio all'ingrosso di altre macchine e attrezzature per ufficio",
  },
  "46.61.00": {
    en: "Wholesale of agricultural machinery, equipment and supplies",
    it: "Commercio all'ingrosso di macchinari, attrezzature e forniture agricole",
  },
  "46.62.00": {
    en: "Wholesale of machine tools",
    it: "Commercio all'ingrosso di macchine utensili",
  },
  "46.63.00": {
    en: "Wholesale of mining, construction and civil engineering machinery",
    it: "Commercio all'ingrosso di macchinari per l'estrazione, l'edilizia e l'ingegneria civile",
  },
  "46.64.11": {
    en: "Wholesale of ships and boats",
    it: "Commercio all'ingrosso di navi e imbarcazioni",
  },
  "46.64.19": {
    en: "Wholesale of other transport equipment",
    it: "Commercio all'ingrosso di altri mezzi di trasporto",
  },
  "46.64.20": {
    en: "Wholesale of electrical equipment for industrial installations",
    it: "Commercio all'ingrosso di materiale elettrico per impianti industriali",
  },
  "46.64.30": {
    en: "Wholesale of equipment for hairdressers, gyms, solariums and beauty centres",
    it: "Commercio all'ingrosso di attrezzature per parrucchieri, palestre, solarium e centri estetici",
  },
  "46.64.40": {
    en: "Wholesale of textile, leather and laundry machinery",
    it: "Commercio all'ingrosso di macchine tessili, per la lavorazione delle pelli e del cuoio, per lavanderie e stirerie",
  },
  "46.64.51": {
    en: "Wholesale of machinery and equipment for restaurants and bars",
    it: "Commercio all'ingrosso di macchine e attrezzature per ristoranti e bar",
  },
  "46.64.59": {
    en: "Wholesale of other machinery for the food and beverages industry",
    it: "Commercio all'ingrosso di altri macchinari per l'industria alimentare e delle bevande",
  },
  "46.64.60": {
    en: "Wholesale of cleaning machines",
    it: "Commercio all'ingrosso di macchinari e attrezzature per la pulizia",
  },
  "46.64.91": {
    en: "Wholesale of measuring instruments and equipment",
    it: "Commercio all'ingrosso di strumenti e apparecchiature di misurazione",
  },
  "46.64.92": {
    en: "Wholesale of attractions for amusement and theme parks and video game machines",
    it: "Commercio all'ingrosso di attrazioni per parchi divertimento e parchi tematici e videogiochi",
  },
  "46.64.99": {
    en: "Wholesale of other various machinery and equipment n.e.c.",
    it: "Commercio all'ingrosso di altri macchinari e attrezzature varie n.c.a.",
  },
  "46.71.10": {
    en: "Wholesale of cars and light motor vehicles",
    it: "Commercio all'ingrosso di automobili e autoveicoli leggeri",
  },
  "46.71.20": {
    en: "Wholesale of other motor vehicles",
    it: "Commercio all'ingrosso di altri autoveicoli",
  },
  "46.72.00": {
    en: "Wholesale of motor vehicle parts and accessories",
    it: "Commercio all'ingrosso di parti e accessori di autoveicoli",
  },
  "46.73.10": {
    en: "Wholesale of motorcycles",
    it: "Commercio all'ingrosso di motocicli",
  },
  "46.73.20": {
    en: "Wholesale of motorcycles parts and accessories",
    it: "Commercio all'ingrosso di parti e accessori di motocicli",
  },
  "46.81.00": {
    en: "Wholesale of solid, liquid and gaseous fuels and related products",
    it: "Commercio all'ingrosso di combustibili solidi, liquidi, gassosi e di prodotti derivati",
  },
  "46.82.10": {
    en: "Wholesale of ferrous metals and ferrous metal ores",
    it: "Commercio all'ingrosso di metalli e minerali metalliferi ferrosi",
  },
  "46.82.21": {
    en: "Cash-for-gold wholesale activities",
    it: "Attività di compro oro",
  },
  "46.82.29": {
    en: "Wholesale of other non-ferrous metals and non-ferrous metal ores",
    it: "Commercio all'ingrosso di altri metalli e minerali metalliferi non ferrosi",
  },
  "46.83.10": {
    en: "Wholesale of wood",
    it: "Commercio all'ingrosso di legname",
  },
  "46.83.21": {
    en: "Wholesale of paints, varnishes and lacquers",
    it: "Commercio all'ingrosso di pitture, vernici e lacche",
  },
  "46.83.22": {
    en: "Wholesale wallpaper and floor coverings",
    it: "Commercio all'ingrosso di carta da parati e rivestimenti per pavimenti",
  },
  "46.83.23": {
    en: "Wholesale of doors, windows and shutters",
    it: "Commercio all'ingrosso di porte, finestre e persiane",
  },
  "46.83.29": {
    en: "Wholesale of other construction materials",
    it: "Commercio all'ingrosso di altri materiali da costruzione",
  },
  "46.83.30": {
    en: "Wholesale of sanitary equipment",
    it: "Commercio all'ingrosso di articoli igienico-sanitari",
  },
  "46.84.10": {
    en: "Wholesale of hardware equipment and supplies",
    it: "Commercio all'ingrosso di ferramenta",
  },
  "46.84.20": {
    en: "Wholesale of plumbing and heating equipment and supplies",
    it: "Commercio all'ingrosso di apparecchi e accessori per impianti idraulici e di riscaldamento",
  },
  "46.85.01": {
    en: "Wholesale of fertilisers and agrochemical products",
    it: "Commercio all'ingrosso di fertilizzanti e altri prodotti chimici per l'agricoltura",
  },
  "46.85.02": {
    en: "Wholesale of e-liquids for electronic cigarettes",
    it: "Commercio all'ingrosso di liquidi per inalazione per sigarette elettroniche",
  },
  "46.85.09": {
    en: "Wholesale of other chemical products",
    it: "Commercio all'ingrosso di altri prodotti chimici",
  },
  "46.86.10": {
    en: "Wholesale of plastic materials in primary forms and rubber",
    it: "Commercio all'ingrosso di materie plastiche in forme primarie e gomma",
  },
  "46.86.20": {
    en: "Wholesale of textile fibres",
    it: "Commercio all'ingrosso di fibre tessili",
  },
  "46.86.30": {
    en: "Wholesale of packaging articles",
    it: "Commercio all'ingrosso di articoli per imballaggio",
  },
  "46.86.90": {
    en: "Wholesale of other intermediate products n.e.c.",
    it: "Commercio all'ingrosso di altri prodotti intermedi n.c.a.",
  },
  "46.87.10": {
    en: "Wholesale of metal waste and scrap",
    it: "Commercio all'ingrosso di rottami e cascami metallici",
  },
  "46.87.90": {
    en: "Wholesale of other waste and scrap",
    it: "Commercio all'ingrosso di altri rottami e cascami",
  },
  "46.89.00": {
    en: "Other specialised wholesale n.e.c.",
    it: "Commercio all'ingrosso specializzato di altri prodotti n.c.a.",
  },
  "46.90.00": {
    en: "Non-specialised wholesale trade",
    it: "Commercio all'ingrosso non specializzato",
  },
  "47.11.01": {
    en: "Non-specialised retail sale of predominately frozen food",
    it: "Commercio al dettaglio non specializzato con prevalenza di prodotti alimentari surgelati",
  },
  "47.11.02": {
    en: "Non-specialised retail sale of predominately non-frozen food, beverages and tobacco",
    it: "Commercio al dettaglio non specializzato con prevalenza di altri prodotti alimentari, bevande o tabacchi",
  },
  "47.12.10": {
    en: "Non-specialised retail sale of predominately information equipment and electrical household appliances",
    it: "Commercio al dettaglio non specializzato con prevalenza di apparecchiature informatiche ed elettrodomestici",
  },
  "47.12.20": {
    en: "Non-specialised retail sale of predominately furniture and household goods",
    it: "Commercio al dettaglio non specializzato con prevalenza di mobili e articoli per uso domestico",
  },
  "47.12.30": {
    en: "Non-specialised retail sale of predominately hardware, building materials and plants",
    it: "Commercio al dettaglio non specializzato con prevalenza di ferramenta, materiali da costruzione e piante",
  },
  "47.12.40": {
    en: "Non-specialised retail sale of predominately cosmetic articles, toilet articles and detergents, stationery and games",
    it: "Commercio al dettaglio non specializzato con prevalenza di cosmetici, articoli di profumeria e detersivi, articoli di cancelleria e giochi",
  },
  "47.12.50": {
    en: "Non-specialised retail sale of predominately clothing and footwear",
    it: "Commercio al dettaglio non specializzato con prevalenza di articoli di abbigliamento e calzature",
  },
  "47.12.90": {
    en: "Other non-specialised retail sale n.e.c.",
    it: "Commercio al dettaglio non specializzato di altri prodotti n.c.a.",
  },
  "47.21.01": {
    en: "Retail sale of fresh fruit and vegetables",
    it: "Commercio al dettaglio di frutta e verdura fresca",
  },
  "47.21.02": {
    en: "Retail sale of dried and preserved fruit and vegetables",
    it: "Commercio al dettaglio di frutta e verdura secca e conservata",
  },
  "47.22.00": {
    en: "Retail sale of meat and meat products",
    it: "Commercio al dettaglio di carne e di prodotti a base di carne",
  },
  "47.23.00": {
    en: "Retail sale of fish, crustaceans and molluscs",
    it: "Commercio al dettaglio di pesce, crostacei e molluschi",
  },
  "47.24.10": {
    en: "Retail sale of bread",
    it: "Commercio al dettaglio di pane",
  },
  "47.24.20": {
    en: "Retail sale of cake and confectionery",
    it: "Commercio al dettaglio di pasticceria e dolciumi",
  },
  "47.25.00": {
    en: "Retail sale of beverages",
    it: "Commercio al dettaglio di bevande",
  },
  "47.26.01": {
    en: "Retail sale of tobacco in any form",
    it: "Commercio al dettaglio di tabacco in qualsiasi forma",
  },
  "47.26.02": {
    en: "Retail sale of electronic cigarettes and e-liquids",
    it: "Commercio al dettaglio di sigarette elettroniche e di liquidi per inalazione per sigarette elettroniche",
  },
  "47.26.09": {
    en: "Retail sale of other smoking accessories",
    it: "Commercio al dettaglio di altri accessori per fumatori",
  },
  "47.27.10": {
    en: "Retail sale of milk and dairy products",
    it: "Commercio al dettaglio di latte e prodotti lattiero-caseari",
  },
  "47.27.20": {
    en: "Retail sale of coffee",
    it: "Commercio al dettaglio di caffè",
  },
  "47.27.30": {
    en: "Retail sale of food supplements and dietetic products",
    it: "Commercio al dettaglio di integratori alimentari e prodotti dietetici",
  },
  "47.27.90": {
    en: "Retail sale of other food n.e.c.",
    it: "Commercio al dettaglio di altri prodotti alimentari n.c.a.",
  },
  "47.30.00": {
    en: "Retail sale of automotive fuel",
    it: "Commercio al dettaglio di carburanti per autotrazione",
  },
  "47.40.10": {
    en: "Retail sale of computers, peripheral equipment and software",
    it: "Commercio al dettaglio di computer, unità periferiche e software",
  },
  "47.40.20": {
    en: "Retail sale of telephone and communication equipment",
    it: "Commercio al dettaglio di apparecchiature per telecomunicazioni",
  },
  "47.40.30": {
    en: "Retail sale of audio and video equipment",
    it: "Commercio al dettaglio di apparecchiature radiotelevisive",
  },
  "47.51.10": {
    en: "Retail sale of apparel and furnishing type fabrics",
    it: "Commercio al dettaglio di tessuti per abbigliamento e arredamento",
  },
  "47.51.20": {
    en: "Retail sale of yarn and haberdashery",
    it: "Commercio al dettaglio di filati per maglieria e merceria",
  },
  "47.52.10": {
    en: "Retail sale of hardware, paints, glass, electrical and plumbing material and equipment",
    it: "Commercio al dettaglio di ferramenta, vernici, vetro e materiale elettrico e termoidraulico",
  },
  "47.52.20": {
    en: "Retail sale of sanitary and heating equipment",
    it: "Commercio al dettaglio di articoli igienico-sanitari e per riscaldamento",
  },
  "47.52.31": {
    en: "Retail sale of doors and windows",
    it: "Commercio al dettaglio di porte e finestre",
  },
  "47.52.32": {
    en: "Retail sale of other building material, bricks and tiles n.e.c.",
    it: "Commercio al dettaglio di altri materiali da costruzione, mattoni e piastrelle n.c.a.",
  },
  "47.52.40": {
    en: "Retail sale of garden and landscaping equipment",
    it: "Commercio al dettaglio di attrezzature per il giardinaggio e la paesaggistica",
  },
  "47.53.11": {
    en: "Retail sale of carpets and rugs",
    it: "Commercio al dettaglio di tappeti e moquette",
  },
  "47.53.12": {
    en: "Retail trade of curtains and net curtains",
    it: "Commercio al dettaglio di tende",
  },
  "47.53.20": {
    en: "Retail sale of wall and floor coverings",
    it: "Commercio al dettaglio di rivestimenti per pareti e pavimenti",
  },
  "47.54.00": {
    en: "Retail sale of electrical household appliances",
    it: "Commercio al dettaglio di elettrodomestici",
  },
  "47.55.10": {
    en: "Retail sale of household furniture",
    it: "Commercio al dettaglio di mobili per la casa",
  },
  "47.55.20": {
    en: "Retail sale of other furniture",
    it: "Commercio al dettaglio di altri mobili",
  },
  "47.55.30": {
    en: "Retail sale of lighting equipment",
    it: "Commercio al dettaglio di articoli per l'illuminazione",
  },
  "47.55.40": {
    en: "Retail sale of tableware and kitchenware",
    it: "Commercio al dettaglio di articoli per la tavola e la cucina",
  },
  "47.55.90": {
    en: "Retail sale of baby equipment and other household goods",
    it: "Commercio al dettaglio di attrezzature per bambini e altri articoli per la casa",
  },
  "47.61.00": {
    en: "Retail sale of books",
    it: "Commercio al dettaglio di libri",
  },
  "47.62.10": {
    en: "Retail sale of newspapers, and other periodical publications",
    it: "Commercio al dettaglio di giornali e altre pubblicazioni periodiche",
  },
  "47.62.20": {
    en: "Retail sale of stationery",
    it: "Commercio al dettaglio di articoli di cancelleria",
  },
  "47.63.10": {
    en: "Retail sale of boats",
    it: "Commercio al dettaglio di imbarcazioni",
  },
  "47.63.21": {
    en: "Retail of bicycles",
    it: "Commercio al dettaglio di biciclette",
  },
  "47.63.29": {
    en: "Retail of other sporting equipment",
    it: "Commercio al dettaglio di altre attrezzature sportive",
  },
  "47.64.00": {
    en: "Retail sale of games and toys",
    it: "Commercio al dettaglio di giochi e giocattoli",
  },
  "47.69.11": {
    en: "Retail sale of recorded media",
    it: "Commercio al dettaglio di supporti registrati",
  },
  "47.69.12": {
    en: "Retail sale of musical instruments",
    it: "Commercio al dettaglio di strumenti musicali",
  },
  "47.69.20": {
    en: "Retail sale of philately, numismatics and collectors' items",
    it: "Commercio al dettaglio di articoli di filatelia, numismatica e da collezionismo",
  },
  "47.69.30": {
    en: "Retail sale of art supplies",
    it: "Commercio al dettaglio di articoli per disegno, pittura e scultura",
  },
  "47.69.91": {
    en: "Retail sale of works of art",
    it: "Commercio al dettaglio di opere d'arte",
  },
  "47.69.99": {
    en: "Retail sale of other various cultural and recreational goods n.e.c.",
    it: "Commercio al dettaglio di altri articoli vari culturali e ricreativi n.c.a.",
  },
  "47.71.10": {
    en: "Retail sale of clothing for adults",
    it: "Commercio al dettaglio di articoli di abbigliamento per adulti",
  },
  "47.71.20": {
    en: "Retail sale of clothing for babies and children",
    it: "Commercio al dettaglio di articoli di abbigliamento per neonati e bambini",
  },
  "47.71.30": {
    en: "Retail sale of underwear",
    it: "Commercio al dettaglio di articoli di biancheria intima",
  },
  "47.71.40": {
    en: "Retail sale of leather and fur wearing apparel",
    it: "Commercio al dettaglio di articoli di abbigliamento in pelle e pelliccia",
  },
  "47.71.50": {
    en: "Retail sale of clothing accessories",
    it: "Commercio al dettaglio di accessori per l'abbigliamento",
  },
  "47.72.11": {
    en: "Retail sale of footwear and footwear accessories for adults",
    it: "Commercio al dettaglio di calzature e accessori per calzature per adulti",
  },
  "47.72.12": {
    en: "Retail sale of footwear and footwear accessories for babies and children",
    it: "Commercio al dettaglio di calzature e accessori per calzature per neonati e bambini",
  },
  "47.72.20": {
    en: "Retail sale of leather goods and travel accessories",
    it: "Commercio al dettaglio di articoli in pelle e articoli da viaggio",
  },
  "47.73.10": {
    en: "Retail sale of pharmaceutical products subject to medical prescription",
    it: "Commercio al dettaglio di medicinali soggetti a prescrizione medica",
  },
  "47.73.20": {
    en: "Retail sale of herbal remedies",
    it: "Commercio al dettaglio di rimedi erboristici",
  },
  "47.73.90": {
    en: "Retail sale of other pharmaceutical products",
    it: "Commercio al dettaglio di altri prodotti farmaceutici",
  },
  "47.74.01": {
    en: "Retail sale of glasses, sunglasses and lenses",
    it: "Commercio al dettaglio di occhiali e lenti",
  },
  "47.74.09": {
    en: "Retail sale of other medical and orthopaedic goods",
    it: "Commercio al dettaglio di altri articoli medicali e ortopedici",
  },
  "47.75.00": {
    en: "Retail sale of cosmetic and toilet articles",
    it: "Commercio al dettaglio di cosmetici e di articoli di profumeria",
  },
  "47.76.10": {
    en: "Retail sale of flowers, plants and fertilisers",
    it: "Commercio al dettaglio di fiori, piante e fertilizzanti",
  },
  "47.76.20": {
    en: "Retail sale of pets and pet food",
    it: "Commercio al dettaglio di animali da compagnia e alimenti per animali da compagnia",
  },
  "47.77.00": {
    en: "Retail sale of watches and jewellery",
    it: "Commercio al dettaglio di orologi e articoli di gioielleria",
  },
  "47.78.10": {
    en: "Retail sale of photographic and optical equipment",
    it: "Commercio al dettaglio di articoli per fotografia e ottica",
  },
  "47.78.21": {
    en: "Retail sale of souvenirs",
    it: "Commercio al dettaglio di souvenir",
  },
  "47.78.22": {
    en: "Retail sale of craftwork",
    it: "Commercio al dettaglio di articoli di artigianato",
  },
  "47.78.23": {
    en: "Retail sale of religious articles",
    it: "Commercio al dettaglio di articoli religiosi",
  },
  "47.78.24": {
    en: "Retail sale of imitation jewellery",
    it: "Commercio al dettaglio di bigiotteria",
  },
  "47.78.25": {
    en: "Retail sale of party favours",
    it: "Commercio al dettaglio di bomboniere",
  },
  "47.78.30": {
    en: "Retail sale of sources for household heating",
    it: "Commercio al dettaglio di combustibile per uso domestico, bombole di gas, carbone e legna da ardere",
  },
  "47.78.40": {
    en: "Retail sale of cleaning products",
    it: "Commercio al dettaglio di prodotti per la pulizia",
  },
  "47.78.91": {
    en: "Retail sale of packaging articles",
    it: "Commercio al dettaglio di articoli per imballaggio",
  },
  "47.78.92": {
    en: "Retail sale of funeral and cemetery articles",
    it: "Commercio al dettaglio di articoli funerari e cimiteriali",
  },
  "47.78.93": {
    en: "Retail sale of sex articles for adults",
    it: "Commercio al dettaglio di articoli per adulti",
  },
  "47.78.99": {
    en: "Retail sale of other various new goods n.e.c.",
    it: "Commercio al dettaglio di altri prodotti vari non di seconda mano n.c.a.",
  },
  "47.79.10": {
    en: "Retail sale of second-hand books",
    it: "Commercio al dettaglio di libri di seconda mano",
  },
  "47.79.20": {
    en: "Retail sale of antiques and second-hand furniture",
    it: "Commercio al dettaglio di oggetti di antiquariato e mobili di seconda mano",
  },
  "47.79.31": {
    en: "Retail sale of second-hand clothes",
    it: "Commercio al dettaglio di articoli di abbigliamento di seconda mano",
  },
  "47.79.32": {
    en: "Retail sale of second-hand watches and jewellery",
    it: "Commercio al dettaglio di orologi e articoli di gioielleria di seconda mano",
  },
  "47.79.39": {
    en: "Retail sale of other second-hand goods n.e.c.",
    it: "Commercio al dettaglio di altri articoli di seconda mano n.c.a.",
  },
  "47.81.10": {
    en: "Retail sale of cars and light motor vehicles",
    it: "Commercio al dettaglio di automobili e autoveicoli leggeri",
  },
  "47.81.20": {
    en: "Retail sale of other motor vehicles",
    it: "Commercio al dettaglio di altri autoveicoli",
  },
  "47.82.00": {
    en: "Retail sale of motor vehicle parts and accessories",
    it: "Commercio al dettaglio di parti e accessori di autoveicoli",
  },
  "47.83.10": {
    en: "Retail sale of motorcycles",
    it: "Commercio al dettaglio di motocicli",
  },
  "47.83.20": {
    en: "Retail sale of motorcycle parts and accessories",
    it: "Commercio al dettaglio di parti e accessori di motocicli",
  },
  "47.91.10": {
    en: "Intermediation service activities for non-specialised retail sale of second-hand goods",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio non specializzato di articoli di seconda mano",
  },
  "47.91.20": {
    en: "Intermediation service activities for non-specialised retail sale of new goods",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio non specializzato di prodotti nuovi",
  },
  "47.92.10": {
    en: "Intermediation service activities for specialised retail sale of food and beverages",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di prodotti alimentari e bevande",
  },
  "47.92.21": {
    en: "Intermediation service activities for specialised retail sale of second-hand motor vehicles and motorcycles",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di autoveicoli e motocicli di seconda mano",
  },
  "47.92.22": {
    en: "Intermediation service activities for specialised retail sale of motor vehicle and motorcycle second-hand parts and accessories",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di parti e accessori di autoveicoli e motocicli di seconda mano",
  },
  "47.92.29": {
    en: "Intermediation service activities for specialised retail sale of other second-hand goods",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di altri articoli di seconda mano",
  },
  "47.92.31": {
    en: "Intermediation service activities for specialised retail sale of new motor vehicles",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di autoveicoli, esclusi articoli di seconda mano",
  },
  "47.92.32": {
    en: "Intermediation service activities for specialised retail sale of new motor vehicle parts and accessories",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di parti e accessori di autoveicoli, esclusi articoli di seconda mano",
  },
  "47.92.33": {
    en: "Intermediation service activities for specialised retail sale of new motorcycles, motorcycle parts and accessories",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di motocicli, parti e accessori di motocicli, esclusi articoli di seconda mano",
  },
  "47.92.34": {
    en: "Intermediation service activities for specialised retail sale of new electrical household appliances and other household goods",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di elettrodomestici e altri articoli per la casa, esclusi articoli di seconda mano",
  },
  "47.92.35": {
    en: "Intermediation service activities for specialised retail sale of new textiles, clothing and footwear",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di prodotti tessili, articoli di abbigliamento e calzature, esclusi articoli di seconda mano",
  },
  "47.92.36": {
    en: "Intermediation service activities for specialised retail sale of new cosmetic and toilet articles",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di cosmetici e di articoli di profumeria, esclusi articoli di seconda mano",
  },
  "47.92.39": {
    en: "Intermediation service activities for specialised retail sale of new goods n.e.c.",
    it: "Attività di servizi di intermediazione per il commercio al dettaglio specializzato di prodotti nuovi n.c.a.",
  },
  "49.11.00": {
    en: "Passenger heavy rail transport",
    it: "Trasporto di passeggeri su ferrovia pesante",
  },
  "49.12.00": {
    en: "Other passenger rail transport",
    it: "Altri trasporti ferroviari di passeggeri",
  },
  "49.20.00": {
    en: "Freight rail transport",
    it: "Trasporto ferroviario di merci",
  },
  "49.31.01": {
    en: "Scheduled passenger transport by road for sightseeing",
    it: "Trasporto di linea di passeggeri su strada specializzato per visite turistiche",
  },
  "49.31.02": {
    en: "Other scheduled passenger transport by road",
    it: "Altri trasporti di linea di passeggeri su strada",
  },
  "49.32.01": {
    en: "Non-scheduled passenger transport by road for sightseeing",
    it: "Trasporto non di linea di passeggeri su strada specializzato per visite turistiche",
  },
  "49.32.02": {
    en: "Other non-scheduled passenger transport by road",
    it: "Altri trasporti non di linea di passeggeri su strada",
  },
  "49.33.10": {
    en: "Taxi services",
    it: "Trasporto su taxi",
  },
  "49.33.20": {
    en: "Private hire vehicles with driver",
    it: "Trasporto su veicoli a noleggio con conducente",
  },
  "49.34.00": {
    en: "Passenger transport by cableways and ski lifts",
    it: "Trasporto di passeggeri mediante funivie e sciovie",
  },
  "49.39.00": {
    en: "Other passenger land transport n.e.c.",
    it: "Altri trasporti terrestri di passeggeri n.c.a.",
  },
  "49.41.00": {
    en: "Freight transport by road",
    it: "Trasporto di merci su strada",
  },
  "49.42.00": {
    en: "Removal services",
    it: "Servizi di trasloco",
  },
  "49.50.10": {
    en: "Transport of gases via pipeline",
    it: "Trasporto mediante condotte di gas",
  },
  "49.50.20": {
    en: "Transport of liquids via pipeline",
    it: "Trasporto mediante condotte di liquidi",
  },
  "50.10.00": {
    en: "Sea and coastal passenger water transport",
    it: "Trasporto marittimo e costiero di passeggeri",
  },
  "50.20.00": {
    en: "Sea and coastal freight water transport",
    it: "Trasporto marittimo e costiero di merci",
  },
  "50.30.00": {
    en: "Inland passenger water transport",
    it: "Trasporto per vie d'acqua interne di passeggeri",
  },
  "50.40.00": {
    en: "Inland freight water transport",
    it: "Trasporto per vie d'acqua interne di merci",
  },
  "51.10.10": {
    en: "Scheduled air transport of passengers",
    it: "Trasporto aereo di linea di passeggeri",
  },
  "51.10.20": {
    en: "Non-scheduled air transport of passengers",
    it: "Trasporto aereo non di linea di passeggeri",
  },
  "51.21.00": {
    en: "Freight air transport",
    it: "Trasporto aereo di merci",
  },
  "51.22.00": {
    en: "Space transport",
    it: "Trasporto spaziale",
  },
  "52.10.10": {
    en: "Operation of non-refrigerated storage and warehouse facilities",
    it: "Magazzinaggio e deposito non refrigerato",
  },
  "52.10.20": {
    en: "Operation of refrigerated warehouses and cool stores",
    it: "Magazzinaggio e deposito refrigerato",
  },
  "52.21.10": {
    en: "Operation of railroad infrastructure and rail related facilities",
    it: "Gestione di infrastrutture ferroviarie",
  },
  "52.21.20": {
    en: "Operation and maintenance of roads",
    it: "Gestione e manutenzione di strade",
  },
  "52.21.30": {
    en: "Operation of bus stations",
    it: "Gestione di stazioni per autobus",
  },
  "52.21.40": {
    en: "Operation of stations for the handling of goods",
    it: "Gestione di centri di movimentazione merci",
  },
  "52.21.50": {
    en: "Operation of parking lots and garages",
    it: "Gestione di parcheggi e autorimesse",
  },
  "52.21.60": {
    en: "Towing and roadside assistance",
    it: "Attività di traino e soccorso stradale",
  },
  "52.21.90": {
    en: "Other service activities incidental to land transportation",
    it: "Altri servizi di supporto al trasporto terrestre",
  },
  "52.22.01": {
    en: "Liquefaction and regasification of natural gas for the purpose of water transportation",
    it: "Liquefazione e rigassificazione di gas a scopo di trasporto marittimo e per vie d'acqua interne",
  },
  "52.22.09": {
    en: "Other service activities incidental to water transportation",
    it: "Altri servizi di supporto al trasporto marittimo e per vie d'acqua interne",
  },
  "52.23.00": {
    en: "Service activities incidental to air transportation",
    it: "Servizi di supporto al trasporto aereo",
  },
  "52.24.10": {
    en: "Cargo handling incidental to air transportation",
    it: "Movimentazione merci relativa a trasporti aerei",
  },
  "52.24.20": {
    en: "Cargo handling incidental to water transportation",
    it: "Movimentazione merci relativa a trasporti marittimi e per vie d'acqua interne",
  },
  "52.24.30": {
    en: "Cargo handling incidental to rail transportation",
    it: "Movimentazione merci relativa a trasporti ferroviari",
  },
  "52.24.40": {
    en: "Cargo handling incidental to other land transportation",
    it: "Movimentazione merci relativa ad altri trasporti terrestri",
  },
  "52.25.01": {
    en: "Logistics service activities for works of art",
    it: "Servizi di logistica per opere d'arte",
  },
  "52.25.09": {
    en: "Other logistics service activities",
    it: "Altri servizi di logistica",
  },
  "52.26.01": {
    en: "Activities of customs agents",
    it: "Attività di agenti e agenzie di dogana",
  },
  "52.26.02": {
    en: "Freight forwarding services",
    it: "Attività di spedizione merci",
  },
  "52.31.00": {
    en: "Intermediation service activities for freight transportation",
    it: "Attività di servizi di intermediazione per il trasporto di merci",
  },
  "52.32.00": {
    en: "Intermediation service activities for passenger transportation",
    it: "Attività di servizi di intermediazione per il trasporto di passeggeri",
  },
  "53.10.00": {
    en: "Postal activities under universal service obligation",
    it: "Attività postali con obbligo di servizio universale",
  },
  "53.20.00": {
    en: "Other postal and courier activities",
    it: "Altre attività postali e di corriere",
  },
  "53.30.00": {
    en: "Intermediation service activities for postal and courier activities",
    it: "Attività di servizi di intermediazione per attività postali e di corriere",
  },
  "55.10.00": {
    en: "Hotels and similar accommodation",
    it: "Servizi di alloggio di alberghi e simili",
  },
  "55.20.10": {
    en: "Accommodation in hostels",
    it: "Ostelli",
  },
  "55.20.20": {
    en: "Accommodation in mountain huts and lodges",
    it: "Rifugi e baite di montagna",
  },
  "55.20.31": {
    en: "Religious accommodation",
    it: "Case religiose di ospitalità",
  },
  "55.20.32": {
    en: "Other social accommodation",
    it: "Altre case sociali di ospitalità",
  },
  "55.20.41": {
    en: "Bed and breakfast units",
    it: "Bed and breakfast",
  },
  "55.20.42": {
    en: "Accommodation by private households",
    it: "Servizi di alloggio in camere, case e appartamenti per vacanze",
  },
  "55.20.51": {
    en: "Accommodation on farms",
    it: "Servizi di alloggio in aziende agricole",
  },
  "55.20.52": {
    en: "Accommodation on fish farms",
    it: "Servizi di alloggio in aziende ittiche",
  },
  "55.30.01": {
    en: "Camping grounds",
    it: "Campeggi",
  },
  "55.30.02": {
    en: "Camping villages, including glamping",
    it: "Villaggi turistici e alloggi glamping",
  },
  "55.30.03": {
    en: "Recreational vehicle parks",
    it: "Aree attrezzate per veicoli ricreazionali",
  },
  "55.30.04": {
    en: "Marina resorts",
    it: "Marina resort",
  },
  "55.40.00": {
    en: "Intermediation service activities for accommodation",
    it: "Attività di servizi di intermediazione per servizi di alloggio",
  },
  "55.90.00": {
    en: "Other accommodation",
    it: "Altri servizi di alloggio",
  },
  "56.11.11": {
    en: "Table-service restaurants, other than ice cream parlours and pastry shops",
    it: "Attività di ristoranti con servizio al tavolo, escluse gelaterie e pasticcerie",
  },
  "56.11.12": {
    en: "Self-service or takeaway restaurants, other than ice cream parlours and pastry shops",
    it: "Attività di ristoranti senza servizio al tavolo o da asporto, escluse gelaterie e pasticcerie",
  },
  "56.11.21": {
    en: "Table-service ice cream parlours",
    it: "Attività di gelaterie con servizio al tavolo",
  },
  "56.11.22": {
    en: "Self-service or take-away ice cream parlours",
    it: "Attività di gelaterie senza servizio al tavolo o da asporto",
  },
  "56.11.23": {
    en: "Table-service pastry shops",
    it: "Attività di pasticcerie con servizio al tavolo",
  },
  "56.11.24": {
    en: "Self-service or takeaway pastry shops",
    it: "Attività di pasticcerie senza servizio al tavolo o da asporto",
  },
  "56.11.91": {
    en: "Restaurant activities on the premises on farms",
    it: "Attività di ristoranti connesse alle aziende agricole",
  },
  "56.11.92": {
    en: "Restaurant activities on the premises on fish farms",
    it: "Attività di ristoranti connesse alle aziende ittiche",
  },
  "56.11.93": {
    en: "Restaurant activities on transport equipment",
    it: "Attività di ristoranti a bordo di mezzi di trasporto",
  },
  "56.12.01": {
    en: "Mobile food service activities by restaurants and other similar food operators",
    it: "Attività di servizi di ristorazione mobile di ristoranti e altri esercizi di ristorazione simili",
  },
  "56.12.02": {
    en: "Mobile food service activities by ice cream vendors",
    it: "Attività di servizi di ristorazione mobile di gelaterie",
  },
  "56.12.03": {
    en: "Mobile food service activities by pastry vendors",
    it: "Attività di servizi di ristorazione mobile di pasticcerie",
  },
  "56.21.01": {
    en: "Event catering activities on the premises of the client organisation",
    it: "Attività di catering per eventi presso location dei clienti",
  },
  "56.21.02": {
    en: "Event catering activities on the premises of catering halls",
    it: "Attività di catering per eventi presso sale per banchetti",
  },
  "56.22.01": {
    en: "Contract catering service activities",
    it: "Attività di servizi di catering su base contrattuale",
  },
  "56.22.02": {
    en: "Other food service activities",
    it: "Altri servizi di ristorazione",
  },
  "56.30.01": {
    en: "Beverage serving activities in bars and coffee houses",
    it: "Attività di somministrazione di bevande in bar e caffetterie",
  },
  "56.30.02": {
    en: "Beverage serving activities in cocktail lounges",
    it: "Attività di somministrazione di bevande in lounge cocktail bar",
  },
  "56.30.03": {
    en: "Mobile beverage serving activities",
    it: "Attività di somministrazione mobile di bevande",
  },
  "56.30.04": {
    en: "Bar activities on transport equipment",
    it: "Attività di somministrazione di bevande a bordo di mezzi di trasporto",
  },
  "56.40.00": {
    en: "Intermediation service activities for food and beverage services activities",
    it: "Attività di servizi di intermediazione per servizi di ristorazione",
  },
  "58.11.00": {
    en: "Publishing of books",
    it: "Edizione di libri",
  },
  "58.12.00": {
    en: "Publishing of newspapers",
    it: "Edizione di quotidiani",
  },
  "58.13.00": {
    en: "Publishing of journals and periodicals",
    it: "Edizione di riviste e periodici",
  },
  "58.19.00": {
    en: "Other publishing activities, except software publishing",
    it: "Altre attività editoriali, esclusa l'edizione di software",
  },
  "58.21.00": {
    en: "Publishing of video games",
    it: "Edizione di videogiochi",
  },
  "58.29.00": {
    en: "Other software publishing",
    it: "Edizione di altri software",
  },
  "59.11.00": {
    en: "Motion picture, video and television programme production activities",
    it: "Attività di produzione cinematografica, di video e programmi televisivi",
  },
  "59.12.00": {
    en: "Motion picture, video and television programme post-production activities",
    it: "Attività di post-produzione cinematografica, di video e programmi televisivi",
  },
  "59.13.00": {
    en: "Motion picture and video distribution activities",
    it: "Attività di distribuzione cinematografica, di video e programmi televisivi",
  },
  "59.14.00": {
    en: "Motion picture projection activities",
    it: "Attività di proiezione cinematografica",
  },
  "59.20.10": {
    en: "Sound recording activities",
    it: "Attività di registrazione sonora",
  },
  "59.20.20": {
    en: "Music publishing activities",
    it: "Editoria musicale",
  },
  "60.10.00": {
    en: "Radio broadcasting and audio distribution activities",
    it: "Attività di trasmissione radiofonica e distribuzione di audio",
  },
  "60.20.00": {
    en: "Television programming, broadcasting and video distribution activities",
    it: "Attività di programmazione e trasmissione televisive e di distribuzione di video",
  },
  "60.31.00": {
    en: "News agency activities",
    it: "Attività delle agenzie di stampa",
  },
  "60.39.00": {
    en: "Other content distribution activities",
    it: "Altre attività di distribuzione di contenuti",
  },
  "61.10.01": {
    en: "Wired telecommunication activities",
    it: "Attività di telecomunicazioni fisse",
  },
  "61.10.02": {
    en: "Wireless telecommunication activities",
    it: "Attività di telecomunicazioni mobili",
  },
  "61.10.03": {
    en: "Satellite telecommunication activities",
    it: "Attività di telecomunicazioni satellitari",
  },
  "61.20.00": {
    en: "Telecommunication reselling activities and intermediation service activities for telecommunication",
    it: "Attività di rivendita di telecomunicazioni e attività di servizi di intermediazione per telecomunicazioni",
  },
  "61.90.10": {
    en: "Provision of internet access",
    it: "Erogazione di servizi di accesso a Internet",
  },
  "61.90.20": {
    en: "Provision of text messaging and notification services",
    it: "Erogazione di servizi di messaggistica e di notifica",
  },
  "61.90.90": {
    en: "Other telecommunication activities n.e.c.",
    it: "Altre attività di telecomunicazioni n.c.a.",
  },
  "62.10.00": {
    en: "Computer programming activities",
    it: "Attività di programmazione informatica",
  },
  "62.20.10": {
    en: "Computer consultancy",
    it: "Attività di consulenza informatica",
  },
  "62.20.20": {
    en: "Computer facilities management activities",
    it: "Attività di gestione di strutture informatiche",
  },
  "62.90.01": {
    en: "Installation (setting-up) of personal computers",
    it: "Configurazione di personal computer",
  },
  "62.90.09": {
    en: "Other information technology and computer service activities n.e.c.",
    it: "Altre attività dei servizi connessi alle tecnologie dell'informazione e dell'informatica n.c.a.",
  },
  "63.10.10": {
    en: "Computing infrastructure, hosting and related activities",
    it: "Fornitura di infrastrutture informatiche, hosting e attività connesse",
  },
  "63.10.21": {
    en: "Accounting data processing",
    it: "Elaborazione dati contabili",
  },
  "63.10.29": {
    en: "Other data processing",
    it: "Elaborazione altri dati",
  },
  "63.91.00": {
    en: "Web search portal activities",
    it: "Attività dei portali di ricerca sul web",
  },
  "63.92.00": {
    en: "Other information service activities",
    it: "Altre attività dei servizi di informazione",
  },
  "64.11.00": {
    en: "Central banking",
    it: "Attività delle banche centrali",
  },
  "64.19.10": {
    en: "Other monetary intermediation provided by monetary institutions other than central banks",
    it: "Altre intermediazioni monetarie fornite da istituti monetari diversi dalla banca centrale",
  },
  "64.19.20": {
    en: "Other monetary intermediation provided by electronic money issuers",
    it: "Altre intermediazioni monetarie fornite da istituti di moneta elettronica",
  },
  "64.19.30": {
    en: "Other monetary intermediation provided by Cassa Depositi e Prestiti (CDP)",
    it: "Altre intermediazioni monetarie fornite da Cassa Depositi e Prestiti (CDP)",
  },
  "64.21.00": {
    en: "Activities of holding companies",
    it: "Attività delle società di partecipazione (holding)",
  },
  "64.22.00": {
    en: "Activities of financing conduits",
    it: "Attività dei conduit di finanziamento",
  },
  "64.31.00": {
    en: "Activities of money market and non-money market investments funds",
    it: "Attività dei fondi di investimento del mercato monetario e del mercato non monetario",
  },
  "64.32.00": {
    en: "Activities of trust, estate and agency accounts",
    it: "Attività di conti fiduciari, per la gestione dell'eredità e di agenzia",
  },
  "64.91.00": {
    en: "Financial leasing",
    it: "Leasing finanziario",
  },
  "64.92.10": {
    en: "Factoring activities",
    it: "Attività di factoring",
  },
  "64.92.91": {
    en: "Other credit granting provided by loan guarantee consortia",
    it: "Altre attività di concessione del credito fornite dai consorzi di garanzia collettiva fidi",
  },
  "64.92.99": {
    en: "Other various credit granting n.e.c.",
    it: "Altre attività varie di concessione del credito n.c.a.",
  },
  "64.99.00": {
    en: "Other financial service activities, except insurance and pension funding n.e.c.",
    it: "Altre attività di servizi finanziari, ad esclusione di assicurazioni e fondi pensione n.c.a.",
  },
  "65.11.00": {
    en: "Life insurance",
    it: "Assicurazioni sulla vita",
  },
  "65.12.00": {
    en: "Non-life insurance",
    it: "Assicurazioni diverse da quelle sulla vita",
  },
  "65.20.00": {
    en: "Reinsurance",
    it: "Riassicurazioni",
  },
  "65.30.00": {
    en: "Pension funding",
    it: "Fondi pensione",
  },
  "66.11.00": {
    en: "Administration of financial markets",
    it: "Amministrazione di mercati finanziari",
  },
  "66.12.00": {
    en: "Security and commodity contracts brokerage",
    it: "Attività di negoziazione di contratti relativi a titoli e merci",
  },
  "66.19.10": {
    en: "Financial transaction processing and settlement activities",
    it: "Attività di elaborazione e liquidazione delle transazioni finanziarie tramite carta di credito",
  },
  "66.19.21": {
    en: "Financial advisory activities provided by financial advisors authorised for off-branch offerings",
    it: "Attività di consulenza finanziaria fornite da consulenti finanziari abilitati all'offerta fuori sede",
  },
  "66.19.22": {
    en: "Other financial advisory activities",
    it: "Altre attività di consulenza finanziaria",
  },
  "66.19.90": {
    en: "Other activities auxiliary to financial services n.e.c., except insurance and pension funding",
    it: "Altre attività ausiliarie dei servizi finanziari n.c.a., escluse assicurazioni e fondi pensione",
  },
  "66.21.00": {
    en: "Risk and damage evaluation",
    it: "Valutazione dei rischi e dei danni",
  },
  "66.22.00": {
    en: "Activities of insurance agents and brokers",
    it: "Attività di agenti e intermediari delle assicurazioni",
  },
  "66.29.01": {
    en: "Financial supervisory activities for insurance and pension funding",
    it: "Attività di vigilanza su assicurazioni e fondi pensione",
  },
  "66.29.09": {
    en: "Other activities auxiliary to insurance and pension funding n.e.c.",
    it: "Altre attività ausiliarie delle assicurazioni e dei fondi pensione n.c.a.",
  },
  "66.30.01": {
    en: "Management of collective investment undertakings, pension funds and portfolio",
    it: "Gestione di organismi di investimento collettivo del risparmio, fondi pensione e portafogli",
  },
  "66.30.02": {
    en: "Trustee services",
    it: "Servizi di gestione di trust",
  },
  "66.30.03": {
    en: "Fiduciary and custody services",
    it: "Servizi fiduciari e di custodia",
  },
  "68.11.00": {
    en: "Buying and selling of own real estate",
    it: "Compravendita di beni immobili effettuata su beni propri",
  },
  "68.12.00": {
    en: "Development of building projects",
    it: "Sviluppo di progetti immobiliari",
  },
  "68.20.01": {
    en: "Rental and operating of own or leased non-residential land for telecommunication activities",
    it: "Affitto e gestione di terreni per telecomunicazioni propri o in locazione",
  },
  "68.20.02": {
    en: "Rental and operating of own or leased non-residential land and buildings, plants and factories",
    it: "Affitto e gestione di altri terreni ed edifici non residenziali, impianti e fabbriche propri o in locazione",
  },
  "68.20.09": {
    en: "Rental and operating of own or leased real estate n.e.c.",
    it: "Affitto e gestione di beni immobili propri o in locazione n.c.a.",
  },
  "68.31.00": {
    en: "Intermediation service activities for real estate activities",
    it: "Attività di servizi di intermediazione per attività immobiliari",
  },
  "68.32.01": {
    en: "Management of real estate on a fee or contract basis",
    it: "Gestione di beni immobili per conto terzi",
  },
  "68.32.09": {
    en: "Other real estate activities on a fee or contract basis n.e.c.",
    it: "Altre attività immobiliari per conto terzi n.c.a.",
  },
  "69.10.10": {
    en: "Legal advice and representation activities",
    it: "Attività legali e giuridiche",
  },
  "69.10.20": {
    en: "Notarial activities",
    it: "Attività notarili",
  },
  "69.10.30": {
    en: "Support activities for legal activities",
    it: "Attività di supporto alle attività legali, giuridiche e notarili",
  },
  "69.20.01": {
    en: "Activities provided by accountants",
    it: "Attività di commercialisti",
  },
  "69.20.02": {
    en: "Activities provided by accounting auditors",
    it: "Attività di revisori legali in ambito contabile",
  },
  "69.20.03": {
    en: "Activities provided by accounting experts",
    it: "Attività di esperti contabili",
  },
  "69.20.04": {
    en: "Activities provided by labour consultants",
    it: "Attività di consulenti del lavoro",
  },
  "69.20.05": {
    en: "Activities provided by other similar consultants in the field of payroll accounting",
    it: "Attività di altri soggetti simili in materia di contabilità delle retribuzioni e buste paga",
  },
  "69.20.06": {
    en: "Activities provided by accounting consultants and other similar consultants",
    it: "Attività di altri consulenti, periti e altri soggetti simili in ambito tributario e contabile",
  },
  "69.20.07": {
    en: "Activities provided by tax assistance centres",
    it: "Attività di centri di assistenza fiscale",
  },
  "70.10.00": {
    en: "Activities of head offices",
    it: "Attività di sedi centrali",
  },
  "70.20.01": {
    en: "Logistics management consulting activities",
    it: "Attività di consulenza in materia di logistica",
  },
  "70.20.02": {
    en: "Certification of processes",
    it: "Attività di certificazione di processi",
  },
  "70.20.09": {
    en: "Business and other management consultancy activities n.e.c.",
    it: "Consulenza imprenditoriale e altre attività di consulenza gestionale n.c.a.",
  },
  "71.11.01": {
    en: "Design, planning and overseeing of archaeological excavations",
    it: "Progettazione, pianificazione e supervisione di scavi archeologici",
  },
  "71.11.09": {
    en: "Architectural activities n.e.c.",
    it: "Attività di architettura n.c.a.",
  },
  "71.12.10": {
    en: "Engineering activities",
    it: "Attività di ingegneria",
  },
  "71.12.20": {
    en: "Project management activities related to integrated engineering",
    it: "Gestione di progetti relativi a opere di ingegneria integrata",
  },
  "71.12.30": {
    en: "Technical consulting provided by surveyors",
    it: "Elaborazione e supervisione di progetti da parte di geometri",
  },
  "71.12.40": {
    en: "Cartographic and aerophotogrammetric activities",
    it: "Attività di cartografia e aerofotogrammetria",
  },
  "71.12.50": {
    en: "Geophysical and geodetic surveying activities",
    it: "Attività di geologia, di prospezione geognostica e mineraria",
  },
  "71.20.11": {
    en: "Technical testing and analysis for archaeological surveys",
    it: "Collaudi e analisi tecniche per indagini archeologiche",
  },
  "71.20.19": {
    en: "Other technical testing and analysis of products",
    it: "Altri collaudi e analisi tecniche di prodotti",
  },
  "71.20.21": {
    en: "Product origin assessment activities",
    it: "Attività di riconoscimento dell'origine dei prodotti",
  },
  "71.20.22": {
    en: "Periodic road-safety testing of motor vehicles and motorcycles",
    it: "Revisione periodica a norma di legge dell'idoneità alla circolazione di autoveicoli e motocicli",
  },
  "71.20.29": {
    en: "Other quality assessment and certification of products",
    it: "Altre attività di controllo di qualità e certificazione di prodotti",
  },
  "72.10.10": {
    en: "Research and experimental development on biotechnology",
    it: "Ricerca e sviluppo sperimentale nel campo delle biotecnologie",
  },
  "72.10.21": {
    en: "Research and experimental development on geology",
    it: "Ricerca e sviluppo sperimentale nel campo della geologia",
  },
  "72.10.22": {
    en: "Research and experimental development on conservation science",
    it: "Ricerca e sviluppo sperimentale nel campo della diagnostica per la conservazione dei beni culturali",
  },
  "72.10.29": {
    en: "Other research and experimental development on natural sciences and engineering n.e.c.",
    it: "Ricerca e sviluppo sperimentale nel campo delle altre scienze naturali e dell'ingegneria n.c.a.",
  },
  "72.20.01": {
    en: "Research and development on archaeology",
    it: "Ricerca e sviluppo sperimentale nel campo dell'archeologia",
  },
  "72.20.09": {
    en: "Other activities of research and experimental development on social sciences and humanities",
    it: "Ricerca e sviluppo sperimentale nel campo delle altre scienze sociali e umanistiche",
  },
  "73.11.01": {
    en: "Creative advertising services",
    it: "Ideazione di campagne pubblicitarie",
  },
  "73.11.02": {
    en: "Conducting marketing campaigns and other advertising services",
    it: "Conduzione di campagne di marketing e altri servizi pubblicitari",
  },
  "73.11.03": {
    en: "Influencer marketing",
    it: "Attività di influencer marketing",
  },
  "73.12.00": {
    en: "Media representation",
    it: "Attività di concessionarie pubblicitarie",
  },
  "73.20.00": {
    en: "Market research and public opinion polling",
    it: "Ricerche di mercato e sondaggi di opinione",
  },
  "73.30.01": {
    en: "Lobbying activities",
    it: "Attività di rappresentanza di interessi",
  },
  "73.30.02": {
    en: "Activities of sales representatives of pharmaceutical goods for promotion purposes",
    it: "Attività di informazione scientifica inerente prodotti farmaceutici e articoli medicali per scopi promozionali",
  },
  "73.30.03": {
    en: "Activities of sales representatives of other goods for promotion purposes",
    it: "Attività di promozione di altri prodotti",
  },
  "73.30.09": {
    en: "Public relations and communication activities n.e.c.",
    it: "Pubbliche relazioni e comunicazione n.c.a.",
  },
  "74.11.10": {
    en: "Industrial product design activities",
    it: "Attività di progettazione di prodotti industriali",
  },
  "74.11.20": {
    en: "Fashion design activities",
    it: "Attività di progettazione di moda",
  },
  "74.12.01": {
    en: "Graphic design of web pages",
    it: "Grafica di pagine web",
  },
  "74.12.09": {
    en: "Other graphic design and visual communication activities",
    it: "Altre attività di progettazione grafica e di comunicazione visiva",
  },
  "74.13.00": {
    en: "Interior design activities",
    it: "Attività di progettazione di interni",
  },
  "74.14.01": {
    en: "Specialised design activities provided by draughtsmen",
    it: "Attività di progettazione specializzata fornite da disegnatori tecnici",
  },
  "74.14.09": {
    en: "Other specialised design activities n.e.c.",
    it: "Altre attività di progettazione specializzata n.c.a.",
  },
  "74.20.11": {
    en: "Activities of photojournalists",
    it: "Attività fotografiche fornite da fotoreporter",
  },
  "74.20.12": {
    en: "Aerial and underwater photography",
    it: "Attività fotografiche aeree e subacquee",
  },
  "74.20.19": {
    en: "Other specialised photographic activities",
    it: "Altre attività fotografiche specializzate",
  },
  "74.20.20": {
    en: "Photographic processing and other photographic activities",
    it: "Attività di sviluppo e stampa e altre attività fotografiche",
  },
  "74.30.00": {
    en: "Translation and interpretation activities",
    it: "Attività di traduzione e interpretariato",
  },
  "74.91.00": {
    en: "Patent brokering and marketing service activities",
    it: "Attività di servizi di intermediazione e marketing di brevetti",
  },
  "74.99.11": {
    en: "Agricultural consulting activities provided by agronomists",
    it: "Attività di consulenza agraria fornite da agronomi",
  },
  "74.99.12": {
    en: "Agricultural consulting activities provided by agrotechnicians",
    it: "Attività di consulenza agraria fornite da agrotecnici",
  },
  "74.99.13": {
    en: "Agricultural consulting activities provided by agricultural surveyors",
    it: "Attività di consulenza agraria fornite da periti agrari",
  },
  "74.99.14": {
    en: "Agricultural consulting activities provided by other agricultural economists",
    it: "Attività di consulenza agraria fornite da altri economisti specializzati in agricoltura",
  },
  "74.99.15": {
    en: "Agricultural wine-growing and wine-making consulting activities provided by oenologists",
    it: "Attività di consulenza agraria viticolo enologica fornite da enologi",
  },
  "74.99.16": {
    en: "Agricultural wine-growing and wine-making consulting activities provided by wine technicians",
    it: "Attività di consulenza agraria viticolo enologica fornite da enotecnici",
  },
  "74.99.19": {
    en: "Agricultural consulting activities n.e.c.",
    it: "Altre attività di consulenza agraria n.c.a.",
  },
  "74.99.21": {
    en: "Consulting in the area of occupational safety and health at the workplace",
    it: "Attività di consulenza in materia di sicurezza e salute dei posti di lavoro",
  },
  "74.99.29": {
    en: "Other security consulting activities",
    it: "Altre attività di consulenza in materia di sicurezza",
  },
  "74.99.31": {
    en: "Consulting in the area of prevention and reduction of pollution and of waste management",
    it: "Attività di consulenza in materia di prevenzione e riduzione dell'inquinamento e di gestione dei rifiuti",
  },
  "74.99.32": {
    en: "Consulting in the area of energy resource management, renewable energy and energy efficiency",
    it: "Attività di consulenza in materia di gestione delle risorse energetiche, energie rinnovabili ed efficienza energetica",
  },
  "74.99.33": {
    en: "Consulting in the area of management of water, mineral and other natural resources used for non-energy purposes",
    it: "Attività di consulenza in materia di gestione delle risorse idriche, minerali e altre risorse naturali per usi differenti da quelli energetici",
  },
  "74.99.41": {
    en: "Consulting activities provided by wine merchants and sommeliers",
    it: "Attività di consulenza fornite da enotecari e sommelier",
  },
  "74.99.42": {
    en: "Consulting activities in gastronomy",
    it: "Attività di consulenza in gastronomia",
  },
  "74.99.91": {
    en: "Technical consulting provided by industrial experts",
    it: "Attività tecniche svolte da periti industriali",
  },
  "74.99.92": {
    en: "Weather forecasting activities",
    it: "Attività di previsione meteorologica",
  },
  "74.99.93": {
    en: "Activities carried out by entertainment and sport agents and agencies on behalf of individuals",
    it: "Attività di agenzie, agenti e procuratori per lo spettacolo e lo sport",
  },
  "74.99.94": {
    en: "Technical consulting on graphology",
    it: "Attività di consulenza tecnica in ambito grafologico",
  },
  "74.99.99": {
    en: "All other various professional, scientific and technical activities n.e.c.",
    it: "Tutte le altre attività varie professionali, scientifiche e tecniche n.c.a.",
  },
  "75.00.00": {
    en: "Veterinary activities",
    it: "Servizi veterinari",
  },
  "77.11.00": {
    en: "Rental and leasing of cars and light motor vehicles",
    it: "Noleggio e leasing operativo di automobili e autoveicoli leggeri",
  },
  "77.12.00": {
    en: "Rental and leasing of trucks",
    it: "Noleggio e leasing operativo di autocarri",
  },
  "77.21.01": {
    en: "Rental and leasing of bicycles",
    it: "Noleggio e leasing operativo di biciclette",
  },
  "77.21.02": {
    en: "Rental and leasing of pleasure boats without operator",
    it: "Noleggio e leasing operativo di imbarcazioni da diporto senza operatore",
  },
  "77.21.09": {
    en: "Rental and leasing of other recreational and sports goods",
    it: "Noleggio e leasing operativo di altre attrezzature e articoli sportivi e ricreativi",
  },
  "77.22.10": {
    en: "Rental and leasing of textiles, wearing apparel and footwear",
    it: "Noleggio e leasing operativo di tessili, articoli di abbigliamento e calzature",
  },
  "77.22.90": {
    en: "Rental and leasing of other personal and household goods n.e.c.",
    it: "Noleggio e leasing operativo di altri beni per uso personale e per la casa n.c.a.",
  },
  "77.31.00": {
    en: "Rental and leasing of agricultural machinery and equipment",
    it: "Noleggio e leasing operativo di macchine e attrezzature agricole",
  },
  "77.32.00": {
    en: "Rental and leasing of construction and civil engineering machinery and equipment",
    it: "Noleggio e leasing operativo di macchine e attrezzature per lavori edili e di ingegneria civile",
  },
  "77.33.00": {
    en: "Rental and leasing of office machinery, equipment and computers",
    it: "Noleggio e leasing operativo di macchine, attrezzature e computer per ufficio",
  },
  "77.34.00": {
    en: "Rental and leasing of water transport equipment",
    it: "Noleggio e leasing operativo di mezzi di trasporto marittimi, fluviali e lacustri",
  },
  "77.35.00": {
    en: "Rental and leasing of air transport equipment",
    it: "Noleggio e leasing operativo di mezzi di trasporto aereo",
  },
  "77.39.10": {
    en: "Rental and leasing of other land transport equipment",
    it: "Noleggio e leasing operativo di altri mezzi di trasporto terrestre",
  },
  "77.39.91": {
    en: "Rental and leasing of lifting and handling equipment",
    it: "Noleggio e leasing operativo di apparecchi di sollevamento e movimentazione merci",
  },
  "77.39.92": {
    en: "Rental and leasing of furniture and equipment for events",
    it: "Noleggio e leasing operativo di strutture e attrezzature per manifestazioni e spettacoli",
  },
  "77.39.99": {
    en: "Rental and leasing of other various machinery, equipment and tangible goods n.e.c.",
    it: "Noleggio e leasing operativo di altre macchine, attrezzature e beni materiali vari n.c.a.",
  },
  "77.40.00": {
    en: "Leasing of intellectual property and similar products, except copyrighted works",
    it: "Concessione dei diritti di sfruttamento di proprietà intellettuale, escluse le opere soggette a diritto d'autore",
  },
  "77.51.00": {
    en: "Intermediation service activities for rental and leasing of cars, motorhomes and trailers",
    it: "Attività di servizi di intermediazione per il noleggio e il leasing operativo di automobili, autocaravan e rimorchi",
  },
  "77.52.00": {
    en: "Intermediation service activities for rental and leasing of other tangible goods and non-financial intangible assets",
    it: "Attività di servizi di intermediazione per il noleggio e il leasing operativo di altri beni materiali e beni immateriali non finanziari",
  },
  "78.10.00": {
    en: "Activities of employment placement agencies",
    it: "Attività di agenzie di collocamento",
  },
  "78.20.00": {
    en: "Temporary employment agency activities and other human resource provisions",
    it: "Attività di agenzie di lavoro interinale e altre attività di fornitura di risorse umane",
  },
  "79.11.00": {
    en: "Travel agency activities",
    it: "Attività di agenzie di viaggio",
  },
  "79.12.00": {
    en: "Tour operator activities",
    it: "Attività di tour operator",
  },
  "79.90.01": {
    en: "Activities of tourist guides",
    it: "Servizi di guida turistica",
  },
  "79.90.02": {
    en: "Activities of nature guides",
    it: "Servizi di accompagnamento in ambiente naturale",
  },
  "79.90.03": {
    en: "Activities of tour guides",
    it: "Altri servizi di accompagnamento turistico",
  },
  "79.90.04": {
    en: "Other visitor assistance services",
    it: "Altre attività di assistenza turistica",
  },
  "80.01.11": {
    en: "Investigation activities in the private field",
    it: "Attività di investigazione in ambito privato",
  },
  "80.01.12": {
    en: "Investigation activities in the commercial field",
    it: "Attività di investigazione in ambito aziendale e commerciale",
  },
  "80.01.13": {
    en: "Investigation activities in the insurance field",
    it: "Attività di investigazione in ambito assicurativo",
  },
  "80.01.14": {
    en: "Investigation activities in the legal field",
    it: "Attività di investigazione in ambito legale",
  },
  "80.01.21": {
    en: "Private unarmed security activities",
    it: "Attività di vigilanza privata non armata",
  },
  "80.01.29": {
    en: "Other private security activities",
    it: "Altre attività di vigilanza privata",
  },
  "80.09.00": {
    en: "Security activities n.e.c.",
    it: "Attività di vigilanza n.c.a.",
  },
  "81.10.00": {
    en: "Combined facilities support activities",
    it: "Attività di servizi integrati agli edifici",
  },
  "81.21.00": {
    en: "General cleaning of buildings",
    it: "Attività di pulizia generale di edifici",
  },
  "81.22.01": {
    en: "Sterilisation activities of medical equipment",
    it: "Attività di sterilizzazione di attrezzature mediche",
  },
  "81.22.09": {
    en: "Other building and industrial cleaning activities n.e.c.",
    it: "Altre attività di pulizia di edifici e pulizia industriale n.c.a.",
  },
  "81.23.10": {
    en: "Sanitising, disinfecting and exterminating activities",
    it: "Attività di sanificazione, disinfezione e disinfestazione",
  },
  "81.23.91": {
    en: "Street sweeping and snow and ice removal",
    it: "Pulitura delle strade e rimozione di neve e ghiaccio",
  },
  "81.23.99": {
    en: "Other various cleaning activities n.e.c.",
    it: "Altre attività di pulizia varie n.c.a.",
  },
  "81.30.00": {
    en: "Landscape service activities",
    it: "Attività di servizi per la cura del paesaggio",
  },
  "82.10.00": {
    en: "Office administrative and support activities",
    it: "Attività amministrative e di supporto per le funzioni di ufficio",
  },
  "82.20.00": {
    en: "Activities of call centres",
    it: "Attività dei call center",
  },
  "82.30.01": {
    en: "Organisation of conferences and congresses",
    it: "Organizzazione di conferenze e congressi",
  },
  "82.30.02": {
    en: "Organisation of business and trade shows",
    it: "Organizzazione di fiere commerciali e di affari",
  },
  "82.30.03": {
    en: "Organisation of conventions and company events",
    it: "Organizzazione di convegni ed eventi aziendali",
  },
  "82.30.04": {
    en: "Organisation of farmers' markets and craft fairs",
    it: "Organizzazione di mercati agricoli e fiere dell'artigianato",
  },
  "82.30.09": {
    en: "Organisation of other events",
    it: "Organizzazione di altri eventi",
  },
  "82.40.01": {
    en: "Reservation services for theatrical, sport, amusement and entertainment tickets",
    it: "Attività di servizi di prenotazione di biglietti per spettacoli teatrali, sportivi e altri spettacoli di intrattenimento e divertimento",
  },
  "82.40.09": {
    en: "Other intermediation service activities for business support service activities n.e.c.",
    it: "Altre attività di servizi di intermediazione per servizi di supporto alle imprese n.c.a.",
  },
  "82.91.10": {
    en: "Activities of collection agencies",
    it: "Attività di recupero crediti",
  },
  "82.91.20": {
    en: "Activities of credit bureaus and rating agencies",
    it: "Attività di raccolta e fornitura di informazioni commerciali e di rating",
  },
  "82.92.10": {
    en: "Packaging activities of beverages and food",
    it: "Attività di imballaggio di generi alimentari",
  },
  "82.92.20": {
    en: "Packaging activities of other goods",
    it: "Attività di imballaggio di generi non alimentari",
  },
  "82.99.11": {
    en: "Providing assistance in motor vehicle registration",
    it: "Fornitura di assistenza per la registrazione di autoveicoli",
  },
  "82.99.19": {
    en: "Requesting certificates and handling practices n.e.c.",
    it: "Richiesta certificati e disbrigo pratiche n.c.a.",
  },
  "82.99.91": {
    en: "Reading of consumption of heat and hot water",
    it: "Rilevamento del consumo di calore e acqua calda",
  },
  "82.99.99": {
    en: "All other various business support service activities n.e.c.",
    it: "Tutti gli altri servizi vari di supporto alle imprese n.c.a.",
  },
  "84.11.10": {
    en: "Activities of executive, legislative and fiscal administration of central, regional and local bodies",
    it: "Attività degli organi legislativi ed esecutivi e delle amministrazioni centrali e locali",
  },
  "84.11.20": {
    en: "Tax collection services on behalf of third parties",
    it: "Servizi di gestione esattoriale per conto terzi",
  },
  "84.11.30": {
    en: "Activities of overall planning and statistical services",
    it: "Attività di pianificazione generale e servizi statistici generali",
  },
  "84.12.10": {
    en: "Regulation of health care services",
    it: "Regolamentazione dei servizi di assistenza sanitaria",
  },
  "84.12.20": {
    en: "Regulation of education services",
    it: "Regolamentazione dei servizi di istruzione",
  },
  "84.12.30": {
    en: "Regulation of housing and environmental protection services",
    it: "Regolamentazione dei servizi per l'edilizia abitativa e la tutela dell'ambiente",
  },
  "84.12.40": {
    en: "Regulation of cultural services and other social services",
    it: "Regolamentazione dei servizi culturali e di altri servizi sociali",
  },
  "84.13.10": {
    en: "Regulation of agriculture-, forestry-, fishing- and hunting-related services",
    it: "Regolamentazione dei servizi connessi a agricoltura, silvicoltura, caccia e pesca",
  },
  "84.13.20": {
    en: "Regulation of fuel- and energy-related services",
    it: "Regolamentazione dei servizi connessi a combustibili ed energia",
  },
  "84.13.30": {
    en: "Regulation of mining- and mineral resources-, manufacturing- and construction-related services",
    it: "Regolamentazione dei servizi connessi a industrie estrattive e risorse minerarie, industrie manifatturiere e di costruzione",
  },
  "84.13.40": {
    en: "Regulation of transport- and communications-related services",
    it: "Regolamentazione dei servizi connessi a trasporti e comunicazioni",
  },
  "84.13.50": {
    en: "Regulation of services related to the distributive and catering trades, hotels and restaurants",
    it: "Regolamentazione dei servizi connessi a commercio, servizi di alloggio e ristorazione",
  },
  "84.13.60": {
    en: "Regulation of services tourism-related",
    it: "Regolamentazione dei servizi connessi al turismo",
  },
  "84.13.90": {
    en: "Regulation of other services",
    it: "Regolamentazione di altri servizi",
  },
  "84.21.00": {
    en: "Foreign affairs",
    it: "Affari esteri",
  },
  "84.22.00": {
    en: "Defence activities",
    it: "Difesa nazionale",
  },
  "84.23.00": {
    en: "Justice and judicial activities",
    it: "Giustizia e attività giudiziarie",
  },
  "84.24.10": {
    en: "Public order and national security of the Forces of Law and Order",
    it: "Ordine pubblico e sicurezza nazionale delle Forze dell'Ordine",
  },
  "84.24.20": {
    en: "Public order and national security support activities provided by Civil Protection",
    it: "Attività di supporto all'ordine pubblico e alla sicurezza nazionale fornite dalla Protezione Civile",
  },
  "84.25.00": {
    en: "Fire service activities",
    it: "Servizi antincendio",
  },
  "84.30.00": {
    en: "Compulsory social security activities",
    it: "Assicurazione sociale obbligatoria",
  },
  "85.10.00": {
    en: "Pre-primary education",
    it: "Istruzione prescolastica",
  },
  "85.20.00": {
    en: "Primary education",
    it: "Istruzione primaria",
  },
  "85.31.10": {
    en: "Lower general secondary education",
    it: "Istruzione secondaria di formazione generale di primo grado",
  },
  "85.31.20": {
    en: "Upper general secondary education",
    it: "Istruzione secondaria di formazione generale di secondo grado",
  },
  "85.32.01": {
    en: "Vocational secondary education provided by sailing and shipping schools",
    it: "Istruzione secondaria professionale erogata da scuole di vela e navigazione",
  },
  "85.32.02": {
    en: "Vocational secondary education provided by flying schools",
    it: "Istruzione secondaria professionale erogata da scuole di volo",
  },
  "85.32.03": {
    en: "Vocational secondary education provided by driving schools",
    it: "Istruzione secondaria professionale erogata da scuole di guida",
  },
  "85.32.09": {
    en: "Other vocational secondary education n.e.c.",
    it: "Altra istruzione secondaria professionale n.c.a.",
  },
  "85.33.00": {
    en: "Post-secondary non-tertiary education",
    it: "Istruzione post-secondaria non terziaria",
  },
  "85.40.10": {
    en: "Short-cycle tertiary education",
    it: "Istruzione terziaria non universitaria professionale",
  },
  "85.40.20": {
    en: "Other tertiary education",
    it: "Istruzione terziaria universitaria di primo, secondo e terzo ciclo e a ciclo unico",
  },
  "85.51.01": {
    en: "Pilates instruction by individual teachers and trainers",
    it: "Insegnamento di pilates fornito da insegnanti e istruttori indipendenti",
  },
  "85.51.09": {
    en: "Sports and recreation education n.e.c.",
    it: "Formazione sportiva e ricreativa n.c.a.",
  },
  "85.52.01": {
    en: "Dance instruction",
    it: "Corsi di danza",
  },
  "85.52.02": {
    en: "Cultural heritage education",
    it: "Attività di educazione al patrimonio culturale",
  },
  "85.52.09": {
    en: "Other cultural education",
    it: "Altra formazione culturale",
  },
  "85.53.00": {
    en: "Driving school activities",
    it: "Attività di scuole guida",
  },
  "85.59.10": {
    en: "Foreign language instruction",
    it: "Corsi di lingua straniera",
  },
  "85.59.20": {
    en: "Computer training and professional examination review courses",
    it: "Corsi di formazione e corsi di aggiornamento professionale",
  },
  "85.59.30": {
    en: "Other education n.e.c. provided by the so-called università popolari",
    it: "Altri servizi di istruzione e formazione n.c.a. forniti da università popolari",
  },
  "85.59.91": {
    en: "Courses of awareness through movement",
    it: "Corsi di educazione consapevole attraverso il movimento",
  },
  "85.59.99": {
    en: "All other various educational activities n.e.c.",
    it: "Tutti gli altri servizi vari di istruzione e formazione n.c.a.",
  },
  "85.61.00": {
    en: "Intermediation service activities for courses and tutors",
    it: "Attività di servizi di intermediazione per corsi e tutor",
  },
  "85.69.01": {
    en: "Educational guidance counselling activities",
    it: "Consulenza scolastica e servizi di orientamento scolastico",
  },
  "85.69.09": {
    en: "Other educational support activities n.e.c.",
    it: "Altri servizi vari di supporto all'istruzione e formazione n.c.a.",
  },
  "86.10.00": {
    en: "Hospital activities",
    it: "Attività ospedaliere",
  },
  "86.21.00": {
    en: "General medical practice activities",
    it: "Attività di medicina generale",
  },
  "86.22.01": {
    en: "Cosmetic surgery activities",
    it: "Trattamenti di chirurgia estetica",
  },
  "86.22.02": {
    en: "Other medical specialists activities by medical specialists and surgeons",
    it: "Altre attività di medicina specialistica svolte da medici specialisti indipendenti",
  },
  "86.22.03": {
    en: "Other medical specialists activities by dedicated centres or day clinics",
    it: "Altre attività di medicina specialistica svolte presso cliniche e centri specialistici",
  },
  "86.23.00": {
    en: "Dental practice care activities",
    it: "Attività odontoiatriche",
  },
  "86.91.01": {
    en: "Diagnostic imaging services",
    it: "Attività di diagnostica per immagini",
  },
  "86.91.02": {
    en: "Medical laboratory activities",
    it: "Attività di laboratorio medico",
  },
  "86.92.00": {
    en: "Patient transportation by ambulance",
    it: "Trasporto di pazienti in ambulanza",
  },
  "86.93.00": {
    en: "Activities of psychologists and psychotherapists, except medical doctors",
    it: "Attività di psicologi e psicoterapeuti, esclusi i medici",
  },
  "86.94.01": {
    en: "Nursing activities",
    it: "Attività infermieristiche",
  },
  "86.94.02": {
    en: "Midwifery activities",
    it: "Attività ostetriche",
  },
  "86.95.00": {
    en: "Physiotherapy activities",
    it: "Attività di fisioterapia",
  },
  "86.96.01": {
    en: "Kinesiology",
    it: "Chinesiologia",
  },
  "86.96.09": {
    en: "Traditional, complementary and alternative medicine activities n.e.c.",
    it: "Attività di medicine complementari e alternative n.c.a.",
  },
  "86.97.00": {
    en: "Intermediation service activities for medical, dental and other human health services",
    it: "Attività di servizi di intermediazione per attività mediche, odontoiatriche e altri servizi per la salute umana",
  },
  "86.99.01": {
    en: "Body treatment techniques",
    it: "Tecniche di trattamento del corpo",
  },
  "86.99.02": {
    en: "Dance and movement therapy",
    it: "Danza-movimento terapia",
  },
  "86.99.03": {
    en: "Psychomotor activities",
    it: "Attività di psicomotricità",
  },
  "86.99.09": {
    en: "Other various human health activities n.e.c.",
    it: "Altre attività varie per la salute umana n.c.a.",
  },
  "87.10.00": {
    en: "Residential nursing care activities",
    it: "Attività di assistenza infermieristica residenziale",
  },
  "87.20.00": {
    en: "Residential care activities for persons living with or having a diagnosis of a mental illness or substance abuse",
    it: "Attività di assistenza residenziale per persone affette da disturbi mentali o abuso di sostanze",
  },
  "87.30.00": {
    en: "Residential care activities for older persons or persons with physical disabilities",
    it: "Attività di assistenza residenziale per anziani o persone con disabilità fisiche",
  },
  "87.91.00": {
    en: "Intermediation service activities for residential care activities",
    it: "Attività di servizi di intermediazione per attività di assistenza residenziale",
  },
  "87.99.00": {
    en: "Other residential care activities n.e.c.",
    it: "Altre attività di assistenza residenziale n.c.a.",
  },
  "88.10.00": {
    en: "Social work activities without accommodation for older persons or persons with disabilities",
    it: "Attività di assistenza sociale non residenziale per anziani o persone con disabilità",
  },
  "88.91.00": {
    en: "Child day-care activities",
    it: "Attività di assistenza diurna per l'infanzia",
  },
  "88.99.01": {
    en: "Counselling services",
    it: "Servizi di counselling",
  },
  "88.99.02": {
    en: "Marriage and family guidance",
    it: "Consulenza familiare",
  },
  "88.99.03": {
    en: "Cultural and intercultural mediation activities",
    it: "Mediazione culturale e interculturale",
  },
  "88.99.04": {
    en: "Social work activities without accommodation provided by pedagogues",
    it: "Altre attività di assistenza sociale non residenziale fornite da pedagogisti",
  },
  "88.99.09": {
    en: "Other various social work activities without accommodation n.e.c.",
    it: "Altre attività varie di assistenza sociale non residenziale n.c.a.",
  },
  "90.11.01": {
    en: "Activities of independent journalists",
    it: "Attività di giornalisti indipendenti",
  },
  "90.11.02": {
    en: "Activities of independent bloggers",
    it: "Attività di blogger indipendenti",
  },
  "90.11.09": {
    en: "Other literary creation and musical composition activities",
    it: "Altre attività di creazione letteraria e composizione musicale",
  },
  "90.12.00": {
    en: "Visual arts creation activities",
    it: "Attività di creazione di arti visive",
  },
  "90.13.00": {
    en: "Other arts creation activities",
    it: "Altre attività di creazione artistica",
  },
  "90.20.01": {
    en: "Activities of acting",
    it: "Attività nel campo della recitazione",
  },
  "90.20.09": {
    en: "Other activities of performing arts",
    it: "Altre attività di arti performative e rappresentazioni artistiche",
  },
  "90.31.00": {
    en: "Operation of arts facilities and sites",
    it: "Gestione di strutture e spazi per le arti",
  },
  "90.39.01": {
    en: "Activities of directing",
    it: "Attività nel campo della regia",
  },
  "90.39.09": {
    en: "Other support activities to arts and performing arts n.e.c.",
    it: "Altre attività di supporto alle arti performative e alle rappresentazioni artistiche n.c.a.",
  },
  "91.11.00": {
    en: "Library activities",
    it: "Attività di biblioteche",
  },
  "91.12.00": {
    en: "Archive activities",
    it: "Attività di archivi",
  },
  "91.21.00": {
    en: "Museum and collection activities",
    it: "Attività di musei e collezioni",
  },
  "91.22.00": {
    en: "Historical site and monument activities",
    it: "Attività di luoghi e monumenti storici",
  },
  "91.30.01": {
    en: "Conservation and restoration of cultural heritage",
    it: "Conservazione e restauro del patrimonio culturale",
  },
  "91.30.02": {
    en: "Creation and operation of multimedia equipment adapted for tours in museums and other cultural sites",
    it: "Creazione e gestione di apparecchiature multimediali per l'accompagnamento alle visite in musei e altri siti culturali",
  },
  "91.30.09": {
    en: "Other support activities for cultural heritage",
    it: "Altre attività di supporto al patrimonio culturale",
  },
  "91.41.00": {
    en: "Botanical and zoological garden activities",
    it: "Attività di orti botanici e giardini zoologici",
  },
  "91.42.00": {
    en: "Nature reserve activities",
    it: "Attività di riserve e parchi naturali",
  },
  "92.00.01": {
    en: "Operation (exploitation) of coin- or token-operated gambling machines",
    it: "Gestione di apparecchi che consentono vincite in denaro funzionanti a moneta o a gettone",
  },
  "92.00.09": {
    en: "Other gambling and betting activities",
    it: "Altre attività di scommesse, lotterie e altri giochi d'azzardo",
  },
  "93.11.10": {
    en: "Operation of swimming pools",
    it: "Gestione di piscine",
  },
  "93.11.90": {
    en: "Operation of other sports facilities",
    it: "Gestione di altri impianti sportivi",
  },
  "93.12.00": {
    en: "Activities of sports clubs",
    it: "Attività dei club sportivi",
  },
  "93.13.01": {
    en: "Activities of yoga, pilates and tai chi studios",
    it: "Attività di studi di yoga, pilates e Tai Chi",
  },
  "93.13.09": {
    en: "Other activities of fitness centres",
    it: "Altre attività dei centri di fitness",
  },
  "93.19.10": {
    en: "Activities of sport governing bodies and activities related to promotion of sporting events",
    it: "Attività di organizzazioni ed enti sportivi e promozione di eventi sportivi",
  },
  "93.19.91": {
    en: "Refilling of scuba diving tanks activities",
    it: "Attività di ricarica di bombole per attività subacquee",
  },
  "93.19.92": {
    en: "Activities of mountain guides",
    it: "Attività di guida alpina",
  },
  "93.19.93": {
    en: "Activities of fishing guides",
    it: "Attività di guida di pesca",
  },
  "93.19.99": {
    en: "Other various sports activities n.e.c.",
    it: "Altre attività sportive varie n.c.a.",
  },
  "93.21.00": {
    en: "Activities of amusement parks and theme parks",
    it: "Attività dei parchi di divertimento e dei parchi tematici",
  },
  "93.29.10": {
    en: "Operation of dance floors and ballrooms",
    it: "Gestione di piste e sale da ballo",
  },
  "93.29.20": {
    en: "Operation of bathing beaches",
    it: "Gestione di stabilimenti balneari",
  },
  "93.29.30": {
    en: "Operation of coin-operated or token-operated non-money-winning amusement machines",
    it: "Gestione di apparecchi da intrattenimento che non consentono vincite in denaro funzionanti a moneta o a gettone",
  },
  "93.29.91": {
    en: "Non-permanent and non-site-based operation of a variety of attractions",
    it: "Gestione di attrazioni e attività di spettacolo in forma itinerante",
  },
  "93.29.99": {
    en: "Other various amusement and recreation activities n.e.c.",
    it: "Altre attività varie di intrattenimento e divertimento n.c.a.",
  },
  "94.11.00": {
    en: "Activities of business and employers membership organisations",
    it: "Attività di organizzazioni di imprese e dei datori di lavoro",
  },
  "94.12.10": {
    en: "Activities of professional membership organisations whose membership as members is essential for the practice of the profession",
    it: "Attività di ordini e collegi professionali",
  },
  "94.12.20": {
    en: "Activities of other professional membership organisations",
    it: "Attività di associazioni professionali",
  },
  "94.20.00": {
    en: "Activities of trade unions",
    it: "Attività dei sindacati di lavoratori",
  },
  "94.91.00": {
    en: "Activities of religious organisations",
    it: "Attività delle organizzazioni religiose",
  },
  "94.92.00": {
    en: "Activities of political organisations",
    it: "Attività delle organizzazioni politiche",
  },
  "94.99.10": {
    en: "Activities of organisations for the protection of citizens and consumers",
    it: "Attività di organizzazioni associative per la tutela degli interessi e dei diritti dei cittadini",
  },
  "94.99.20": {
    en: "Activities of cultural and recreational organisations",
    it: "Attività di organizzazioni associative culturali e ricreative",
  },
  "94.99.30": {
    en: "Activities of organisations for patriotic purposes",
    it: "Attività di organizzazioni associative a scopo patriottico",
  },
  "94.99.40": {
    en: "Activities of international cooperation and solidarity organisations",
    it: "Attività di organizzazioni associative per la cooperazione internazionale",
  },
  "94.99.50": {
    en: "Activities of philanthropic and voluntarism promotion organisations",
    it: "Attività di organizzazioni associative filantropiche",
  },
  "94.99.60": {
    en: "Activities of organisations for the protection of environmental and animals",
    it: "Attività di organizzazioni associative per la promozione e la difesa degli animali e dell'ambiente",
  },
  "94.99.90": {
    en: "Activities of other various membership organisations n.e.c.",
    it: "Attività di altre organizzazioni associative varie n.c.a.",
  },
  "95.10.10": {
    en: "Repair and maintenance of computers and peripheral equipment",
    it: "Riparazione e manutenzione di computer e periferiche",
  },
  "95.10.21": {
    en: "Repair and maintenance of telephones and tablets",
    it: "Riparazione e manutenzione di telefoni e tablet",
  },
  "95.10.29": {
    en: "Repair and maintenance of other communication equipment",
    it: "Riparazione e manutenzione di altre apparecchiature per le comunicazioni",
  },
  "95.21.00": {
    en: "Repair and maintenance of consumer electronics",
    it: "Riparazione e manutenzione di prodotti di elettronica di consumo",
  },
  "95.22.01": {
    en: "Repair and maintenance of household appliances",
    it: "Riparazione e manutenzione di elettrodomestici",
  },
  "95.22.02": {
    en: "Repair and maintenance of home and garden equipment",
    it: "Riparazione e manutenzione di articoli per la casa e il giardinaggio",
  },
  "95.23.00": {
    en: "Repair and maintenance of footwear and leather goods",
    it: "Riparazione e manutenzione di calzature e articoli in pelle",
  },
  "95.24.01": {
    en: "Reupholstering of furniture and home furnishings",
    it: "Rivestimento di mobili e oggetti di arredamento per la casa imbottiti",
  },
  "95.24.09": {
    en: "Other repair and maintenance of furniture and home furnishings",
    it: "Altre attività di riparazione e manutenzione di mobili e di oggetti di arredamento per la casa",
  },
  "95.25.00": {
    en: "Repair and maintenance of watches, clocks and jewellery",
    it: "Riparazione e manutenzione di orologi e gioielli",
  },
  "95.29.10": {
    en: "Repair and tuning of non-historical musical instruments",
    it: "Riparazione e accordatura di strumenti musicali non storici",
  },
  "95.29.21": {
    en: "Repair and maintenance of bicycles",
    it: "Riparazione e manutenzione di biciclette",
  },
  "95.29.22": {
    en: "Repair and maintenance of sporting goods and camping equipment",
    it: "Riparazione e manutenzione di articoli sportivi e attrezzature da campeggio",
  },
  "95.29.30": {
    en: "Repair and alteration of clothing",
    it: "Riparazione e modifica di articoli di abbigliamento",
  },
  "95.29.91": {
    en: "Knife sharpening, key cutting activities and while-you-wait engraving",
    it: "Affilatura di coltelli, servizi di duplicazione di chiavi e di incisione rapida",
  },
  "95.29.99": {
    en: "Repair and maintenance of other various personal and household goods n.e.c.",
    it: "Riparazione e manutenzione di altri beni vari per uso personale e per la casa n.c.a.",
  },
  "95.31.10": {
    en: "Mechanical, electrical and electronic repair and maintenance of motor vehicles",
    it: "Riparazione e manutenzione meccanica, elettrica ed elettronica di autoveicoli",
  },
  "95.31.20": {
    en: "Repair and maintenance of bodywork of motor vehicles",
    it: "Riparazione e manutenzione di carrozzerie di autoveicoli",
  },
  "95.31.30": {
    en: "Repair, fitting or replacement service activities for tubes and tyres",
    it: "Riparazione, montaggio o sostituzione di pneumatici e camere d'aria di autoveicoli",
  },
  "95.31.91": {
    en: "Washing of motor vehicles",
    it: "Lavaggio di autoveicoli",
  },
  "95.31.92": {
    en: "Repair and maintenance of caravan and motorhome housing cells",
    it: "Riparazione e manutenzione di cellule abitative per caravan e autocaravan",
  },
  "95.31.99": {
    en: "Other repair and maintenance of motor vehicles n.e.c.",
    it: "Altre attività di riparazione e manutenzione di autoveicoli n.c.a.",
  },
  "95.32.00": {
    en: "Repair and maintenance of motorcycles",
    it: "Riparazione e manutenzione di motocicli",
  },
  "95.40.00": {
    en: "Intermediation service activities for repair and maintenance of computers, personal and household goods, and motor vehicles and motorcycles",
    it: "Attività di servizi di intermediazione per la riparazione e la manutenzione di computer, beni per uso personale e per la casa, autoveicoli e motocicli",
  },
  "96.10.11": {
    en: "Washing and cleaning of textile products for industries and hospitals",
    it: "Lavaggio e pulitura di prodotti tessili forniti da lavanderie industriali per industrie, ospedali e altre strutture simili",
  },
  "96.10.12": {
    en: "Washing and cleaning of textile products for restaurants, hotels and similar accommodation",
    it: "Lavaggio e pulitura di prodotti tessili forniti da lavanderie industriali per ristorazione, alberghi e altri servizi di alloggio",
  },
  "96.10.21": {
    en: "Non self-service washing and cleaning of textile and fur products for the general public",
    it: "Lavaggio e pulitura di prodotti tessili e pellicce forniti da lavanderie e tintorie tradizionali",
  },
  "96.10.22": {
    en: "Self-service washing and cleaning of textile and fur products for the general public",
    it: "Lavaggio e pulitura di prodotti tessili e pellicce forniti da lavanderie self-service",
  },
  "96.21.00": {
    en: "Hairdressing and barber activities",
    it: "Servizi di parrucchieri e barbieri",
  },
  "96.22.01": {
    en: "Manicure and pedicure activities",
    it: "Servizi di manicure e pedicure",
  },
  "96.22.09": {
    en: "Other beauty care and other beauty treatment activities n.e.c.",
    it: "Altri servizi di cura della bellezza e altri trattamenti di bellezza n.c.a.",
  },
  "96.23.10": {
    en: "Thermal baths activities",
    it: "Servizi di centri termali",
  },
  "96.23.91": {
    en: "Salt room therapies",
    it: "Terapia del sale",
  },
  "96.23.99": {
    en: "Other day spa, sauna and steam bath activities n.e.c.",
    it: "Altri servizi di centri benessere, sauna e bagno di vapore n.c.a.",
  },
  "96.30.01": {
    en: "Morticians' services",
    it: "Servizi di pompe funebri",
  },
  "96.30.02": {
    en: "Burial services",
    it: "Servizi di sepoltura",
  },
  "96.30.09": {
    en: "Funeral and related activities n.e.c.",
    it: "Servizi funerari e attività connesse n.c.a.",
  },
  "96.40.00": {
    en: "Intermediation service activities for personal services",
    it: "Attività di servizi di intermediazione per servizi alla persona",
  },
  "96.91.00": {
    en: "Provision of domestic personal service activities",
    it: "Fornitura di servizi domestici",
  },
  "96.99.11": {
    en: "Pet boarding and pet sitters' services",
    it: "Servizi di presa in pensione e custodia per animali da compagnia",
  },
  "96.99.12": {
    en: "Pet grooming",
    it: "Servizi di toelettatura per animali da compagnia",
  },
  "96.99.13": {
    en: "Training of pets",
    it: "Servizi di addestramento per animali da compagnia",
  },
  "96.99.14": {
    en: "Operation of shelters for animals",
    it: "Gestione di rifugi per animali",
  },
  "96.99.19": {
    en: "Pet care services n.e.c.",
    it: "Servizi di cura per animali da compagnia n.c.a.",
  },
  "96.99.91": {
    en: "Activities of tattooing and piercing studios",
    it: "Attività di studi di tatuaggi e piercing",
  },
  "96.99.92": {
    en: "Dating and similar services",
    it: "Servizi di incontro ed eventi simili",
  },
  "96.99.93": {
    en: "Organisation of weddings and other personal ceremonies or celebrations",
    it: "Servizi di organizzazione di feste e cerimonie",
  },
  "96.99.94": {
    en: "Image consulting services",
    it: "Servizi di consulenza di immagine",
  },
  "96.99.99": {
    en: "All other various personal service activities n.e.c.",
    it: "Tutte le altre attività varie di servizi alla persona n.c.a.",
  },
  "97.00.10": {
    en: "Activities of condominiums as employers of domestic personnel",
    it: "Attività di condomini come datori di lavoro per personale domestico",
  },
  "97.00.90": {
    en: "Activities of households as employers of domestic personnel n.e.c.",
    it: "Attività di famiglie e convivenze come datori di lavoro per personale domestico n.c.a.",
  },
  "98.10.00": {
    en: "Undifferentiated goods-producing activities of private households for own use",
    it: "Produzione di beni indifferenziati per uso proprio da parte di famiglie e convivenze",
  },
  "98.20.00": {
    en: "Undifferentiated service-producing activities of private households for own use",
    it: "Produzione di servizi indifferenziati per uso proprio da parte di famiglie e convivenze",
  },
  "99.00.00": {
    en: "Activities of extraterritorial organisations and bodies",
    it: "Attività di organizzazioni e organismi extraterritoriali",
  },
} as const;
