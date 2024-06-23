const { Sequelize } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

// const syncDatabase = async () => {
//   try {
//     await sequelize.sync({ force: true });
//     console.log("Database synchronized");
//   } catch (error) {
//     console.error("Error synchronizing database:", error);
//   }
// };

// syncDatabase();

module.exports = sequelize;
