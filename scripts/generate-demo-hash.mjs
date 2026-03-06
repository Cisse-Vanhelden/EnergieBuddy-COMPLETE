import bcrypt from "bcryptjs";

const password = "Demo123!";
const hash = bcrypt.hashSync(password, 10);

console.log("\nGebruik deze hash in sql/seed.sql:");
console.log(hash);
console.log("");
