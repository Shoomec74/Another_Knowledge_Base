'use strict';
require('dotenv').config();

const buildMongoUri = () => {
  const user = encodeURIComponent(process.env.DB_USERNAME);
  const pass = encodeURIComponent(process.env.DB_PASSWORD);
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const db = process.env.DB_NAME;
  const rs = process.env.DB_REPLICATION_SET;

  const params = ['authSource=admin'];

  if (rs) params.push(`replicaSet=${encodeURIComponent(rs)}`);

  const env = process.env.NODE_ENV || 'development';

  if (env !== 'prod'){
    params.push('directConnection=true');
  } else {
    params.push('retryWrites=true', 'w=majority');
  }

  return `mongodb://${user}:${pass}@${host}:${port}/${db}?${params.join('&')}`;
};

module.exports = {
  mongodb: {
    url: buildMongoUri(),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: 'src/migrations',
  changelogCollectionName: '_migrations',
  migrationFileExtension: '.js',
  useFileHash: false,
};


