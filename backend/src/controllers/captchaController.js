const captchaService = require('../services/captchaService');

/**
 * Controller to handle the generation of a new CAPTCHA.
 */
async function getCaptcha(req, res) {
  try {
    const { svg, text } = await captchaService.generateCaptcha(req.session.id);
    // Store in session — this modifies the session, ensuring the cookie is set
    req.session.captchaText = text;
    res.type('svg');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating CAPTCHA:', error);
    res.status(500).json({ message: 'Failed to generate CAPTCHA' });
  }
}

/**
 * Controller to handle the validation of a user-submitted CAPTCHA.
 */
async function postValidateCaptcha(req, res) {
  const { captchaInput } = req.body;
  const sessionId = req.session.id;

  if (!captchaInput) {
    return res.status(400).json({ message: 'CAPTCHA input is required.' });
  }

  try {
    const isValid = await captchaService.validateCaptcha(sessionId, captchaInput);
    if (isValid) {
      // The CAPTCHA is correct. Here you can set a flag on the session
      // to indicate that the user has been verified, so they can proceed
      // with the protected action (e.g., submitting a form).
      req.session.captchaVerified = true;
      return res.status(200).json({ message: 'CAPTCHA verified successfully.' });
    } else {
      req.session.captchaVerified = false;
      return res.status(400).json({ message: 'Invalid CAPTCHA.' });
    }
  } catch (error) {
    console.error('Error validating CAPTCHA:', error);
    res.status(500).json({ message: 'Error during CAPTCHA validation.' });
  }
}

module.exports = {
  getCaptcha,
  postValidateCaptcha,
};
