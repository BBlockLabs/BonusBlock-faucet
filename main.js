import app from './src/app';

app.listen(process.env.PORT, () => {
  console.info(`Faucet app listening on port ${process.env.PORT} using ${process.env.RPC_ENDPOINT} RPC`);
});
