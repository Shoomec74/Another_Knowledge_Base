module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Добавляем уникальный составной индекс на поля title и profile
    await db.collection('bots').createIndex(
      { title: 1, profile: 1 },
      { unique: true }
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Откат — удаляем этот индекс
    await db.collection('bots').dropIndex('title_1_profile_1');
  }
};
