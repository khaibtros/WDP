const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client();

const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
  });

  return ticket.getPayload();
};

module.exports = { verifyGoogleToken };
