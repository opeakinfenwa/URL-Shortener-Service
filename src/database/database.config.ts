import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const env = process.env.NODE_ENV;

  let uri = process.env.DATABASE_URL;
  if (env === 'production') uri = process.env.DATABASE_URL_PROD;
  else if (env === 'test') uri = process.env.DATABASE_URL_TEST;

  return {
    uri,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,
    autoIndex: env !== 'production',
  };
});