import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let validToken = 'mock-access-token';

app.post('/oauth/v2/token', (req, res) => {
  const { grant_type } = req.body;
  if (grant_type !== 'client_credentials') {
    res.status(400).json({ error: 'unsupported_grant_type' });
    return;
  }
  
  res.json({
    access_token: validToken,
    expires_in: 3600,
    token_type: 'Bearer'
  });
});

app.get('/v2/eats/order/:id', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${validToken}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = req.params.id;
  const fixturePath = path.join(__dirname, '../../../../fixtures/uber/get-order-response.json');
  
  try {
    const data = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    data.id = id;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read fixture' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Mock Uber Server listening on port ${PORT}`);
});
