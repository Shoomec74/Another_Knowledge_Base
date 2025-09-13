#!/bin/bash
set -euo pipefail

# Подхватить переменные из .env (если есть)
if [ -f /usr/local/bin/.env ]; then
  set -o allexport
  # shellcheck disable=SC2046
  export $(grep -v '^#' /usr/local/bin/.env | xargs)
  set +o allexport
fi

DBPATH="/data/db"
LOGPATH="$DBPATH/mongod.log"
PIDFILE="/tmp/mongod.pid"

# 1) Временный запуск для инициализации RS/пользователя
mongod -f /etc/mongo/mongod.conf \
  --replSet "${DB_REPLICATION_SET}" --bind_ip_all \
  --fork --logpath /data/db/mongod.log --pidfilepath /tmp/mongod.pid

# Ждём, пока mongod примет соединения
tries=60
until mongosh --quiet --eval "db.runCommand({ping:1}).ok" | grep -q "^1$"; do
  ((tries--)) || { echo "mongod didn’t become ready"; exit 1; }
  sleep 1
done

# Инициализация реплика-сета (идемпотентно)
if mongosh --quiet --eval "rs.status().ok" | grep -q "1"; then
  echo "Replica set already initiated."
else
  echo "Initiating replica set..."
  mongosh --quiet --eval "rs.initiate({_id:'${DB_REPLICATION_SET}', members:[{_id:0, host:'mongo:27017'}]})"
fi

# Ждём PRIMARY
tries=60
until mongosh --quiet --eval "db.hello().isWritablePrimary" | grep -q "true"; do
  ((tries--)) || { echo "Primary not ready"; exit 1; }
  sleep 1
done

# Создание root-пользователя (без usersInfo — сразу createUser)
if [[ -n "${MONGO_INITDB_ROOT_USERNAME:-}" && -n "${MONGO_INITDB_ROOT_PASSWORD:-}" ]]; then
  mongosh --quiet admin <<EOF
const u = ${MONGO_INITDB_ROOT_USERNAME@Q};
const p = ${MONGO_INITDB_ROOT_PASSWORD@Q};
try {
  const res = db.runCommand({ createUser: u, pwd: p, roles: [ { role: "root", db: "admin" } ] });
  if (res.ok) {
    print("root user created - " + u);
  } else {
    throw new Error(JSON.stringify(res));
  }
} catch (e) {
  if ((e.code && e.code === 51003) || /already exists/i.test(String(e))) {
    print("root user already exists - " + u);
  } else {
    print("createUser failed: " + e);
    quit(1);
  }
}
EOF
else
  echo "MONGO_INITDB_ROOT_USERNAME/PASSWORD not set, skip user creation."
fi

# 2) Гасим временный mongod
mongod --shutdown --dbpath /data/db || {
  [[ -f /tmp/mongod.pid ]] && kill -2 "$(cat /tmp/mongod.pid)" || true
}

# 3) Финальный запуск в форграунде как PID 1
exec mongod -f /etc/mongo/mongod.conf --replSet "${DB_REPLICATION_SET}" --bind_ip_all
