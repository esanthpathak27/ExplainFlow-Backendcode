from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class Explanation(BaseModel):
    text: str

@app.post("/analyze")
def analyze_text(data: Explanation):
    doc = nlp(data.text)
    nodes = []
    edges = []
    node_id = 0
    for sent in doc.sents:
        subj, verb, obj = None, None, None
        for token in sent:
            if "subj" in token.dep_:
                subj = token.text
            elif token.dep_ == "ROOT":
                verb = token.text
            elif "obj" in token.dep_:
                obj = token.text
        if subj and verb:
            node_id += 1
            subj_id = str(node_id)
            nodes.append({"id": subj_id, "label": subj})
            node_id += 1
            verb_id = str(node_id)
            nodes.append({"id": verb_id, "label": f"{verb} {obj}" if obj else verb})
            edges.append({"from": subj_id, "to": verb_id})
    return {"nodes": nodes, "edges": edges}
