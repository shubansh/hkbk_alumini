# Social Feed Database Setup Guide

The Social Media Feed Manager requires two specific tables in your Supabase database: `social_posts` and `social_settings`. 
Because we cannot run SQL directly on your database for security reasons, you must manually run the initialization script.

## Steps to Initialize

1. Open the file `supabase_social_feed.sql` located in the root of this project.
2. Select all text (`Ctrl+A` or `Cmd+A`) and copy it.
3. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
4. Select the project connected to this application.
5. On the left sidebar, click on **SQL Editor**.
6. Click **New Query**.
7. Paste the copied SQL code into the editor.
8. Click the green **Run** button at the bottom right.
9. You should see a "Success" message in the results panel.

## What this script does
- Creates the `social_posts` table to store your Instagram and LinkedIn embeds.
- Creates the `social_settings` table to store your Instagram Graph API credentials.
- Sets up **Row Level Security (RLS)** to ensure only authenticated Admins can modify the feed, while anyone can view the active posts on the homepage.
- Enables **Realtime** on the tables so the Admin panel updates instantly when posts are synced.

## Troubleshooting
- If you see a `Could not find the table public.social_posts in the schema cache` error in the admin panel, it means this script has not been run or Supabase needs a moment to update its cache. Simply reload the page.
