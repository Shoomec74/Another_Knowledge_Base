'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');

async function createIndexes(db) {
  await db.collection('users').createIndex({ 'credentials.email': 1 }, { unique: true, name: 'uniq_email' });
  await db.collection('users').createIndex({ deletedAt: 1 }, { name: 'idx_users_deletedAt' });
  await db.collection('users').createIndex({ role: 1 }, { name: 'idx_users_role' });
  await db.collection('articles').createIndex({ tags: 1 }, { name: 'idx_articles_tags' });
  await db.collection('articles').createIndex({ author: 1 }, { name: 'idx_articles_author' });
  await db.collection('articles').createIndex({ isPublic: 1, isPublished: 1, isDraft: 1 }, { name: 'idx_articles_flags' });
  await db.collection('articles').createIndex({ deletedAt: 1 }, { name: 'idx_articles_deletedAt' });
  await db.collection('blacklisttokens').createIndex({ token: 1 }, { unique: true, name: 'uniq_blacklist_token' });
  await db.collection('blacklisttokens').createIndex({ expirationDate: 1 }, { name: 'idx_blacklist_expiration' });
}

const dropIfExists = async (collection, indexName) => {
  const list = await collection.indexes();
  if (list.some((i) => i.name === indexName)) {
    try { await collection.dropIndex(indexName); } catch { }
  }
};

async function dropIndexes(db) {
  const users = db.collection('users');
  const articles = db.collection('articles');
  const blacklist = db.collection('blacklisttokens');

  await dropIfExists(users, 'uniq_email');
  await dropIfExists(users, 'idx_users_deletedAt');
  await dropIfExists(users, 'idx_users_role');
  await dropIfExists(articles, 'idx_articles_tags');
  await dropIfExists(articles, 'idx_articles_author');
  await dropIfExists(articles, 'idx_articles_flags');
  await dropIfExists(articles, 'idx_articles_deletedAt');
  await dropIfExists(blacklist, 'uniq_blacklist_token');
  await dropIfExists(blacklist, 'idx_blacklist_expiration');
}

async function seedAdmin(db) {
  const email = process.env.SEED_ADMIN_EMAIL;

  const password = process.env.SEED_ADMIN_PASSWORD;

  const username = process.env.SEED_ADMIN_USERNAME;

  const existing = await db.collection('users').findOne({ 'credentials.email': email, deletedAt: { $in: [null, undefined] } });

  if (existing) return;

  if (!password || typeof password !== 'string') {
    throw new Error('SEED_ADMIN_PASSWORD is not set or invalid');
  }

  const salt = await bcrypt.genSalt();

  const passwordHash = await bcrypt.hash(password, salt);

  const Role = { ADMIN: 2 };

  await db.collection('users').insertOne({
    username,
    credentials: { email, password: passwordHash },
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

module.exports = {
  async up(db, client) {
    await Promise.all([
      createIndexes(db),
      seedAdmin(db),
    ]);
  },

  async down(db, client) {
    await dropIndexes(db);
    await db.collection('users').deleteOne({ 'credentials.email': process.env.SEED_ADMIN_EMAIL });
  },
};
