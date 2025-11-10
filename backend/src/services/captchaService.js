import svgCaptcha from 'svg-captcha';
import redisClient from '../config/redis.js';

/**
 * Generates a new CAPTCHA and stores its text in Redis.
 * @param {string} sessionId - The user's session ID, used as the key in Redis.
 * @returns {Promise<{svg: string}>} An object containing the CAPTCHA's SVG markup.
 */
async function generateCaptcha(sessionId) {
  const captcha = svgCaptcha.create({
    size: 6,
    ignoreChars: '0o1i',
    noise: 2,
    color: true,
    background: '#f0f0f0',
  });

  // Store the CAPTCHA text in Redis, expiring after 2 minutes
  await redisClient.set(`captcha:${sessionId}`, captcha.text, { EX: 120 });

  return { svg: captcha.data };
}

/**
 * Validates the user's input against the CAPTCHA text stored in Redis.
 * @param {string} sessionId - The user's session ID.
 * @param {string} userInput - The CAPTCHA text submitted by the user.
 * @returns {Promise<boolean>} True if the input is correct, false otherwise.
 */
async function validateCaptcha(sessionId, userInput) {
  const storedCaptcha = await redisClient.get(`captcha:${sessionId}`);

  // Immediately delete the CAPTCHA after the first attempt to prevent replay attacks
  if (storedCaptcha) {
    await redisClient.del(`captcha:${sessionId}`);
  }

  if (!storedCaptcha || !userInput) {
    return false;
  }

  // Case-insensitive comparison
  return storedCaptcha.toLowerCase() === userInput.toLowerCase();
}

export { generateCaptcha, validateCaptcha };
