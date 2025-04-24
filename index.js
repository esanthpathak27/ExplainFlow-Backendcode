const express = require('express');
const cors = require('cors');
const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.post('/analyze', (req, res) => {
  const { text } = req.body;
  const doc = nlp.readDoc(text);
  const sentences = doc.sentences().out();
  let nodes = [];
  let edges = [];
  let nodeId = 0;

  doc.sentences().each((s) => {
    const sentText = s.out();
    const tokens = s.tokens().filter((t) => t.pos() !== 'punctuation');

    let subj = null, verb = null, obj = null;
    tokens.each((token) => {
      const pos = token.pos();
      if (pos === 'NOUN' && !subj) subj = token.out();
      if (pos === 'VERB' && !verb) verb = token.out();
      if ((pos === 'NOUN' || pos === 'PRONOUN') && subj && verb && !obj) obj = token.out();
    });

    if (subj && verb) {
      nodeId += 1;
      const id1 = nodeId.toString();
      nodes.push({ id: id1, label: subj });

      nodeId += 1;
      const id2 = nodeId.toString();
      nodes.push({ id: id2, label: obj ? `${verb} ${obj}` : verb });

      edges.push({ from: id1, to: id2 });
    }
  });

  res.json({ nodes, edges });
});

app.listen(port, () => {
  console.log(`ExplainFlow backend listening at http://localhost:${port}`);
});
