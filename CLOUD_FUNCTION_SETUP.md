# StudyWell Support Insights Cloud Function

This original StudyWell function uses the HTTP-trigger deployment pattern introduced in FIT5032 Lab 9. It analyses non-sensitive service statistics on the server and returns an operational recommendation to the protected staff dashboard.

## Deploy on Alibaba Cloud Function Compute

1. Create a Node.js HTTP-trigger function named `studywell-support-insights`.
2. Upload the contents of `cloud-functions/support-insights`.
3. Set the handler to `index.handler`, allow anonymous HTTP access for the assessment demonstration, and deploy.
4. Copy the public HTTP trigger URL.
5. Add the URL to `studywell-connect/.env.local`:

   `VITE_SUPPORT_INSIGHTS_FUNCTION_URL=https://your-function-url`

6. Restart Vite, sign in with a staff account and open the staff dashboard.
7. Select **Run server analysis** and confirm that the returned metrics appear.

## Demonstration evidence

- Alibaba Cloud deployment page showing the function name and HTTP trigger.
- The deployed function code or version.
- The staff dashboard displaying metrics returned by the function.
- Browser network tools showing a successful POST request to the endpoint.

Only request status/category and workshop capacity/booking totals are sent. Student names, email addresses and support descriptions remain in the application.
