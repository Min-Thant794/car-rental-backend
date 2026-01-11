const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const config = require("../config/config");

if(!config.SECRET_KEY) {
    throw new Error("SECRET KEY is missing in Environment variables.");
}

const encodeBase64 = (data) => Buffer.from(data).toString("base64");
const decodeBase64 = (data) => Buffer.from(data, "base64").toString("utf8");
const generateRandomString = (length = 32) => crypto.randomBytes(length).toString("hex");
const generateRandomNumber = () => Math.floor(Math.random() * 1_000_000);
const generateUUID = () => uuidv4();

const deriveKey = (salt) => {
    return crypto.pbkdf2Sync(config.SECRET_KEY, salt, 100_000, 32, "sha512");
}

const encryption = (plainText) => {
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(16);
    const key = deriveKey(salt);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    //combine salt, iv, encrypted data into a single payload
    return `${salt.toString("hex")}:${iv.toString("hex")}:${encrypted}`;
};

const decryption = (encryptedText) => {
    const [saltHex, ivHex, encryptedHex] = encryptedText.split(":");
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const key = deriveKey(salt);

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    console.log("decrypted password ", decrypted)
    return decrypted;
};

//comparison
const comparison = (plainPassword, encryptedPassword) => {
    try {
        console.log("Plain: ", plainPassword, "Encrypted: ", encryptedPassword);
        const decrypted = decryption(encryptedPassword);
        console.log("Decrypted: ", decrypted);
        return crypto.timingSafeEqual(Buffer.from(plainPassword), Buffer.from(decrypted));
    } catch (error) {
        console.log("An Error Occurred at comparison()", error);
    }
}

module.exports = {
    encodeBase64,
    decodeBase64,
    generateRandomNumber,
    generateRandomString,
    generateUUID,
    encryption,
    decryption,
    comparison
}