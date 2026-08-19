# Authenticated email attachment setup

The staff dashboard lets staff select multiple students and send personalised emails in one bulk action. Each message is sent separately and contains a CSV generated only from that recipient's support request.

## Architecture

`Vue staff dashboard -> Firebase ID token -> Alibaba Cloud Function Compute -> QQ SMTP -> student inbox`

The browser never receives the QQ SMTP authorisation code. The cloud function validates the Firebase ID token and only permits Firebase UIDs listed as authorised staff.

## Deploy the Alibaba Cloud function

1. Create a Function Compute function named `studywell-email-service`.
2. Select the Node.js 16 runtime and use `index.handler` as the request handler.
3. Upload the `cloud-functions/email-service` folder and install its `package.json` dependency during the Function Compute build.
4. Create a public HTTP trigger that permits `POST` and `OPTIONS`. Choose no platform authentication because the function performs Firebase bearer-token authentication itself.
5. Configure these function environment variables:

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your_qq_email@qq.com
SMTP_APP_PASSWORD=your_new_qq_smtp_authorisation_code
SMTP_FROM_NAME=StudyWell Connect
FIREBASE_API_KEY=your_firebase_web_api_key
ALLOWED_STAFF_UIDS=your_firebase_staff_uid
ALLOWED_ORIGIN=https://guo-tianyu.github.io
```

For multiple authorised staff accounts, separate Firebase UIDs with commas. Never commit or screenshot `SMTP_APP_PASSWORD`.

6. Deploy the code and copy the HTTP trigger URL.
7. Add the URL to `studywell-connect/.env.local`:

```env
VITE_EMAIL_FUNCTION_URL=https://your-email-function-url
```

8. Restart the Vite development server after changing `.env.local`.

## Acceptance test

1. Sign in to StudyWell as the authorised staff user.
2. Open the staff dashboard and select at least two existing support requests.
3. Prepare and send the bulk support update.
4. Confirm that every selected student's inbox receives a separate personalised email.
5. Download the attached `studywell-request-*.csv` files and confirm each contains only its recipient's request.
6. Confirm an unauthorised student account cannot access the staff page or call the function successfully.

## Privacy and security controls

- Recipients come from existing support requests and are not entered as a free-form mailing list.
- Bulk messages are sent separately, so recipients cannot see one another's addresses.
- Each attachment contains only its recipient's selected request.
- The function rejects missing or invalid Firebase tokens.
- The function allows only explicitly configured staff UIDs.
- SMTP credentials remain in Alibaba Cloud environment variables and are excluded from the browser bundle and Git repository.
- The function limits message lengths and CSV attachments to 250 KB.
