const mongoHost = process.env.AMBULANCE_API_MONGODB_HOST;
const mongoPort = process.env.AMBULANCE_API_MONGODB_PORT;

const mongoUser = process.env.AMBULANCE_API_MONGODB_USERNAME;
const mongoPassword = process.env.AMBULANCE_API_MONGODB_PASSWORD;

const database =
  process.env.AMBULANCE_API_MONGODB_DATABASE || "davgus-ambulance-wl";
const retrySeconds =
  parseInt(process.env.RETRY_CONNECTION_SECONDS || "5", 10) || 5;

const departmentsCollection = "departments";
const patientsCollection = "patients";
const placementsCollection = "placements";

const defaultDepartments = [
  {
    id: "d1",
    name: "Kardiologia",
    rooms: [
      { id: "r1", number: "101", capacity: 3, status: "active" },
      { id: "r2", number: "102", capacity: 2, status: "active" },
      { id: "r3", number: "103", capacity: 1, status: "maintenance" },
    ],
  },
  {
    id: "d2",
    name: "Chirurgia",
    rooms: [
      { id: "r4", number: "201", capacity: 4, status: "active" },
      { id: "r5", number: "202", capacity: 2, status: "active" },
    ],
  },
  {
    id: "d3",
    name: "Neurologia",
    rooms: [
      { id: "r6", number: "301", capacity: 2, status: "active" },
      { id: "r7", number: "302", capacity: 1, status: "active" },
    ],
  },
];

function ensureCollection(dbInstance, name) {
  const names = dbInstance.getCollectionNames();
  if (!names.includes(name)) {
    dbInstance.createCollection(name);
    print(`Created collection '${name}' in database '${database}'`);
  }
}

let connection;
while (true) {
  try {
    connection = Mongo(
      `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}`,
    );
    break;
  } catch (exception) {
    print(`Cannot connect to mongoDB: ${exception}`);
    print(`Will retry after ${retrySeconds} seconds`);
    sleep(retrySeconds * 1000);
  }
}

const db = connection.getDB(database);

ensureCollection(db, departmentsCollection);
ensureCollection(db, patientsCollection);
ensureCollection(db, placementsCollection);

db[departmentsCollection].createIndex({ id: 1 }, { unique: true });
db[patientsCollection].createIndex({ id: 1 }, { unique: true });
db[placementsCollection].createIndex({ id: 1 }, { unique: true });

let insertedDepartments = 0;
for (const department of defaultDepartments) {
  const result = db[departmentsCollection].updateOne(
    { id: department.id },
    { $setOnInsert: department },
    { upsert: true },
  );

  if (result && result.upsertedCount === 1) {
    insertedDepartments += 1;
  }
}

print(`Ensured database '${database}' with required collections`);
print(`Inserted ${insertedDepartments} default departments`);

process.exit(0);
