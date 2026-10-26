# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- People curious about Jelly, the studio's current product, who want to know who makes it and try it.
- People who arrive from a link to one of the writings or projects (most often the Printer posts and wiki, Little Printer publications, or the Joto essay) and want to read it, then see what else the studio has made.
- Peers in the design/technology/"internet of things" world who know the work and want a record of it.
- Occasionally, someone who wants to get in touch about working together. They should find a quiet, obvious route, but they are not the primary audience.

## Product Purpose

exciting.io is the home of Exciting, a small London product development and prototyping studio working somewhere between software and physical electronics. Its flagship is **Jelly**, a simpler shared inbox for small teams (letsjelly.com), built at Good Enough and now run by Exciting. Jelly leads; behind it the site is a durable record of the earlier work (Printer, HeyLi.st, Harmonia, the Little Printer publications) and the writing, with a low-key invitation to get in touch.

Success: a visitor sees Jelly first and can reach it in one click, understands within seconds that this is a studio that makes small, curious, well-finished things, can browse the projects and posts comfortably, and knows how to make contact.

## Positioning

The studio's interest is the potential of simple systems: simple behaviours, actions, components and systems harnessed to make novel, interesting and fun products. The work is hands-on and spans both code and hardware (receipt printers, Arduino shields, web services), with a documented habit of finishing and polishing things rather than leaving hacks.

## Content and Evidence

- Flagship: Jelly, a shared inbox for team addresses like support@your-team.com: assign conversations, internal notes out of sight of customers, follow along without being cc’d, one flat price with no per-seat fees. Built at Good Enough, now lives at Exciting; current work is per-customer data isolation and a native app. Its mascot logo is a hand-drawn cartoon strawberry (`/images/jelly/logo.png`); real app screenshots from letsjelly.com are in `/images/jelly/`. Copy lives in `site/content.json`.
- Project order, everywhere: Jelly, Harmonia, Printer, HeyLi.st.
- Other projects (never "earlier" or "past"): Harmonia (task management for self-organising teams; still running at harmonia.io); Printer (open source kit for small internet-connected printers; source on GitHub at exciting-io/printer), which later powered Good Enough’s printing guestbook (guestbook.goodenough.us; that printer is now offline). The Printer page’s old “send us a message or draw us a picture” line stays, struck through, with a note that those services no longer run; HeyLi.st (tracking the pulse of conferences via Lanyrd and Twitter lists), which is retired and must be marked as such. "Codename: Magritte" was announced as "coming soon" and is stale.
- Writing: nine posts (do not draw attention to the 2012–2017 span or the gap since), including "Hello, Printer", "Printer questions", "Introducing HeyLi.st", the Crimer Show and Little Advent Calendar printer publications, "Making things — it's all about the polish", "A little printer mystery", and the 2017 Joto essay.
- Real photography exists for Printer, Timmy Printface, the printer kit, Crimer Show and the mystery printouts.
- Contact: hello@exciting.io. Social handles (@exciting_io, @gfrprinter) and the Mailchimp list are probably legacy (inferred, not confirmed by the user); treat them as optional.
- Do not present Codename: Magritte as upcoming, and do not carry the stale "© 2020" footer.

## Brand Commitments

- The logo is the black block tilted −4° with the word EXCITING set level inside it in Brandon Grotesque capitals, as on exciting.io/logos.
- Voice: first-person, candid, curious, a little self-deprecating ("I don't really know why"), British spelling.

## Constraints

- A static site built by a dependency-free Node generator (`site/build.mjs`) into `_site/`, deployed with `rake deploy`.
- Do not invent clients, testimonials, metrics or services the studio has not claimed.
