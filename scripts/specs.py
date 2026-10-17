# -*- coding: utf-8 -*-
"""Especificaciones reales por producto (handle -> datos).

Fuente: "CHAMPUS SAVIA DE ALMA - ESPECIFICACIONES.docx" (Elementos de marca).
Incluye INCI, nº de registro CPNP, % de ingredientes naturales (Norma Cosmos),
peso y nº de usos. Datos disponibles para los champus solidos.
"""

# Datos genericos de la gama de champus solidos.
GENERICO_CHAMPU = {
    "peso": "65 g · mas de 60 lavados",
    "fabricacion": "Elaborado a mano, uno a uno. Sin SLS ni SCI. Sin plastico (cero residuos). Vegano.",
}

SPECS = {
    "champu-te-matcha": {
        "cpnp": "3175569",
        "natural": "94,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Camellia Sinensis Leaf Extract, Parfum, Geraniol, Hexyl Cinnamal, Limonene, Linalool, CI 74160, CI 21100.",
    },
    "champu-cebolla-arcilla": {
        "cpnp": "3859334",
        "natural": "98% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Allium cepa bulb Extract, Parfum, Illite, Limonene.",
    },
    "champu-indigo-lavanda": {
        "cpnp": "4148266",
        "natural": "96,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Lavandula Angustifolia Flower Oil, Parfum, Indigofera Tinctoria Leaf Powder, CI 77007, Alpha-Isomethyl Ionone, Hydroxycitronellal, Limonene, Linalool.",
    },
    "champu-betaina-sal": {
        "cpnp": "3987564",
        "natural": "96% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Cocamidopropyl Betaine, Aqua, Parfum, Sodium Chloride, Amyl Cinnamal, Benzyl Alcohol, Benzyl Salicylate, Citral, Geraniol, Hexyl Cinnamal, Limonene, Linalool, CI 19140.",
    },
    "champu-romero-quina": {
        "cpnp": "3907972",
        "natural": "98% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Cinchona calisaya bark Extract, Rosmarinus officinalis leaf Extract, Illite, Kaolin, Alcohol Denat, Parfum, Benzyl Benzoate, Cinnamal, Citral, Citronellol, Coumarin, Eugenol, Farnesol, Alpha-Isomethyl Ionone, Geraniol, Hydroxycitronellal, Isoeugenol, Limonene, Linalool.",
    },
    "champu-cafeina-canela": {
        "cpnp": "3859323",
        "natural": "92,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Parfum, Coffea arabica seed Powder, Caffeine, Cinnamomum cassia Bark, Benzyl Benzoate, Cinnamal, Cinnamyl Alcohol, Coumarin, Eugenol.",
    },
    "champu-cade-enebro": {
        "cpnp": "3852869",
        "natural": "92,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Juniperus oxycedrus Wood Oil.",
    },
    "champu-avena-almendra": {
        "cpnp": "3907967",
        "natural": "Ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Kaolin, Illite, Avena Sativa Kernel Extract, Prunus Amygdalus Dulcis Oil, Parfum, Citronellol, Alpha-Isomethyl Ionone, Hexyl Cinnamal, Limonene, Linalool.",
    },
    "champu-cacao": {
        "cpnp": "3175568",
        "natural": "96,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Theobroma cacao seed powder, Aqua, Cocos nucifera Oil, Parfum, Butyrospermum parkii butter, Theobroma cacao seed butter, Cinnamal, Coumarine.",
    },
}

# Aplica los datos genericos de gama a cada champu.
for _h, _v in SPECS.items():
    if _h.startswith("champu-"):
        _v.setdefault("peso", GENERICO_CHAMPU["peso"])
        _v.setdefault("fabricacion", GENERICO_CHAMPU["fabricacion"])

# --- Jabones y desodorantes (fichas leidas de las etiquetas INCI del Drive) ---
GEN_JABON = "Jabon artesano saponificado, hecho a mano en Espana. Vegano · Sin plastico · Cero residuos."
GEN_DESO = "Desodorante solido, hecho a mano en Espana. Vegano · Sin plastico · Sin sales de aluminio."

JABON_DESO_SPECS = {
    "jabon-lavanda": ("1387159", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Lavandula Angustifolia Oil, Linalool, Limonene, CI 77007, CI 17200, CI 45100.", GEN_JABON),
    "jabon-pepita-uva": ("2194655", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Limonene, Linalool, Vitis Vinifera Vine Extract (Red Wine), Amyl Cinnamal, Vitis Vinifera Seed Oil, Vitis Vinifera Seed, Citronellol, Geraniol, Citral, Benzyl Salicylate, Hexyl Cinnamal.", GEN_JABON),
    "jabon-carbon-activo": ("2745583", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Charcoal Powder, Linalool, Eugenol.", GEN_JABON),
    "jabon-rosa-mosqueta": ("1386290", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Geraniol, Citronellol, Rosa Canina Flower, Rosa Canina Fruit Oil, Linalool, Hexyl Cinnamal, CI 45100, CI 17200.", GEN_JABON),
    "jabon-azufre": ("2195611", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Limonene, Parfum, Sulfur, Citral, Linalool, CI 19140, CI 42045, CI 50420, CI 17200.", GEN_JABON),
    "jabon-monoi": ("3077312", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Amyl Cinnamal, Morinda Citrifolia Fruit Juice, CI 77891, Citronellol, Geraniol, Limonene, CI 14720, CI 19140, CI 42045, CI 17200, CI 45100, CI 42090.", GEN_JABON),
    "jabon-argan": ("1387162", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, CI 77891, Argania Spinosa Kernel Oil, Evernia Prunastri, Hydroxycitronellal, Geraniol, CI 19140, CI 14720.", GEN_JABON),
    "jabon-arbol-te": ("1387161", "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Melaleuca Alternifolia Leaf Oil, Limonene, CI 77288, CI 42090.", GEN_JABON),
    "desodorante-te-verde": ("4164680", "Cetearyl Alcohol, Cocos Nucifera Oil, Parfum, Sodium Stearoyl Glutamate, Octyldodecanol, Coco-Caprylate, Glycerin, Benzyl Benzoate, Benzyl Salicylate, Cinnamyl Alcohol, Citral, Citronellol, Coumarin, Eugenol, Alpha-Isomethyl Ionone, Geraniol, Hexyl Cinnamal, Isoeugenol, Limonene, Linalool.", GEN_DESO),
    "desodorante-algodon": ("3867185", "Cetearyl Alcohol, Cocos Nucifera Oil, Parfum, Sodium Stearoyl Glutamate, Octyldodecanol, Coco-Caprylate, Glycerin, Benzyl Benzoate, Benzyl Salicylate, Cinnamyl Alcohol, Citral, Citronellol, Coumarin, Eugenol, Alpha-Isomethyl Ionone, Geraniol, Hexyl Cinnamal, Isoeugenol, Limonene, Linalool.", GEN_DESO),
    "desodorante-pomelo": ("4164676", "Cetearyl Alcohol, Cocos Nucifera Oil, Parfum, Sodium Stearoyl Glutamate, Octyldodecanol, Coco-Caprylate, Glycerin, CI 45100, Benzyl Salicylate, Limonene.", GEN_DESO),
    "desodorante-madera": ("3867191", "Cetearyl Alcohol, Cocos Nucifera Oil, Parfum, Sodium Stearoyl Glutamate, Octyldodecanol, Coco-Caprylate, Glycerin, Curcuma Longa Root Powder, Benzyl Salicylate, Citral, Citronellol, Coumarin, Eugenol, Geraniol, Limonene, Linalool.", GEN_DESO),
}
for _h, (_cpnp, _inci, _fab) in JABON_DESO_SPECS.items():
    _peso = "50 g" if _h.startswith("desodorante") else "100 g"
    SPECS[_h] = {"cpnp": _cpnp, "inci": _inci, "peso": _peso, "fabricacion": _fab}

# --- Faciales, depilacion y barba (INCI leido de documentos del Drive) ---
MAS_SPECS = {
    "limpiador-facial-aloe-pepino": {
        "cpnp": "4448218", "peso": "65 g",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Parfum, Aloe barbadensis leaf juice, Citric Acid, CI 61570, Anise Alcohol, Limonene.",
        "fabricacion": "Limpiador facial solido, hecho a mano en Espana · Vegano · Sin plastico · pH semejante al de la piel.",
    },
    "limpiador-facial-rosa-mosqueta": {
        "cpnp": "4150232", "peso": "65 g",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Parfum, Rosa Canina Fruit Oil, Illite, Benzyl Salicylate, Citronellol, Gamma-Methyl Ionone, Geraniol, Hydroxycitronellal, Linalool.",
        "fabricacion": "Limpiador facial solido, hecho a mano en Espana · Vegano · Sin plastico · pH semejante al de la piel.",
    },
    "espuma-depilacion-aloe": {
        "peso": "90 g",
        "inci": "Sodium Coco-Sulfate, Aqua, Cocos nucifera Oil, Parfum, Butyrospermum parkii Butter, Theobroma cacao Seed Butter, Cocamidopropyl Betaine, Aloe barbadensis leaf juice, Benzyl Alcohol, CI 61570.",
        "fabricacion": "Espuma de depilacion solida, hecha a mano en Espana · Vegana · Sin plastico.",
    },
    "espuma-depilacion-uva": {
        "cpnp": "4270095", "peso": "90 g",
        "inci": "Sodium Coco-Sulfate, Aqua, Cocos nucifera Oil, Parfum, Butyrospermum parkii Butter, Theobroma cacao Seed Butter, Cocamidopropyl Betaine, Vitis vinifera seed oil, Linalool, CI 14720.",
        "fabricacion": "Espuma de depilacion solida, hecha a mano en Espana · Vegana · Sin plastico.",
    },
    "champu-barba-carbon": {
        "cpnp": "3852941", "peso": "65 g",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Cocamidopropyl Betaine, Parfum, Charcoal Powder, Benzyl Salicylate, Citronellol, Coumarine, Limonene.",
        "fabricacion": "Champu solido en frio, hecho a mano en Espana · Vegano · Sin plastico.",
    },
}
SPECS.update(MAS_SPECS)

# --- Resto de fichas (del documento "PLANTILLA ETIQUETAS SAVIA DE ALMA") ---
GEN_ACOND = "Acondicionador solido, hecho a mano en Espana · Vegano · Sin plastico."
GEN_AFEIT = "Espuma de afeitado solida, hecha a mano en Espana · Vegana · Sin plastico."

PLANTILLA_SPECS = {
    "acondicionador-coco": {
        "cpnp": "3598209", "peso": "55 g", "fabricacion": GEN_ACOND,
        "inci": "Cetearyl Alcohol, Cocos Nucifera Oil, Sodium Stearoyl Glutamate, Octyldodecanol, Coco-Caprylate, Glycerin, Parfum, Guar Hydroxypropyltrimonium Chloride, Coumarin.",
    },
    "acondicionador-almendra": {
        "cpnp": "3656533", "peso": "55 g", "fabricacion": GEN_ACOND,
        "inci": "Cetearyl Alcohol, Cocos Nucifera Oil, Sodium Stearoyl Glutamate, Octyldodecanol, Coco-Caprylate, Glycerin, Prunus Amygdalus Dulcis Oil, Parfum, Guar Hydroxypropyltrimonium Chloride, Limonene, Linalool, CI 16255.",
    },
    "espuma-afeitar-avellana": {
        "cpnp": "4270127", "peso": "90 g", "fabricacion": GEN_AFEIT,
        "inci": "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Corylus Avellana Seed Oil, Parfum.",
    },
    "jabon-cbd": {
        "cpnp": "5810163", "peso": "100 g", "fabricacion": GEN_JABON,
        "inci": "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Camellia Sinensis Leaf Powder, Arnica Montana Flower Extract, Cannabidiol, Hexyl Cinnamal, Linalyl Acetate, Acetyl Cedrene, Pinene, CI 19140, CI 42045, CI 50420, Potassium Sorbate.",
    },
    "jabon-naranja-canela": {
        "cpnp": "5810157", "peso": "100 g", "fabricacion": GEN_JABON,
        "inci": "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Citrus Aurantium Peel Oil, Cinnamomum Zeylanicum Bark Oil, Cinnamomum Zeylanicum Bark Powder, Eugenia Caryophyllus Oil, Limonene, Eugenol, Linalool, Linalyl Acetate, Amyl Cinnamal, Terpineol, Beta-Caryophyllene, Pinene, CI 15985.",
    },
    "jabon-borraja": {
        "cpnp": "5810155", "peso": "100 g", "fabricacion": GEN_JABON,
        "inci": "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Borago Officinalis Seed Oil, Pogostemon Cablin Oil, Hexamethylindanopyran, Tetramethyl Acetyloctahydronaphthalenes, Benzyl Benzoate, CI 19140, CI 14720, CI 42045.",
    },
    "jabon-karite": {
        "cpnp": "1387042", "peso": "100 g", "fabricacion": GEN_JABON,
        "inci": "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Butyrospermum Parkii Butter, Linalool, Citronellol, Alpha-Isomethyl Ionone, Hexyl Cinnamal, Geraniol, Coumarin, Benzyl Salicylate, Benzyl Benzoate, Eugenol, CI 14720, CI 17200, CI 50420.",
    },
    "jabon-aguacate": {
        "cpnp": "3077317", "peso": "100 g", "fabricacion": GEN_JABON,
        "inci": "Sodium Olivate, Sodium Cocoate, Aqua, Glycerin, Parfum, Persea Gratissima Oil, Hexyl Cinnamal, Linalool, Limonene, Amyl Cinnamal, Benzyl Salicylate, Citronellol, CI 77891, CI 19140, CI 14720, CI 17200.",
    },
}
SPECS.update(PLANTILLA_SPECS)
