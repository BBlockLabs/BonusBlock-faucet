import app from './src/app';

app.listen(process.env.PORT, () => {
  console.log(`Faucet app listening on port ${process.env.PORT}`)
});