import { databaseFromEnvironment } from './config.js';
import { migrate } from './migrate.js';
const db=databaseFromEnvironment({migration:true});
try{const count=await migrate(db);process.stdout.write(`Migrations verified: ${count}\n`);}finally{await db.close();}
