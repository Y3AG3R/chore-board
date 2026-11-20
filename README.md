# Family Chore Board

A chore board for Tracy, Billy and Vivian. On screen it's called **Family Jobs**, and chores are called jobs. It runs in Safari on iPhone and on Apple HomeView, and syncs through a Google Sheet.

- **Website:** https://y3ag3r.github.io/chore-board/
- **Website code:** `docs/` (served by GitHub Pages)
- **Google Sheet script:** `apps-script/Code.gs`

## One-time setup (about 10 minutes)

### 1. Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) and name the sheet **Chore Board**.
2. Open **Extensions → Apps Script**.
3. Delete the sample code, paste in everything from `apps-script/Code.gs`, and click **Save**.

### 2. Publish the script as a web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
4. Click **Deploy**, then click **Authorize access** and allow it with your Google account.
   Google shows an "unverified app" warning because the script is yours. Click **Advanced**, then the **Go to …** link with your project's name.
5. Copy the **Web app URL**. It ends in `/exec`.

### 3. Connect the board

1. Open https://y3ag3r.github.io/chore-board/ in Safari and tap **Setup**.
2. Paste the Web app URL and tap **Connect**. The first connection fills the sheet's **Chores** tab with the starter plan of 69 chores.
3. Tap **Copy setup link for another device** and send that link to the other phones and the HomeView in Messages. Opening it connects that device in one step.

### 4. On each device

- **iPhone:** In Safari, tap Share → **Add to Home Screen**. Open it from the new Chores icon, then tap your own initial at the top.
- **HomeView:** Open the setup link in Safari and leave **Everyone** selected. When someone checks off a chore, the board asks who did it.

## Changing chores

Edit the **Chores** tab in the Google Sheet. Each row is one chore:

| Room | Chore | Frequency | Points | Owner | ID | Days |
|---|---|---|---|---|---|---|
| Kitchen | Unload the dishwasher | Daily | 10 | Tracy | kitchen-unload | |
| Kitchen | Take trash & recycling bins to the curb | Weekly | 10 | Billy | kitchen-trash | Mon, Tue |

- **Frequency** is Daily, Weekly or Monthly. **Owner** is Tracy, Billy or Vivian.
- **Days** is optional. Fill it in (for example `Mon, Tue`) for a chore that can only be done on certain days. It only shows on the board on those days.
- Leave **ID** blank on a new row. The script fills it in.
- Don't change an existing ID. Past check-offs are linked to it.
- Devices pick up changes within about 20 seconds.

Every check-off is a row on the **Completions** tab, so the sheet is also a full history.

## History and bonus points

- The **History** tab shows each person's daily-chore rate for the last 7 days, the chores being skipped (with when each was last done), and a day-by-day log of the last 14 days.
- Each day the board picks one **bonus chore** for each person, from their own chores that were skipped or haven't been done yet this week or month. If someone has nothing eligible, their slot goes to another chore. A bonus chore is worth 25% more, or 50% more if it was skipped two or more times in a row. The picks rotate daily, and every device shows the same ones.
- Bonuses are recorded in the **Bonus** column of the Completions tab.
- If a weekly or monthly job got done on an earlier day without being checked off, tap **Done earlier?** under it, pick the day and who did it. It counts for that day's week or month (no bonus), so the skip count and "last done" date stay right.
- **Taking turns:** an Owner with two names, like `Tracy/Billy`, makes the job switch between them: daily jobs every day, weekly jobs every Monday, monthly jobs on the 1st. The first name has the turn in the week of Nov 16, 2026, which is the anchor. The board shows "Tracy's turn". Today cards, streaks, bonus picks and the 7-day rate all follow whose turn it is.
- A Days column that limits a daily job to some days (like homework on weekdays) also leaves those days out of streaks and the 7-day rate.
- A new chore added to the sheet counts as skipped from the board's first day until someone does it once.

## Privacy

- The website code is public on GitHub. Your check-offs are not: they live only in your Google Sheet.
- The Web app URL is the only key to the sheet. Anyone who has it can check off chores, so share it only with family.
- If the link ever leaks, make a new deployment in Apps Script and send the new setup link.

## If you change `Code.gs` later

In Apps Script, go to **Deploy → Manage deployments**, edit the existing deployment, and choose **New version**. This keeps the same URL, so the devices stay connected.
