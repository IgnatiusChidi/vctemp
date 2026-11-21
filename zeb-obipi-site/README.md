# Prof. Isaac Zeb-Obipi – website (concept)

Plain HTML/CSS/JS. Pages: `index.html` (home), `book.html` (session booking), `admin/index.html` (temporary `/admin` route for the pitch). The admin shield icon in the navbar still appears only after an admin signs in. To remove the public route later, delete the `admin/` folder.

## Try it now (demo mode)
Serve the folder (`python3 -m http.server`) and open it. With no Supabase keys it runs on browser localStorage.
Demo admin: `admin@demo.com` / `admin123`. Sign-in: account button, footer lock, or Ctrl/Cmd+Shift+K.
Analytics shown in demo mode include sample data.

## Go live with Supabase
1. Create a Supabase project. Run `supabase/schema.sql` in the SQL Editor.
2. Put the project URL and anon key in `js/config.js`.
3. Sign up on the site with the Vice-Chancellor's email, then run:
   `update public.profiles set role = 'admin' where email = 'his-email@example.com';`
4. Sign in. Open the dashboard and click "Save starter content to Supabase" once.
5. Site & contact > upload the headshot.
(Auth > email confirmation can be on or off; with it on, users confirm by email before first sign-in.)

## Notes
- Courses are seeded as teaching areas (no course codes); edit in Courses.
- Publication/award/conference covers are generated art; upload real images per item.
- Approve/decline is shown in-app; email notifications would need a Supabase Edge Function.
# vctemp
