# Project Blueprint: Secure CAPTCHA Integration

## 1. Overview

This document outlines the implementation of a secure CAPTCHA generation and validation system for the application. The goal is to protect against automated bots and ensure that user interactions are genuine.

### Core Technologies

- **Backend:** Node.js, Express
- **CAPTCHA Generation:** `svg-captcha`
- **Session Management:** `express-session`
- **Session Storage:** `connect-redis` with a Redis server

## 2. Feature Implementation

### Backend

- **Modular Architecture:** The logic is separated into a `captchaService.js` for CAPTCHA generation and Redis operations, a `captchaController.js` to handle API requests, and `captcha.js` for routing.
- **Redis Integration:** A Redis client is configured and used to store CAPTCHA values with a 2-minute expiration, keyed by the user's session ID.
- **Session Management:** `express-session` is configured to use a Redis-backed store, ensuring that sessions are persistent and secure.
- **ES Module Conversion:** The entire backend has been updated to use modern ES Module syntax (`import`/`export`) for consistency and to adhere to the project requirements.

### Endpoints

- **`GET /api/generate-captcha`**: Generates a new SVG CAPTCHA image and stores its value in the user's session.
- **`POST /api/validate-captcha`**: Validates the user-submitted CAPTCHA input against the stored value.

## 3. Usage and Testing

### Testing with `curl`

You can test the CAPTCHA endpoints using `curl` and a cookie file to simulate a user session.

**1. Generate a CAPTCHA:**

```bash
# The -c cookie.txt saves the session cookie for the next request
curl -X GET http://localhost:5000/api/generate-captcha -c cookie.txt --output captcha.svg
```

This will save the CAPTCHA image to `captcha.svg`. Open this file to see the CAPTCHA text.

**2. Validate the CAPTCHA:**

Replace `"YOUR_CAPTCHA_TEXT"` with the text from the generated image.

```bash
# The -b cookie.txt sends the saved session cookie
curl -X POST http://localhost:5000/api/validate-captcha -b cookie.txt -H "Content-Type: application/json" -d '{"captchaInput": "YOUR_CAPTCHA_TEXT"}'
```

### Frontend React Example

Here is a conceptual example of how to integrate the CAPTCHA functionality into a React component.

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios to send cookies with requests
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Important for sending session cookies
});

const CaptchaComponent = () => {
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [message, setMessage] = useState('');

  const fetchCaptcha = async () => {
    try {
      const response = await apiClient.get('/generate-captcha', {
        responseType: 'blob', // Fetch as a blob to create an object URL
      });
      const imageUrl = URL.createObjectURL(response.data);
      setCaptchaImage(imageUrl);
    } catch (error) {
      console.error('Error fetching CAPTCHA:', error);
      setMessage('Failed to load CAPTCHA.');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/validate-captcha', { captchaInput });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.message || 'An error occurred.');
    }
  };

  return (
    <div>
      <h2>CAPTCHA Verification</h2>
      {captchaImage && <img src={captchaImage} alt="CAPTCHA" />}
      <button onClick={fetchCaptcha}>Refresh CAPTCHA</button>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value)}
          placeholder="Enter CAPTCHA"
          required
        />
        <button type="submit">Validate</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CaptchaComponent;
```
## 4. Redis Configuration

The application is configured to use Redis in both development and production environments, with a robust connection logic that allows the application to function even if Redis is unavailable.

### Environment-Specific Configuration

The `backend/src/config/redis.js` script detects the environment to determine how to connect to Redis:

-   **Production:** When running in a Docker container (detected by the presence of `/run/secrets/db_user`), the script connects to Redis using the `REDIS_URL` environment variable, which is set to `redis://redis:6379` in the `docker-compose.prod.yml` file.

-   **Development:** In a local development environment, the script connects to a remote Redis service using credentials stored in the `.env` file (`REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, and `REDIS_PORT`).

### Connection Logic

The `redis.js` file exports a `getRedisClient` function that manages the connection. It includes:

-   **Lazy Connection:** The connection to Redis is only established when it is first requested.
-   **Reconnection Strategy:** The client will automatically attempt to reconnect if the connection is lost.
-   **Graceful Failure:** If the Redis service is unavailable, the `getRedisClient` function will return `null`, and the application will log a warning without crashing. This ensures that the application remains operational even if the Redis-dependent features are not.
