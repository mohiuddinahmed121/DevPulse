import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = async () => {
   try {
      await initDB();

      app.listen(config.port, () => {
         console.log(`Server running on port ${config.port}`);
      });
   } catch (error) {
      console.log(error);
   }
};

main();
