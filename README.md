# Social Media App API

A REST API for a social media application built with Node.js, Express, TypeScript, MongoDB, Redis, Cloudinary, and Socket.IO.

## Features

- User registration, login, email verification, and password reset.
- JWT access and refresh tokens with role-based authorization.
- Profile and password management.
- Posts with image uploads, likes, comments, replies, and sharing.
- Friend requests, accepted friendships, and user blocking.
- Conversations and real-time messaging.
- Stories, notifications, and reports.

## Tech Stack

- Node.js and Express 5
- TypeScript
- MongoDB with Mongoose
- Redis for OTPs, reset tokens, and revoked token data
- Cloudinary for image storage
- Nodemailer with Gmail for email delivery
- Socket.IO for real-time chat and presence
- Zod for request validation

## Requirements

Install the following before running the project:

- Node.js and npm
- MongoDB
- Redis
- A Cloudinary account
- A Gmail App Password for OTP and password-reset emails

## Configuration

The application loads its environment file from the `NODE_ENV` value:

- `NODE_ENV=dev` loads `.env.dev`
- `NODE_ENV=prod` loads `.env.prod`

Create an environment file from the template:

```powershell
Copy-Item .env.example .env.dev
```

Replace all placeholders with real values. The main variables are:

| Variable                      | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `PORT`                        | HTTP server port                                                           |
| `MONGO_URI`                   | MongoDB connection string used by the application                          |
| `MONGO_URI_PROD`              | Production MongoDB connection string reserved for production configuration |
| `SALT`                        | bcrypt salt rounds                                                         |
| `JWT_USER_SIGNATURE`          | User access-token secret                                                   |
| `JWT_ADMIN_SIGNATUER`         | Admin access-token secret; the spelling matches the current code           |
| `JWT_USER_REFRESH_SIGNATURE`  | User refresh-token secret                                                  |
| `JWT_ADMIN_REFRESH_SIGNATURE` | Admin refresh-token secret                                                 |
| `REDIS_URI`                   | Redis connection string                                                    |
| `APP_EMAIL`                   | Gmail account used to send emails                                          |
| `APP_PASSWORD`                | Gmail App Password                                                         |
| `CLOUDINARY_URL`              | Cloudinary connection URL                                                  |

Never commit `.env.dev` or `.env.prod`. Only commit `.env.example` with placeholder values.

## Installation and Running

Install dependencies:

```bash
npm install
```

Start the development environment. This runs the TypeScript compiler in watch mode and starts the compiled server:

```bash
npm run dev
```

Start the production configuration:

```powershell
Copy-Item .env.example .env.prod
npm run prod
```

The default server URL is:

```text
http://localhost:3000
```

## Testing

The project uses Jest with SWC to run TypeScript tests without requiring MongoDB or Redis for unit tests.

Run the test suite once:

```bash
npm test
```

Run Jest in watch mode while developing:

```bash
npm run test:watch
```

Generate an HTML and terminal coverage report:

```bash
npm run test:coverage
```

Tests are stored in the `tests/` directory and use the `*.spec.ts` naming convention.

## Authentication

Protected endpoints require the access token in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

Users must verify their email before using protected endpoints. Admin-only endpoints additionally require an admin JWT role.

All MongoDB IDs in path parameters must be valid 24-character hexadecimal ObjectIds.

## Response Format

Successful responses use this format:

```json
{
  "message": "Success",
  "data": {}
}
```

Validation errors and application errors are returned by the global error middleware. Common status codes are:

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `400`  | Invalid request data or validation error                   |
| `401`  | Missing, invalid, or expired access token                  |
| `403`  | Authenticated user is not allowed to perform the operation |
| `404`  | Requested resource was not found                           |
| `409`  | Resource conflict, such as an existing email or friendship |

## REST API Reference

Base URL:

```text
http://localhost:3000
```

### Authentication: `/auth`

| Method | Endpoint                | Auth | Request                                                                                                               |
| ------ | ----------------------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/auth/signup`          | No   | `multipart/form-data`: `userName`, `email`, `phone`, `password`, `confirmPassword`, optional image field `profilePic` |
| `POST` | `/auth/login`           | No   | JSON: `email`, `password`                                                                                             |
| `POST` | `/auth/verify-otp`      | No   | JSON: `email`, `otp` (exactly 6 digits)                                                                               |
| `POST` | `/auth/forgot-password` | No   | JSON: `email`                                                                                                         |
| `POST` | `/auth/reset-password`  | No   | JSON: `email`, `resetToken`, `password`, `confirmPassword`                                                            |
| `POST` | `/auth/refresh-token`   | No   | JSON: `refreshToken`                                                                                                  |

Password fields must be between 6 and 20 characters. Signup also requires an 11-character phone number.

### Users: `/users`

| Method   | Endpoint             | Auth | Request                                                                                                                                |
| -------- | -------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/users`             | No   | Query: `page` default `1`, `limit` default `10`, maximum `50`                                                                          |
| `GET`    | `/users/:userId`     | No   | User ID in the path                                                                                                                    |
| `GET`    | `/users/me`          | Yes  | Returns the authenticated user's profile                                                                                               |
| `PATCH`  | `/users/me`          | Yes  | `multipart/form-data`: optional `userName`, `phone`, image field `profilePic`, `profilePic` URL, `profileCoverPic` URL array, `gender` |
| `PATCH`  | `/users/me/password` | Yes  | JSON: `currentPassword`, `newPassword`, `confirmPassword`                                                                              |
| `DELETE` | `/users/me`          | Yes  | Deletes the authenticated user's account                                                                                               |

Profile image uploads accept image files up to 5 MB.

### Posts: `/posts`

| Method   | Endpoint                  | Auth | Request                                                                                                               |
| -------- | ------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/posts`                  | Yes  | `multipart/form-data`: optional `content`, up to 10 image files under `images`                                        |
| `GET`    | `/posts`                  | Yes  | Query: `page`, `limit` (maximum `50`), `scope` (`friends` or `all`), optional `author`                                |
| `GET`    | `/posts/:id`              | Yes  | Post ID in the path                                                                                                   |
| `PATCH`  | `/posts/:id`              | Yes  | `multipart/form-data`: optional `content`, `removeImagePublicIds`, `replaceImages`, and up to 10 files under `images` |
| `DELETE` | `/posts/:id`              | Yes  | Deletes the post owned by the authenticated user                                                                      |
| `POST`   | `/posts/:id/like`         | Yes  | Likes the post                                                                                                        |
| `DELETE` | `/posts/:id/like`         | Yes  | Removes the current user's like                                                                                       |
| `POST`   | `/posts/:id/share`        | Yes  | JSON or form data with optional `content`                                                                             |
| `POST`   | `/posts/:postId/comments` | Yes  | JSON: `content`                                                                                                       |
| `GET`    | `/posts/:postId/comments` | Yes  | Query: `page`, `limit` (maximum `50`)                                                                                 |

Post content can contain up to 5,000 characters. Comment content can contain up to 2,000 characters.

### Comments: `/comments`

| Method   | Endpoint                       | Auth | Request                                                 |
| -------- | ------------------------------ | ---- | ------------------------------------------------------- |
| `PATCH`  | `/comments/:commentId`         | Yes  | JSON: `content`                                         |
| `DELETE` | `/comments/:commentId`         | Yes  | Deletes the comment and its direct replies when allowed |
| `POST`   | `/comments/:commentId/replies` | Yes  | JSON: `content`; replies can only be one level deep     |
| `GET`    | `/comments/:commentId/replies` | Yes  | Query: `page`, `limit`                                  |
| `POST`   | `/comments/:commentId/like`    | Yes  | Likes the comment                                       |
| `DELETE` | `/comments/:commentId/like`    | Yes  | Removes the current user's like                         |

### Friends: `/friends`

| Method   | Endpoint                              | Auth | Description                                     |
| -------- | ------------------------------------- | ---- | ----------------------------------------------- |
| `POST`   | `/friends/requests/:userId`           | Yes  | Sends a friend request                          |
| `GET`    | `/friends/requests/received`          | Yes  | Lists received friend requests                  |
| `GET`    | `/friends/requests/sent`              | Yes  | Lists sent friend requests                      |
| `PATCH`  | `/friends/requests/:requestId/accept` | Yes  | Accepts a received request                      |
| `PATCH`  | `/friends/requests/:requestId/reject` | Yes  | Rejects a received request                      |
| `DELETE` | `/friends/requests/:requestId`        | Yes  | Cancels a sent request                          |
| `GET`    | `/friends`                            | Yes  | Lists accepted friends                          |
| `GET`    | `/friends/status/:userId`             | Yes  | Returns the friendship status with another user |
| `DELETE` | `/friends/:userId`                    | Yes  | Removes an accepted friend                      |

Only accepted friends can start conversations or exchange messages.

### Conversations: `/conversations`

| Method  | Endpoint                                  | Auth | Request                                                       |
| ------- | ----------------------------------------- | ---- | ------------------------------------------------------------- |
| `POST`  | `/conversations`                          | Yes  | JSON: `receiverId`                                            |
| `GET`   | `/conversations`                          | Yes  | Lists the authenticated user's conversations                  |
| `GET`   | `/conversations/:conversationId`          | Yes  | Conversation ID in the path                                   |
| `GET`   | `/conversations/:conversationId/messages` | Yes  | Query: optional `cursor`, `limit` default `30`, maximum `100` |
| `PATCH` | `/conversations/:conversationId/read`     | Yes  | Marks received messages as read                               |

## Source Routers Not Mounted Yet

The following routers exist in the source code but are not currently mounted in `src/app.controller.ts`. Their endpoints will not be reachable over HTTP until they are added to the application:

| Router        | Method   | Endpoint                              | Request                                                                                 |
| ------------- | -------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| Stories       | `POST`   | `/stories`                            | `multipart/form-data`: image field `image`, optional `caption` (maximum 500 characters) |
| Stories       | `GET`    | `/stories`                            | Authenticated user's story feed                                                         |
| Stories       | `GET`    | `/stories/:storyId`                   | Story ID in the path                                                                    |
| Stories       | `POST`   | `/stories/:storyId/view`              | Records a story view                                                                    |
| Stories       | `GET`    | `/stories/:storyId/viewers`           | Lists story viewers                                                                     |
| Stories       | `DELETE` | `/stories/:storyId`                   | Deletes a story                                                                         |
| Notifications | `GET`    | `/notifications`                      | Query: `page` default `1`, `limit` default `20`, maximum `50`                           |
| Notifications | `PATCH`  | `/notifications/read`                 | Marks all notifications as read                                                         |
| Notifications | `PATCH`  | `/notifications/:notificationId/read` | Marks one notification as read                                                          |
| Blocks        | `GET`    | `/blocks`                             | Lists users blocked by the current user                                                 |
| Blocks        | `POST`   | `/blocks/:userId`                     | Blocks a user                                                                           |
| Blocks        | `DELETE` | `/blocks/:userId`                     | Unblocks a user                                                                         |
| Reports       | `POST`   | `/reports`                            | JSON: `targetType`, `targetId`, `reason`                                                |
| Reports       | `GET`    | `/reports`                            | Lists reports created by the current user                                               |
| Reports       | `GET`    | `/reports/all`                        | Admin only; lists all reports                                                           |
| Reports       | `PATCH`  | `/reports/:reportId`                  | Admin only; JSON: `status`                                                              |

## Socket.IO API

Socket.IO uses the same server URL as the REST API. Provide the access token in `auth.token` or in the `Authorization` header during the handshake.

### Client-to-server events

| Event                 | Payload                       | Description                                              |
| --------------------- | ----------------------------- | -------------------------------------------------------- |
| `conversation:join`   | `conversationId`              | Joins a conversation after participant validation        |
| `conversation:leave`  | `conversationId`              | Leaves a conversation room                               |
| `typing:start`        | `{ conversationId }`          | Notifies other participants that the user started typing |
| `typing:stop`         | `{ conversationId }`          | Notifies other participants that the user stopped typing |
| `conversation:create` | `{ receiverId }`              | Creates a conversation with an accepted friend           |
| `message:send`        | `{ conversationId, content }` | Sends a message                                          |
| `message:read`        | `{ conversationId }`          | Marks messages as read                                   |

### Server-to-client events

| Event                  | Description                              |
| ---------------------- | ---------------------------------------- |
| `presence:online`      | A user became online                     |
| `presence:offline`     | A user disconnected; includes `lastSeen` |
| `conversation:created` | A new conversation was created           |
| `message:new`          | A new message was sent in a conversation |
| `message:delivered`    | A message was delivered to its receiver  |
| `message:read`         | Messages were marked as read             |
| `typing:start`         | Another participant started typing       |
| `typing:stop`          | Another participant stopped typing       |

## Project Structure

```text
src/
  common/       Shared services, exceptions, interfaces, and utilities
  config/       Environment configuration
  database/     MongoDB connection and Mongoose models
  middleware/   Authentication, validation, upload, and error middleware
  modules/      Feature modules and REST controllers
  socket/       Socket.IO authentication and event handlers
```

## Operational Notes

- OTP codes and password-reset tokens expire after 10 minutes.
- Auth and profile image uploads accept image files up to 5 MB.
- Post uploads support up to 10 images per request.
- Cloudinary stores uploaded profile, post, and story images.
- Redis must be reachable before the application can use OTPs, reset tokens, or token revocation.
- Chat operations require an accepted friendship between the participants.
