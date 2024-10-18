import express from 'express';
import router from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', router);

app.get('/', (req, res) => {
  res.send('Welcome to the GalaxyGuard API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
