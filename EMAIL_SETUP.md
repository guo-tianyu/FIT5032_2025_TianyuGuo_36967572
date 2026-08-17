# Authenticated email attachment setup

The staff dashboard emails one student at a time and attaches a CSV generated from that student's selected support request.

## Architecture

`Vue staff dashboard -> Firebase ID token -> Alibaba Cloud Function Compute -> QQ SMTP -> student inbox`

The browser never receives the QQ SMTP authorisation code. The cloud function validates the Firebase ID token and only permits Firebase UIDs listed as authorised staff.

## Deploy the Alibaba Cloud function

1. Create a Function Compute function named `studywell-email-service`.
2. Select the Node.js 16 runtime and use `index.handler` as the request handler.
3. Copy `cloud-functions/email-service/index.js` into the function WebIDE as `index.js`.
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
2. Open the staff dashboard and choose an existing support request.
3. Prepare and send the support update.
4. Confirm that the selected student's inbox receives the email.
5. Download and open the attached `studywell-request-*.csv` file.
6. Confirm an unauthorised student account cannot access the staff page or call the function successfully.

## Privacy and security controls

- The recipient comes from an existing support request and is not a free-form bulk mailing list.
- The attachment contains only the selected request.
- The function rejects missing or invalid Firebase tokens.
- The function allows only explicitly configured staff UIDs.
- SMTP credentials remain in Alibaba Cloud environment variables and are excluded from the browser bundle and Git repository.
- The function limits message lengths and CSV attachments to 250 KB.
