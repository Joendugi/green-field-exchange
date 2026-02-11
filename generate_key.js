
import crypto from "crypto";
import fs from "fs";

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
});

// Export Private Key as PEM
const privateKeyPem = privateKey.export({
    type: "pkcs8",
    format: "pem",
});

// Generate JWKS from Public Key
const publicKeyJwk = publicKey.export({
    format: "jwk",
});

// For RSA256, we need alg and use
const jwks = {
    keys: [
        {
            ...publicKeyJwk,
            kid: "default",
            alg: "RS256",
            use: "sig",
        },
    ],
};

// Write to files to avoid terminal garbling
fs.writeFileSync("jwt_private_key.txt", privateKeyPem);
fs.writeFileSync("jwks_json.txt", JSON.stringify(jwks, null, 2));

console.log("\n--- SUCCESS ---");
console.log("1. Open 'jwt_private_key.txt' and copy EVERYTHING.");
console.log("2. Open 'jwks_json.txt' and copy EVERYTHING.");
console.log("3. Add them to your Convex Dashboard Environment Variables.");
