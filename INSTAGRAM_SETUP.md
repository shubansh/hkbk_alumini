# Instagram Graph API Setup Guide

To enable automatic syncing of Instagram posts to the HKBK Connect homepage, you need to set up the Meta Graph API and link it to the university's Instagram account.

## Prerequisites
1. An **Instagram Business** or **Creator** account.
2. A **Facebook Page** connected to that Instagram account.
3. A **Meta Developer** account.

---

## Step 1: Create a Meta App
1. Go to the [Meta for Developers](https://developers.facebook.com/) portal and log in.
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Next**.
4. Select **Business** -> **Next**.
5. Name the app (e.g., "HKBK Connect Social Feed") and enter your contact email. Click **Create app**.

## Step 2: Add Instagram Graph API Product
1. On the App Dashboard, scroll down to **Add products to your app**.
2. Find **Instagram Graph API** and click **Set Up**.

## Step 3: Generate Access Tokens
For a serverless setup like ours, we will generate a Long-Lived Page Access Token manually.
1. In the sidebar, go to **Tools** -> **Graph API Explorer**.
2. Under "Meta App", select your new app.
3. Under "User or Page", select **Get Page Access Token**.
4. Authorize with your Facebook account and select the Facebook Page linked to your Instagram account.
5. In "Permissions", ensure you add:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
6. Click **Generate Access Token**. 
7. Copy this Short-Lived Token.

## Step 4: Convert to Long-Lived Token
1. Go to the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
2. Paste your Short-Lived Token and click **Debug**.
3. Scroll down and click **Extend Access Token**.
4. Copy the new **Long-Lived Access Token**. (Note: This token needs to be refreshed every 60 days, or we can use the API to request permanent tokens later).

## Step 5: Get your Instagram User ID
1. Go back to the **Graph API Explorer**.
2. Using your new token, run the following GET request:
   `me/accounts?fields=instagram_business_account`
3. The response will look like this:
   ```json
   {
     "data": [
       {
         "instagram_business_account": {
           "id": "178414XXXXXXX"
         },
         "id": "123456789"
       }
     ]
   }
   ```
4. Copy the `id` inside `instagram_business_account`. This is your `VITE_INSTAGRAM_USER_ID`.

## Step 6: Environment Variables
Add the following to your `.env` file at the root of the project:

```env
VITE_INSTAGRAM_ACCESS_TOKEN=your_long_lived_token_here
VITE_INSTAGRAM_USER_ID=your_instagram_business_account_id_here
```

## Step 7: Done!
Go to the **Social Media Feed** tab in your HKBK Admin Panel and click "Sync Latest Posts". The API will now fetch your latest posts and store them in Supabase securely.
