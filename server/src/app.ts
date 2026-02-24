import express from "express";
import { createWRERouter } from "./routes/wreRoutes";
import { createWREAiRouter } from "./routes/wreAiRoutes";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(createWRERouter());
  app.use(createWREAiRouter());
  return app;
};

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`WRE stub server listening on http://localhost:${port}`);
  });
}
