#!/usr/bin/env python
import sys, json, re, pandas as pd, spacy

# 1) Load spaCy model
nlp = spacy.load("en_core_web_sm")

# 2) Symptom → related keywords mapping
SYMPTOM_KEYWORDS = {
    "dry eyes":    ["dry eyes","vision","ocular","eye"],
    "bone pain":   ["bone pain","joint","mobility","bone"],
    "headache":    ["headache","migraine","tension"],
    "fever":       ["fever","temperature"],
    "fatigue":     ["fatigue","energy metabolism","tired","exhaustion"],
    "constipation":["constipation","bowel"],
    "hair loss":   ["hair loss","alopecia","bald","hair"],
    "joint pain":  ["joint pain","arthri","mobility"],
}

def clean_record(r):
    return {k: None if pd.isna(v) else v for k,v in r.items()}

def load_data():
    read = lambda f: pd.read_csv(f, engine="python", on_bad_lines="skip")
    sup = pd.concat([read("LabelStatements_1.csv"), read("LabelStatements_2.csv")], ignore_index=True)
    sup = sup[sup["Statement Type"] == "Other"]
    pov = pd.concat([read("ProductOverview_1.csv"), read("ProductOverview_2.csv")], ignore_index=True)
    oth = pd.concat([read("OtherIngredients_1.csv"), read("OtherIngredients_2.csv")], ignore_index=True)
    m = pd.merge(pov, sup, on=["URL","DSLD ID","Product Name"], how="right")
    return pd.merge(m, oth, on=["URL","DSLD ID","Product Name"], how="right")

def extract_symptoms(text):
    doc = nlp(text)
    syms = [ent.text.lower() for ent in doc.ents if ent.label_ in ("SYMPTOM","DISEASE","CONDITION")]
    return list(set(syms))  # unique

def main():
    # Expect exactly 5 args after script name
    if len(sys.argv) != 6:
        print(json.dumps({"success": True, "message": "Wrong args—fallback", "results": []}))
        return

    age, brand, market, desc, allergy = sys.argv[1:]
    data = load_data()

    # 1) NER + keyword fallback
    syms = extract_symptoms(desc)
    for k in SYMPTOM_KEYWORDS:
        if k in desc.lower() and k not in syms:
            syms.append(k)

    # 2) Initial matching via keywords
    matched = pd.DataFrame()
    if syms:
        for sym in syms:
            for kw in SYMPTOM_KEYWORDS.get(sym, [sym]):
                mask = data["Statement"].str.contains(kw, case=False, na=False)
                matched = pd.concat([matched, data[mask]])
    else:
        matched = data.copy()

    if matched.empty:
        matched = data.copy()

    # 3) Age filter (<=6)
    if age.isdigit() and int(age) <= 6:
        matched = matched[matched["Supplement Form [LanguaL]"]
                          .str.contains("Powder|Liquid|Gummy|Jelly", case=False, na=False)]

    # 4) Brand filter
    if brand.lower() != "nan":
        matched = matched[matched["Brand Name"].str.contains(brand, case=False, na=False)]

    # 5) Market filter
    if market.lower() in ("true","yes","1"):
        matched = matched[matched["Market Status"].str.contains("On Market", case=False, na=False)]

    # 6) Allergy filter
    allergens = {'peanuts':['peanuts'],
                    'nuts':['nuts','Walnuts', 'almonds', 'cashews', 'pistachios', 'pecans', 'hazelnuts'],
                    'milk':['cheese','butter', 'yogurt', 'milk', 'dairy'],
                    'eggs':['chicken','egg','eggs'],
                    'fish':['fish','salmon', 'tuna', 'halibut'],
                    'shellfish':['shellfish','shrimp', 'crab', 'lobster', 'mussel'],
                    'wheat':['bread', 'wheat', 'pasta', 'baked'],
                    'soy':['soy', 'tofu'],
                    'mustard':['mustard', 'mustard seed'],
                    'sesame':['sesame', 'sesame oil', 'sesame seed'],
                    'celery':['celery'],
                    'sulfites':['sulfite'],
                    'lupin':['lupin'],
                    'mollusks':['octapus', 'squid', 'cuttlefish'],
                    'kiwi':['kiwi'],
                    'pineapple':['pineapple'],
                    'avocado':['avocado', 'guacamole'],
                    'banana':['banana'],
                    'strawberries':['strawberry'],
                    'tomato':['tomato']}
    
    for a in [x.strip().lower() for x in allergy.split(",") if x.strip()]:
        for key, triggers in allergens.items():
            if a == key or a in triggers:
                matched = matched[~matched["Other Ingredients"].str.contains(key, case=False, na=False)]

    # 7) Final fallback: if still empty, take the very first product
    if matched.empty:
        fb = data.iloc[[0]]
        recs = [clean_record(r) for r in fb.to_dict(orient="records")]
        print(json.dumps({"success": True, "message": "Fallback top product", "results": recs}, indent=2))
        return

    # 8) Return cleaned unique results
    recs = [clean_record(r) for r in matched.drop_duplicates().to_dict(orient="records")]
    print(json.dumps({"success": True, "message": "OK", "results": recs}, indent=2))

if __name__ == "__main__":
    main()
