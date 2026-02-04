# API layer (Axios + services)

## Structure

- **`axios.ts`** – Base axios instance, `baseURL`, `setAccessToken` / `getAccessToken`, request (auth header) and response (error shape) interceptors.
- **`types.ts`** – Request/response types and `mapApiUserToAuthUser()` for Redux.
- **`services/auth.service.ts`** – `login`, `register`.
- **`services/events.service.ts`** – `findAll`, `findAllAdmin`, `findOne`, `create`, `update`, `remove`, `publish`, `cancel`.
- **`services/index.ts`** – Re-exports services.
- **`index.ts`** – Public API: axios, token helpers, services, types.

## Usage

### Sync token with Redux

After login/register, set the token so axios sends it on subsequent requests:

```ts
import { authService, setAccessToken, mapApiUserToAuthUser } from '@/lib/api';
import { setCredentials } from '@/lib/slices/auth-slice';

const res = await authService.login({ email, password });
dispatch(setCredentials({
  user: mapApiUserToAuthUser(res.user),
  accessToken: res.access_token,
}));
setAccessToken(res.access_token);
```

On logout:

```ts
import { clearCredentials } from '@/lib/slices/auth-slice';
import { setAccessToken } from '@/lib/api';

dispatch(clearCredentials());
setAccessToken(null);
```

### Calling events API

```ts
import { eventsService } from '@/lib/api';

const list = await eventsService.findAll();
const one = await eventsService.findOne(id);
await eventsService.create({ title, dateTime, location, capacity });
```

All authenticated requests use the token set via `setAccessToken`.
