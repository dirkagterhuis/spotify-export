# Moving the domains from Squarespace to Cloudflare

For `dirkagterhuis.com` and `spotifyexport.com`. Both are hosted on GitHub Pages, and Squarespace runs out on 2027-01-10.

Do one domain at a time. Start with `dirkagterhuis.com`: if something goes wrong there, it matters less. Do `spotifyexport.com` once that one works.

The order matters. **First move the DNS to Cloudflare (part 2), then move the registration (part 3).** That way the site keeps working the whole time.

## 1. Prepare in Squarespace (per domain)

1. Squarespace → Domains → the domain. Check that it isn't locked by the 60-day rule (it says so if it is). **Don't change the owner/contact details now**: that starts a new 60-day lock.
2. Under DNS, write down or screenshot **every** record. GitHub Pages needs these:

    | Type  | Name  | Value                                    |
    | ----- | ----- | ---------------------------------------- |
    | A     | `@`   | `185.199.108.153`                        |
    | A     | `@`   | `185.199.109.153`                        |
    | A     | `@`   | `185.199.110.153`                        |
    | A     | `@`   | `185.199.111.153`                        |
    | AAAA  | `@`   | `2606:50c0:8000::153` (if you have these) |
    | AAAA  | `@`   | `2606:50c0:8001::153`                    |
    | AAAA  | `@`   | `2606:50c0:8002::153`                    |
    | AAAA  | `@`   | `2606:50c0:8003::153`                    |
    | CNAME | `www` | `dirkagterhuis.github.io`                |

    Also note any TXT records (for example `_github-pages-challenge-dirkagterhuis`, or Google site verification) and any MX records (email).

3. Turn off **DNSSEC** if it's on (DNS settings → DNSSEC). If it stays on while the nameservers change, the domain stops resolving. You turn it back on in Cloudflare at the end.

## 2. Move the DNS to Cloudflare

1. Create a Cloudflare account at dash.cloudflare.com (you do this yourself).
2. **Add a domain** → enter the domain → pick the **Free** plan. Cloudflare scans the existing records and copies them over.
3. Compare the imported records with your list from step 1.2:
    - Add anything that's missing. Delete Squarespace leftovers (records that point to `squarespace.com` or `domainconnect`) that GitHub Pages doesn't use.
    - Set the A, AAAA and `www` CNAME records to **DNS only (grey cloud)**, not Proxied. That way GitHub keeps issuing and renewing the HTTPS certificate itself, and you avoid redirect loops.
4. Cloudflare shows two nameservers (something like `xxx.ns.cloudflare.com`). In Squarespace → the domain → DNS → **Nameservers** → pick custom nameservers and fill in those two.
    Cloudflare also recommends "Only allow Cloudflare IP addresses at your origin". Skip that: the origin is GitHub Pages, which you can't put a firewall on, and the records are DNS only, so visitors don't go through Cloudflare at all.

5. Wait until Cloudflare marks the domain **Active** and sends an email. This usually takes minutes, sometimes up to 24 hours. You can check in a terminal:

    ```bash
    nslookup -type=NS spotifyexport.com
    ```

6. Check that the site still loads over `https://`, with and without `www`.

## 3. Move the registration to Cloudflare

1. In Squarespace → the domain: **unlock** the domain (turn off the transfer lock) and get the **auth/transfer code** (it may be emailed to you).
2. In Cloudflare → **Domain Registration → Transfer Domains**. Pick the domain, enter the auth code, check the contact details and pay (about $10.50, which adds one year: the domain then runs until 2028-01-10).
3. Squarespace may send an email asking you to approve the transfer. Approve it, which makes the transfer go through faster. Otherwise it goes through by itself within about 5 days.
4. Wait for Cloudflare's "transfer complete" email.

## 4. After the transfer

1. Cloudflare → the domain → DNS → **DNSSEC → Enable**. Now that Cloudflare is the registrar, it sets the DS record itself.
2. Cloudflare → Domain Registration → Manage: check that **auto-renew** is on.
3. Squarespace: check that the domain is gone and that there's no renewal charge coming on 2027-01-10. Remove a saved payment method or subscription only if nothing else uses it.
4. GitHub → repo → Settings → Pages: the custom domain still shows as valid and **Enforce HTTPS** is ticked.
5. Optional but recommended: GitHub → your account Settings → Pages → **Add a verified domain** for both domains. You add the TXT record GitHub gives you in Cloudflare (DNS only). This stops anyone else from claiming the domain on GitHub Pages.
6. For `spotifyexport.com`: do one real login + export. The Spotify redirect URIs don't change.

## Optional: email forwarding

Cloudflare → the domain → **Email → Email Routing**. You can forward for example `contact@dirkagterhuis.com` to your Gmail for free. Cloudflare adds the MX/TXT records itself.
