# Store

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Deploying to Firebase Hosting

Build the app before deploying so Firebase Hosting has the generated browser
files. This Angular SSR build creates `dist/store/browser/index.csr.html`, which
Hosting serves for the app and client-side routes:

```powershell
npm.cmd run build
firebase deploy --only hosting
```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Product catalog in Firestore

The catalog reads products in real time from the root `privee` collection in
the `privee-catalog` Firestore database. Each document in `privee` is one
product (for example, `privee/producto`). Create each product document with
these fields:

| Field         | Firestore type | Example                             |
| ------------- | -------------- | ----------------------------------- |
| `id`          | number         | `1`                                 |
| `name`        | string         | `"ASAD"`                            |
| `company`     | string         | `"Lattafa"`                         |
| `imageSrc`    | string         | `"https://example.com/asad.jpg"`    |
| `description` | string         | `"Inspired of Sauvage Dior Elixir"` |
| `price`       | number         | `20000`                             |
| `type`        | string         | `"arabe"`                           |

Use `arabe`, `diseñador`, or `nicho` for `type`. The app expects all fields and
their types as listed above. It listens to the collection in real time. Documents
that do not match this schema are excluded without interrupting the other
products; the maintenance page identifies their document IDs and allows the
administrator to delete them.

## Product maintenance

The product maintenance UI is available at `/admin`. It uses Google
Authentication and is restricted to the verified account
`vargasd2106@gmail.com`.

Before using it:

1. In Firebase Console, enable **Authentication > Sign-in method > Google**.
2. Add `localhost` under **Authentication > Settings > Authorized domains** for local development.
3. Use the Google account `vargasd2106@gmail.com`; the app rejects all other accounts.
4. Review and deploy the prototype Firestore rules from `firestore.rules`:

   ```powershell
   npx.cmd firebase-tools deploy --only firestore:rules --project privee-catalog
   ```

The storefront can read products without signing in; only the verified
administrator can create, update, or delete products. The rules deny access to
other collections. Review them before deploying to production.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
