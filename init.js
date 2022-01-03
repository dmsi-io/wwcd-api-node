const query = `
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`PRIZES\` (
    id INT PRIMARY KEY,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_key VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`USERS\` (
    id INT PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(24) NOT NULL,
    tickets INT 
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`ADMINS\` (
    id INT PRIMARY KEY;
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`TICKETS\` (
    id INT PRIMARY KEY,
    user_id INT,
    prize_id INT,
    created DATETIME,
    user BOOL,
    FOREIGN KEY (user_id) REFERENCES USERS(id),
    FOREIGN KEY (prize_id) REFERENCES PRIZES(id)
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`CATEGORIES\` (
    id INT PRIMARY KEY,
    image VARCHAR(255),
    name VARCHAR(255) NOT NULL
);
`;

const init = (service) => service.db.query(query);

module.exports = init;
