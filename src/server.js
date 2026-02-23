require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const { graphqlUploadExpress } = require("graphql-upload");

const { connectDB } = require("./config/db");
const { initCloudinary } = require("./config/cloudinary");
const { typeDefs } = require("./graphql/typeDefs");
const { resolvers } = require("./graphql/resolvers");
const { getUserFromToken } = require("./middleware/auth");

async function start() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // enables Upload scalar
  app.use(graphqlUploadExpress({ maxFileSize: 5_000_000, maxFiles: 1 }));

  initCloudinary();
  await connectDB(process.env.MONGO_URI);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ req, user: getUserFromToken(req) }),
    formatError: (err) => ({
      message: err.message,
      code: err.originalError?.code || "GRAPHQL_ERROR",
    }),
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});