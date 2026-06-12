// ════════════════════════════════════════════════════════════════
//  SPHÈRE OCCULTE — firebase-config.js
//  Fichier partagé par toutes les pages.
// ════════════════════════════════════════════════════════════════

// ── Config Firebase ──────────────────────────────────────────────
// ⚠️  Remplacez ces valeurs par celles de votre Console Firebase
const firebaseConfig = {
    apiKey:            "AIzaSyCs9zjHSdoTlfVKIPnhZRIcjsHMwHvcPG4",
    authDomain:        "sphere-occulte.firebaseapp.com",
    projectId:         "sphere-occulte",
    storageBucket:     "sphere-occulte.firebasestorage.app",
    messagingSenderId: "690663217057",
    appId:             "1:690663217057:web:35c0129b1b2846d9069de0"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();
// Storage non utilisé — images compressées et stockées en Firestore (base64)

// ── Grades (seuils basés sur Puissance Occulte) ──────────────────
const GRADES = [
    { nom: "Incantateur",          minOcculte: 0,   couleur: "#c4a0a0", css: "grade-incantateur", icon: "🌑" },
    { nom: "Marcheur des Voiles",  minOcculte: 23,  couleur: "#b06060", css: "grade-marcheur",    icon: "🌘" },
    { nom: "Collecteur d'Ombre",   minOcculte: 45,  couleur: "#8b3a3a", css: "grade-collecteur",  icon: "🌗" },
    { nom: "Marchand des Âmes",    minOcculte: 90,  couleur: "#6b0000", css: "grade-marchand",    icon: "🔴" },
    { nom: "Monarque des Ombres",  minOcculte: 400, couleur: "#f2d060", css: "grade-monarque",    icon: "👑" }
];

function getGrade(pointsOcculte) {
    let g = GRADES[0];
    for (const grade of GRADES) { if (pointsOcculte >= grade.minOcculte) g = grade; }
    return g.nom; // retourne le nom (string) pour stockage Firestore
}

function getGradeIndex(nomGrade) {
    const idx = GRADES.findIndex(g => g.nom === nomGrade);
    return idx === -1 ? 0 : idx;
}

function badgeGrade(nomGrade) {
    const g = GRADES.find(x => x.nom === nomGrade) || GRADES[0];
    return `<span class="grade-badge ${g.css}">${nomGrade}</span>`;
}

function formatDate(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR');
}

// ── Seed des incantations ─────────────────────────────────────────
const INCANTATIONS_SEED = [
    // ─── Niveau Incantateur ───────────────────────────────────────
    {
        nom: "Voile de Pénombre",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Lorsque l'Incantateur cherche à troubler légèrement la perception visuelle dans une zone restreinte, sans masquer totalement un lieu ou une personne.",
        objetRequis: "Oui, une source de flamme faible (bougie, braise, lampe vacillante).",
        explication: "L'Incantateur canalise une énergie occulte mineure à travers la flamme afin de provoquer une instabilité lumineuse temporaire. La pénombre créée n'est ni opaque ni contrôlée : elle atténue légèrement les contrastes, fatigue les yeux et rend les contours incertains.",
        texteIncantation: "Per flammam fragilem, voco umbram naissante,\nnon pour couvrir, mais pour hésiter.\nLux, noli fugi, sed vacilla,\nreste présente, mais incertaine.\nUmbra non regnat, elle frôle seulement,\nelle effleure les murs et les regards.\nNulla caecitas, nulla disparition,\njuste un trouble léger dans l'instant.\nInter lumen et tenebras,\nje marche sans m'y cacher.\nSic transit penumbra,\néphémère, instable, imparfaite.",
        socle: null, descriptionSocle: null,
        pointsManipulation: 1, pointsOcculte: 0, special: false
    },
    {
        nom: "Frisson du Seuil",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Lorsque l'Incantateur souhaite provoquer une sensation diffuse de malaise ou de présence indéfinissable dans une zone très restreinte.",
        objetRequis: "Oui, un objet personnel de l'Incantateur (bague, pendentif).",
        explication: "L'Incantateur projette une impulsion occulte mineure imprégnée de son propre état émotionnel. L'effet ne crée ni peur incontrôlable ni hallucination, mais un simple inconfort.",
        texteIncantation: "Ad limen sensuum, ego susurro,\nnon comme un cri, mais comme un doute.\nCor non tremat, sed hesitet,\nque l'instant perde sa stabilité.\nNulla vis, nulla dominatio,\nje n'impose rien, je suggère.\nFrigus leviter descendit,\nun frisson sans raison apparente.\nInter praesentiam et vacuum,\nje laisse une trace fragile.\nSic manet sensatio,\néphémère, contestable, humaine.",
        socle: null, descriptionSocle: null,
        pointsManipulation: 1, pointsOcculte: 0, special: false
    },
    {
        nom: "Offrande du Sang Vacillant",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Lorsque l'Incantateur cherche à libérer une poussée de puissance occulte exceptionnelle au prix d'une vie, afin de renforcer son énergie occulte.",
        objetRequis: "Oui, le Socle du Sang Écarlate et une vie consciente offerte volontairement ou immobilisée rituellement.",
        explication: "L'Incantateur utilise le socle comme catalyseur pour convertir l'énergie vitale d'une vie en flux occulte brut. Cette énergie n'est ni stable ni contrôlée.",
        texteIncantation: "Per sanguinem viventem, voco vim interdictam,\nnon comme un maître, mais comme un désespéré.\nVita solvitur, anima tremit,\net la chair paie le prix.\nHoc non est donum,\nc'est une dette.\nSanguis cadit, potestas surgit,\ninstabilis, affamée.\nNulla permanencia, nulla gloria,\nseulement l'instant volé.\nInter mortem et voluntatem,\nje tends la main.\nSi ego cado,\nqu'il en soit ainsi.",
        socle: "Socle du Sang Écarlate",
        descriptionSocle: "A utiliser lorsque vous sacrifiez une vie afin de libérer une puissance occulte brute, sans garantie de contrôle ni de survie intacte pour l'Incantateur.",
        pointsManipulation: 0, pointsOcculte: 1, special: false
    },
    {
        nom: "Déchirure de l'Offrande",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Lorsque l'Incantateur cherche à rompre un verrou occulte mineur, dissiper une manifestation surnaturelle et absorber l'énergie d'une entité.",
        objetRequis: "Oui, le Socle de l'Autel des Âmes Damnées et une vie offerte dans le cercle rituel.",
        explication: "L'Incantateur canalise l'agonie et l'extinction d'une vie à travers l'autel afin de provoquer une décharge occulte incontrôlée.",
        texteIncantation: "Per mortem data, frango quod resistit,\nnon par sagesse, mais par violence.\nVita clamat, anima solvitur,\net le seuil cède.\nHoc non est judicium,\nc'est une fracture.\nSanguis fluit, nexus rumpitur,\ndans un cri muet.\nNulla directio, nulla misericordia,\nseulement l'impact.\nInter finem et chaos,\nje libère ce qui ne devrait pas l'être.\nSi locus tremit,\nque l'offrande en porte la faute.\nSic scinditur vinculum.",
        socle: "Socle de l'Autel des Âmes Damnées",
        descriptionSocle: "A utiliser lorsque vous consommez entièrement l'énergie d'une vie afin de provoquer une rupture occulte violente et non ciblée.",
        pointsManipulation: 0, pointsOcculte: 1, special: false
    },
    {
        nom: "Masque de Chair Profane",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Lorsque l'Incantateur cherche à forcer la renaissance temporaire d'un démon sous une forme humaine, afin qu'il puisse interagir avec le monde des vivants.",
        objetRequis: "Oui, le Socle des Réincarnations, un réceptacle humain vide ou consentant, et une trace symbolique du démon.",
        explication: "L'incantation ne transforme pas le démon en humain : elle lui impose un masque de chair instable. L'entité renaît temporairement dans un corps humain imparfait.",
        texteIncantation: "Per circulum vitae falsae, ego nego naturam,\nnon pour purifier, mais pour dissimuler.\nDaemon, non mutaris,\ntu revêts seulement la chair.\nCaro humana, recipis quod n'es pas,\nsans le comprendre.\nPer reincarnationem imperfectam,\nje lie l'instant au mensonge.\nVitium manet, instinctus manet,\nles failles traversent le masque.\nMimesis perfecta, sed non sincera,\nl'humain est joué, jamais vécu.\nSi tempus frangitur,\nque la forme se rompe.\nInter daemon et hominem,\nje suspends l'existence.\nSic cadit masca carnis.",
        socle: "Socle des Réincarnations",
        descriptionSocle: "A utiliser lorsque vous forcez une renaissance temporaire et imparfaite, détournant les lois de la vie sans créer de véritable résurrection.",
        pointsManipulation: 2, pointsOcculte: 1, special: false
    },
    {
        nom: "Silence de l'Âme Errante",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Lorsque l'Incantateur souhaite entrer dans un état de méditation profonde afin de ressentir son énergie occulte, observer les flux mineurs et préparer mentalement un rituel futur.",
        objetRequis: "Oui, le Socle des Purifications Éternels.",
        explication: "L'Incantateur ferme son esprit aux stimuli extérieurs et se concentre sur les vibrations des ombres environnantes. L'incantation sert uniquement à stabiliser l'esprit et améliorer légèrement la perception.",
        texteIncantation: "Silentium animae, veni ad me,\nnon pour entendre, mais pour sentir.\nPer umbras leviter, per fluxus parvos,\nje touche ce qui est à peine là.\nNulla potentia, nulla vis,\njuste l'attention, fragile et fluide.\nInter sonum et vacuum,\nje repose l'esprit.\nRespira, cogita, observo,\nchaque frisson, chaque souffle.\nSi externum turbavit,\ntout est perdu.\nSic maneo in silentio,\ntemporaire, humble, patient.",
        socle: "Socle des Purifications Éternels",
        descriptionSocle: null,
        pointsManipulation: 2, pointsOcculte: 0, special: false
    },
    {
        nom: "Submergence des Damnés",
        gradeRequis: "Incantateur", gradeOrdre: 0,
        utilisation: "Pour faire surgir la puissance démoniaque latente chez une personne, révéler ses instincts sombres et sa nature occulte cachée.",
        objetRequis: "Non, un cercle tracé ou un simple espace sombre suffit pour concentrer le rituel.",
        explication: "Pour faire surgir la puissance démoniaque latente chez une personne, révéler ses instincts sombres et sa nature occulte cachée.",
        texteIncantation: "Oh, forces des abysses, entendez mon appel !\nQue l'obscurité voilée consume la lumière qui voile l'âme,\nQue les instincts anciens se réveillent et prennent chair !\nPar le murmure du Néant, par le souffle des damnés,\nRévèle en ce corps la noirceur refoulée et les ombres cachées !\n\nTenebrae Intimae, Vis Malorum,\nEx Profundis Daemonium Resurget,\nSanguis, Furor et Insidia,\nLibera animam et fac veritatem apparere !\n\nIgnis Tenebris, Dominae Malorum,\nResurget Umbra Ex Profundis,\nQue les chaînes tombent et que la vérité démoniaque éclate,\nFragile et dangereuse, dans chaque geste et chaque souffle !",
        socle: null, descriptionSocle: null,
        pointsManipulation: 1, pointsOcculte: 1, special: false
    },
    // ─── Niveau Marcheur des Voiles ───────────────────────────────
    {
        nom: "Fissure du Voile Errant",
        gradeRequis: "Marcheur des Voiles", gradeOrdre: 1,
        utilisation: "Pour ouvrir temporairement un passage instable entre deux lieux distincts, en forçant une déchirure à travers le Voile qui sépare les espaces.",
        objetRequis: "Non, mais la présence d'une zone d'ombre profonde, d'un reflet sombre ou d'un point de rupture visuelle facilite la canalisation.",
        explication: "Le Marcheur des Voiles entre en résonance avec le Voile et impose une correspondance imparfaite entre deux lieux. Le passage créé ne stabilise ni le temps, ni la matière, ni les êtres vivants.",
        texteIncantation: "Velum inter spatia, audi gradum meum,\nje ne viens pas briser, je viens forcer le seuil.\nPer umbras dissonantes et lieux disjoints,\naccorde un instant ce qui ne doit pas l'être.\nHic locus me connaît,\nillic locus m'appelle.\nNulla via recta, nulla securitas,\nje marche entre les lignes.\nFissura nascitur non par volonté,\nmais par équilibre fragile.\nSi vis deficit,\nque le Voile se referme.\nSi error venit,\nque l'espace décide.\nPorta aperitur, porta tremit,\nau rythme de mon souffle.\nInter hic et alibi,\nje traverse sans promesse.\nSic fit transitus per Velum,\néphémère, incertain, réel.",
        socle: null, descriptionSocle: null,
        pointsManipulation: 2, pointsOcculte: 0, special: false
    },
    {
        nom: "Moisson du Souffle Éteint",
        gradeRequis: "Marcheur des Voiles", gradeOrdre: 1,
        utilisation: "Pour absorber et transférer la puissance occulte résiduelle d'un ou plusieurs Incantateurs inactifs, inconscients ou ayant renoncé à leur pratique.",
        objetRequis: "Oui, le Socle des Âmes et la présence physique ou symbolique des Incantateurs ciblés (corps, relique personnelle, sceau d'identité).",
        explication: "Le Marcheur des Voiles utilise le socle comme un collecteur imparfait, aspirant le flux occulte dormant présent chez les Incantateurs inactifs. Ce rituel arrache définitivement la capacité d'incantation restante.",
        texteIncantation: "O animae dormientes, flammae sine souffle,\nvous qui portez encore l'écho du pouvoir.\nNon ad mortem voco,\nmais à la dépossession.\nPer Soclum Animarum, aperio collectio,\nque ce qui sommeille soit arraché.\nVis occulta, non t'appartiens plus,\nchange de porteur.\nNulla voluntas, nulla pugna,\ncar le souffle est déjà éteint.\nEx Incantatore vacuo,\nje retire la braise.\nSi corpus manet,\npotestas cadit.\nInter transfertum et rupture,\nje prends le risque.\nSic fit messis,\net le silence demeure.",
        socle: "Socle des Âmes",
        descriptionSocle: "A utiliser lorsque vous souhaitez extraire la puissance occulte liée à une vie, sans en consommer l'existence.",
        pointsManipulation: 0, pointsOcculte: 0,
        special: true, specialDescription: "Transfert de points entre membres — à valider et traiter manuellement par un haut grade."
    },
    {
        nom: "Sceau du Silence Déchu",
        gradeRequis: "Marcheur des Voiles", gradeOrdre: 1,
        utilisation: "Pour créer un sceau occulte destiné à être apposé sur un démon capable de manipuler l'énergie occulte, afin de lui interdire toute divulgation liée à la Sphère Occulte et de le priver entièrement de toute manipulation énergétique.",
        objetRequis: "Oui, le Socle des Glyphes du Néant et un support de sceau (marque gravée, fragment de chair, talisman ou inscription directe).",
        explication: "Le Marcheur des Voiles grave un glyphe de contrainte absolue à l'aide du socle, liant le sceau directement à l'essence démoniaque de la cible. Une fois apposé, le sceau agit comme un drain permanent.",
        texteIncantation: "Per glyphum vetitum et nexus infernum,\nje grave le silence dans l'essence.\nDaemon loquax, verba tua cadant,\navant même de naître.\nNon per mortem, non per oubli,\nmais par contrainte absolue.\nSoclum Glyphorum, aperire vinculum,\nlie l'ombre à la marque.\nVis occulta, si surgis,\nstatim consume et solve.\nNulla manipulatio, nulla emissio,\nchaque flux est drainé.\nDe Sphaera Occulta, tace,\nni signe, ni détour.\nSi lingua mentitur,\nque l'énergie se vide.\nInter daemon et scellum,\nje fixe la loi.\nSic stat Sigillum,\net le silence règne.",
        socle: "Socle des Glyphes du Néant",
        descriptionSocle: "A utiliser lorsque vous souhaitez sceller, lier et drainer totalement une entité, en imposant une contrainte occulte durable.",
        pointsManipulation: 2, pointsOcculte: 0, special: false
    },
    {
        nom: "Offrande de Spoliation Profane",
        gradeRequis: "Marcheur des Voiles", gradeOrdre: 1,
        utilisation: "Lorsqu'un Marcheur des Voiles souhaite sacrifier un Pourfendeur afin de consumer son essence et d'absorber l'énergie libérée à travers la salle rituelle.",
        objetRequis: "Oui, le Socle de l'Autel des Âmes Damnées, la présence physique du Pourfendeur vivant, et une salle capable de canaliser l'énergie occulte.",
        explication: "Le Pourfendeur est lié au socle par des glyphes de contrainte. La salle agit comme un amplificateur, empêchant la dispersion de l'énergie au moment de la mise à mort.",
        texteIncantation: "Soclum Altaris, expergiscere,\nouvre la gueule des damnés.\nHic stat venator,\nnon comme juge, mais comme offrande.\nPer vincula glyphorum,\nje lie sa volonté.\nSala resonat, parietes audiunt,\nretenez ce qui va se briser.\nSanguis cadit, anima clamat,\nne la laissez pas fuir.\nPer mortem non sacrée,\nje fracture l'essence.\nVis collecta, converge,\nne te disperse pas.\nEgo non sum salvator,\nego sum preneur.\nSi energia resistit,\nque la chair paie le prix.\nAltare, consume,\net rends-moi ce qui reste.\nSic fit sacrificium,\net la puissance est volée.",
        socle: "Socle de l'Autel des Âmes Damnées",
        descriptionSocle: "A utiliser lorsque vous souhaitez consommer entièrement l'énergie et l'essence d'une vie par un sacrifice rituel amplifié.",
        pointsManipulation: 2, pointsOcculte: 3, special: false
    },
    {
        nom: "Profanation du Voile Charnel",
        gradeRequis: "Marcheur des Voiles", gradeOrdre: 1,
        utilisation: "Pour corrompre et transformer un Pourfendeur vivant en une créature démoniaque imparfaite, coincée entre humanité brisée et essence infernale.",
        objetRequis: "Oui, le Socle des Âmes, ainsi qu'un espace clos permettant de contenir la déchirure du Voile durant la transformation.",
        explication: "Le Marcheur des Voiles force l'âme du Pourfendeur à entrer en résonance avec le Voile, fissurant son essence sans la détruire. La transformation n'est ni stable ni totale.",
        texteIncantation: "Soclum Animarum, audi cladem,\nceci n'est pas une ascension.\nHic stat venator,\nbrisé mais vivant.\nPer Velum laceratum,\nje fracture son reflet.\nAnima humana, ne fuge,\ntu serviras de fondation.\nVis daemonica, intra lente,\nne consume pas tout.\nCaro mutat, ossa respondent,\nle corps apprend à souffrir.\nMens resistit ?\nAlors brise-la.\nNon facio dominum,\nje façonne une aberration.\nInter hominem et daemonem,\nqu'il marche sans repos.\nSi Voluntas cadit,\nforma restat.\nVelum claude,\nlaisse la chose respirer.\nSic fit profanatio,\net le Pourfendeur n'est plus.",
        socle: "Socle des Âmes",
        descriptionSocle: "A utiliser lorsque vous souhaitez altérer, détourner ou corrompre l'essence d'une vie, sans la consumer totalement.",
        pointsManipulation: 4, pointsOcculte: 2, special: false
    },
    {
        nom: "Érosion de Présence — Sceau du Nom Dissous",
        gradeRequis: "Marcheur des Voiles", gradeOrdre: 1,
        utilisation: "Pour altérer de manière rituelle et prolongée l'identité d'un individu en lui faisant oublier son prénom et en fragmentant environ 15% de ses souvenirs.",
        objetRequis: "Oui, le Socle des Glyphes du Néant, ainsi qu'un support de focalisation (glyphe tracé, surface gravée ou marque temporaire).",
        explication: "Le Marcheur des Voiles inscrit un sceau d'érosion identitaire sur le socle, reliant temporairement l'ancrage mémoriel de la cible au Néant. Le prénom est dissocié du flux de conscience, tandis qu'une portion contrôlée des souvenirs est dispersée dans le Voile.",
        texteIncantation: "Soclum Glyphorum, sustine me,\nceci n'est pas un effacement.\nHic nomen scriptum est,\net je le détache.\nPer signum vetitum,\nje ne brise pas la mémoire,\nje la fragmente.\nPraenomen solvitur,\nretiré du flux.\nQuinque et decem partes recordationis,\nerrent entre les lignes.\nMens non cadit,\nmens vacillat.\nSouviens-toi d'exister,\noublie comment tu te nommes.\nSocle, retiens sans dévorer,\nle temps que le Voile décide.\nQuand le glyphe s'effacera,\nle fil se renouera.\nNon est poena aeterna,\nsed mora identitatis.\nSic stat sigillum,\net l'oubli demeure… temporaire.",
        socle: "Socle des Glyphes du Néant",
        descriptionSocle: "A utiliser lorsque vous souhaitez lier, fragmenter ou suspendre temporairement une identité ou un ancrage mémoriel, sans destruction définitive.",
        pointsManipulation: 2, pointsOcculte: 0, special: false
    }
];
