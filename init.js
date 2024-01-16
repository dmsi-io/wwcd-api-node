const query = `
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`PRIZES\` (
    id INT NOT NULL AUTO_INCREMENT,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    multiplier int default 1 null comment 'Number of this prize to be given away',
    description TEXT,
    image_key VARCHAR(255),
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`USERS\` (
    id INT NOT NULL AUTO_INCREMENT,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(24) NOT NULL,
    tickets INT,
    PRIMARY KEY (id)
    
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`ADMINS\` (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`CATEGORIES\` (
    id INT NOT NULL AUTO_INCREMENT,
    image VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
)
`;

const ticketsQuery = `
CREATE TABLE IF NOT EXISTS \`wwcd\`.\`TICKETS\` (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT,
    prize_id INT,
    created DATETIME,
    used BIT,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES USERS(id),
    FOREIGN KEY (prize_id) REFERENCES PRIZES(id)
);
`;

const deleteTrigger = `
CREATE TRIGGER prize_delete
    BEFORE DELETE
    ON \`wwcd\`.\`PRIZES\`
    FOR EACH ROW
BEGIN
    DELETE FROM \`wwcd\`.\`TICKETS\` WHERE \`wwcd\`.\`TICKETS\`.prize_id = OLD.id;
END;

CREATE TRIGGER user_delete
    BEFORE DELETE
    ON USERS
    FOR EACH ROW
BEGIN
    DELETE FROM TICKETS WHERE TICKETS.user_id = OLD.id;
END;
`;

const init = (service) => {
  return Promise.all(query.split(';').map((q) => service.db.query(q)))
    .then(() => service.db.query(ticketsQuery))
    .then(() => Promise.all(deleteTrigger.split(';').map((q) => service.db.query(q))));
};

module.exports = init;
