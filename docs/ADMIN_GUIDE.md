# Admin Guide: Managing Your Website

This guide is for you, Saba. It explains how to update your website yourself, without any code.

## What this is

Your website has four tabs: **About**, **Resume**, **Certificates** and **Blog**. You change everything on it through an admin panel, a private editing page in your browser. When you save a change there, the website updates on its own within about 1–2 minutes.

| | Address |
|---|---|
| Your website | `https://<your-github-username>.github.io/` |
| Admin panel | `https://<your-github-username>.github.io/admin/` |

Your developer will fill in the real addresses at launch.

**GitHub** is the online service where your website's files are stored. Your GitHub account is also your key to the admin panel.

## Signing in

1. Open the admin panel address.
2. Click **Sign In with GitHub**.
3. GitHub asks you to approve. Click to approve.
4. You are now in the admin panel.

Good to know:

- Your GitHub account must have **two-factor authentication (2FA)** turned on. This means GitHub asks for a second proof, besides your password, when you sign in. A **passkey** or a **security key** is the best option. Keep your GitHub **recovery codes** somewhere safe, such as a password manager or a printed copy at home.
- Signing in by pasting an "access token" is switched off on purpose. Always use **Sign In with GitHub**.
- Ignore the **Work with Local Repository** button. It is a tool for your developer.
- The admin panel may offer **Sign in with mobile** with a QR code. **Never share or screenshot that QR code.** It contains your sign-in key.
- On a shared computer, always sign out when you finish.
- The admin works best in an up-to-date **Chrome, Edge, Firefox or Safari** on a computer. It also works on a phone, but the screen is cramped.

## How publishing works

- **Every save is published.** There is no separate "publish" button.
- After you save, the change goes to your GitHub storage. An automatic check then tests your content and rebuilds the site.
- The live site updates in **about 1–2 minutes**.
- If something breaks a rule, the check stops. For example, a link that doesn't start with `https://`, or an image with location data. Your site then **keeps showing the previous version**. Nothing breaks, but your change won't appear. See [My change didn't appear](#my-change-didnt-appear).
- **Every save is kept in history.** Nothing is ever truly lost. Your developer can restore any older version.

## A tour of the admin

The admin has three areas: **Site content**, **Certificates** and **Blog**.

### Site content → Profile & settings

Everything in your sidebar, plus a few site-wide settings.

- **Full name**: used in the page title and by search engines.
- **Name as shown in the sidebar**: one line per entry (1 to 3 lines).
- **Title badge**: the small badge under your name, one line per entry (for example "M.Sc. Student" and "in Artificial Intelligence").
- **Profile photo** and **Photo description (for screen readers)**. The description is read aloud to people who cannot see the photo.
- **Protect profile photo from casual saving** (on by default): visitors can't right-click "Save image", drag the photo, or long-press it on a phone. No website can stop screenshots, so think of this as a deterrent, not a lock.
- **Email**, **Phone**, **Location**, each with its own show switch (**Show email**, **Show phone**, **Show location**).
- **Social links**: each has a **Name**, an **Icon**, a **Link** and a **Show this link** switch. **Show social links** hides them all at once.
- **Menu tabs**: switches for **Show the Resume tab**, **Show the Certificates tab** and **Show the Blog tab (and blog post pages)**. The About tab is always shown.
- **Search engines & sharing** (click to open): **Browser tab title**, **Description** (max 300 characters) and **Image for link previews**, the picture shown when someone shares your site.
- **Website address**: set once at launch. You rarely need to change it.

### Site content → About tab

- **Heading** at the top of the tab.
- **Introduction** (with **Show the introduction**).
- **Publications line**: the sentence that points to your Google Scholar page (with **Show the publications line**).
- **News & announcements**: a list of short items. Each has a **Show this announcement** switch. **Show News & Announcements** hides the whole block, and **News heading** changes its title.
- **"In a nutshell" cards**: each card has an **Icon**, a **Title**, a **Text** and a **Show this card** switch. **Show "In a nutshell" cards** hides the whole block.

### Site content → Resume tab

- **Heading** at the top of the tab.
- **Sections**, such as Education or Experience. Each section has a **Section title**, an **Icon**, a **Show this section** switch and a list of **Entries**.
- Each **Entry** has a **Title**, a **Period** (for example "Sep. 2024 — present"), **Details** and a **Show this entry** switch. In Details, each line is shown on its own line.
- You can drag sections and entries to change their order.

### Certificates

One item per certificate. Fields:

| Field | What it does |
|---|---|
| Certificate name | The main title. |
| Issued by | The organisation that gave it. |
| Category | Creates the filter buttons. Spell it **exactly the same way** for certificates that belong together. |
| Issue date / Expiry date | Optional. |
| Credential ID | Optional. |
| Verification link | Optional. Must start with `https://`. |
| Certificate image | **Required.** A photo or scan of the certificate. |
| Short description | Optional. |
| Position | Lower numbers are shown first. |
| Show on the website | Switch off to hide it. |

### Blog

One item per post. Fields: **Title**, **Date**, **Category**, **Cover image** (required), **Cover image description**, **Short summary** (required, max 500 characters), **External link**, **Draft (hide from the website)** and **Post text**.

A post is one of two kinds:

- **A post on another website** (Medium, a journal…): paste its address in **External link** and leave **Post text** empty. The blog card links straight there.
- **A post written here**: leave **External link** empty and write in **Post text**. The post gets its own page on your site.

Posts are shown newest first, by **Date**.

## Show and hide switches

Switches hide things **from your website** without deleting them. Switch one back on and the item returns exactly as it was.

Hidden is not the same as secret. Hidden items are still stored with your website's files. Don't put anything truly private in the admin, even in a hidden item.

## Common tasks

In every task, finish by clicking **Save**. Then wait 1–2 minutes and refresh your website.

### Change your photo or title

1. Go to **Site content → Profile & settings**.
2. To change the photo, go to **Profile photo** and upload a new image. Update **Photo description (for screen readers)** too.
3. To change your title, edit the lines under **Title badge**.
4. Click **Save**.

### Add a news announcement

1. Go to **Site content → About tab**.
2. Under **News & announcements**, click the add button for a new **Announcement**.
3. Type the **Text**. You can use bold, italic and links.
4. The list shows the newest item first. If your new item appears at the bottom, drag it to the top.
5. Click **Save**.

### Add a resume entry

1. Go to **Site content → Resume tab**.
2. Open the right section, for example Education.
3. Under **Entries**, click the add button for a new **Entry**.
4. Fill in **Title**, **Period** and **Details**.
5. Drag the entry to the right place in the list.
6. Click **Save**.

To add a whole new section, click the add button under **Sections**. Give it a **Section title** and an **Icon**, then add entries.

### Add a certificate

Have an image of the certificate ready. The admin won't save without one.

1. Go to **Certificates** and click **New**.
2. Fill in **Certificate name** and **Issued by**.
3. Type a **Category**. Copy the spelling of existing certificates in the same group.
4. Add dates, **Credential ID** and **Verification link** if you have them.
5. Upload the **Certificate image**.
6. Set **Position**. A lower number puts it nearer the top.
7. Make sure **Show on the website** is on.
8. Click **Save**.

### Publish a blog post

Have a cover image and a short summary ready first.

**A post written on your website:**

1. Go to **Blog** and click **New**.
2. Fill in **Title**, **Date**, **Category** and **Short summary**.
3. Upload a **Cover image** and describe it in **Cover image description**.
4. Leave **External link** empty.
5. Write your post in **Post text**. You can use headings, quotes, lists, code and images. Images must be uploaded here, not linked from another website.
6. Click **Save**.

**A post that lives on Medium or elsewhere:**

1. Go to **Blog** and click **New**.
2. Fill in **Title**, **Date**, **Category**, **Short summary** and **Cover image**.
3. Paste the post's address into **External link**. It must start with `https://`.
4. Leave **Post text** empty.
5. Click **Save**.

**Not ready yet?** Switch on **Draft (hide from the website)**. Switch it off when you are ready.

### Hide or show something

| To hide or show… | Use this switch |
|---|---|
| A whole tab (Resume, Certificates, Blog) | **Profile & settings → Menu tabs** |
| Email, phone, location | **Show email**, **Show phone**, **Show location** |
| One social link | **Show this link** |
| One announcement or card | **Show this announcement** / **Show this card** |
| The whole News or "In a nutshell" block | **Show News & Announcements** / **Show "In a nutshell" cards** |
| A resume section or entry | **Show this section** / **Show this entry** |
| A certificate | **Show on the website** |
| A blog post | **Draft (hide from the website)** (on means hidden) |

Then click **Save**.

### Reorder items

Ordering works in three ways:

- **Lists inside Site content** (social links, announcements, "In a nutshell" cards, resume sections and entries): drag the item up or down, then click **Save**.
- **Certificates**: change the **Position** number. Lower numbers come first. Tip: use 10, 20, 30… so you can fit new ones in between later.
- **Blog posts**: always sorted by **Date**, newest first. Change the date to move a post.

### Delete something

Consider hiding instead. It is easier to undo.

1. **An item inside a list** (an announcement, a resume entry, a social link): use the remove option on that item, then click **Save**.
2. **A whole certificate or blog post**: open it and use the delete option in the editor's menu. Confirm.

If you delete something by mistake, ask your developer. It can be restored from history.

## Images: do's and don'ts

**Do:**

- Use **PNG, JPG, WebP or AVIF** files up to **8 MB**. (The **Image for link previews** accepts PNG, JPG or WebP only.)
- Use a square-ish photo for your profile photo.

**Don't:**

- Don't upload original phone photos of documents that show private information, such as your address, ID number or signature. Crop or cover those parts first.

**What the admin does for you:** it converts each upload to WebP and removes hidden photo data, such as the GPS location where the photo was taken.

**If an image is refused:** sometimes the conversion fails in your browser. The original image, with its location data, then gets uploaded. The site refuses to publish it, for your privacy. To fix it, upload the image again. If that doesn't help, take a screenshot of the image and upload the screenshot instead.

## My change didn't appear

Work through this list:

1. **Wait 2 minutes, then refresh** the page. Try a hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac).
2. **Is the item switched on?** Check its show switch, or the **Draft** switch for blog posts.
3. **Check your links.** Every link must start with `https://`. (Email links in **Social links** may start with `mailto:`.)
4. **Check blog posts.** A post needs either an **External link** or some **Post text**.
5. **Check lengths.** The site **Description** has a 300-character limit, and a blog **Short summary** has a 500-character limit.
6. **Re-upload any new image**, or upload a screenshot of it instead (see above).
7. **Still stuck? Contact your developer.** They can see the exact reason in the "Actions" tab of your GitHub storage. That is the page that lists each automatic check.

## Formatting text

The text boxes have simple formatting buttons: **bold**, *italic*, links and lists. Blog post text also allows headings, quotes, code and images. You can't paste raw web code (HTML) into these boxes. That is blocked for security.

## Staying safe

- Only you have access, plus your developer for a limited time.
- Follow the sign-in habits above: keep 2FA on, protect your recovery codes, never share the QR code, and sign out on shared computers.
- **Don't approve GitHub sign-in prompts you didn't expect.**

**If you think your GitHub account was compromised**, contact your developer right away. Then:

1. On GitHub, open **Settings → Applications** and revoke the admin app's access.
2. Change your GitHub password.
3. With your developer, review recent changes to your site.

## Quick reference

| I want to change… | Go to |
|---|---|
| My name, title badge or photo | Site content → Profile & settings |
| Email, phone, location | Site content → Profile & settings |
| Social links | Site content → Profile & settings → Social links |
| Which tabs appear in the menu | Site content → Profile & settings → Menu tabs |
| Browser tab title, search description, link-preview image | Site content → Profile & settings → Search engines & sharing |
| My introduction or Google Scholar line | Site content → About tab |
| News & announcements | Site content → About tab |
| "In a nutshell" cards | Site content → About tab |
| Education, experience and other resume sections | Site content → Resume tab |
| Certificates | Certificates |
| Blog posts | Blog |
