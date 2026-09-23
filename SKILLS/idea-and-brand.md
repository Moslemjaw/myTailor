# MyTailor — Idea & Brand

## 1. Project Overview

**MyTailor** is a marketplace that connects customers who need custom-made clothing with independent tailors.

The customer describes what they want, optionally provides a reference image, and receives offers from different tailors. Each tailor can propose their own price, completion time, and message.

The customer chooses one tailor. Once the offer is accepted, the request becomes an order, communication between the customer and tailor opens, and the order moves through its production stages until it is completed.

After the order is completed, the customer can leave a review.

### Core idea

> **Customers post what they need. Tailors make offers. Customers choose. Then both sides work together until the clothing is completed.**

MyTailor should feel like a modern marketplace specifically designed around the process of getting custom clothing made.

---

# 2. The Problem

Getting custom clothing made can be inconvenient.

A customer may need to:

- Find different tailors.
- Contact each tailor individually.
- Explain the same request multiple times.
- Ask for prices.
- Ask how long the work will take.
- Compare different options manually.
- Keep track of conversations through different messaging apps.

Tailors also have difficulty finding new customers and presenting their services to people who are actively looking for custom clothing.

MyTailor brings this process into one place.

---

# 3. The Solution

MyTailor creates one marketplace where:

### Customers can:

- Describe what they want.
- Upload a reference image.
- Receive offers from multiple tailors.
- Compare the available offers.
- Choose a tailor.
- Communicate with the selected tailor.
- Track the progress of the order.
- Review the tailor after completion.

### Tailors can:

- Discover customer requests.
- Submit offers.
- Set their proposed price.
- Set their expected turnaround time.
- Explain their offer.
- Revise their offer while the request is open.
- Communicate with customers after being selected.
- Manage their orders.
- Update the progress of their work.

---

# 4. Target Users

## Customers

People who want custom-made clothing.

Examples:

- Someone looking for a custom suit.
- Someone ordering a traditional outfit.
- Someone preparing clothes for a wedding.
- Someone who has a specific design in mind.
- Someone who wants to compare several tailors before deciding.

## Tailors

Independent tailors or small tailoring businesses looking for customers.

Examples:

- Individual professional tailors.
- Boutique tailors.
- Traditional clothing specialists.
- Suit specialists.
- Designers who offer custom-made clothing.

---

# 5. Simple User Journey

The main customer journey should be:

```text
Create Account
      ↓
Create Request
      ↓
Add Description / Reference Image
      ↓
Receive Tailor Offers
      ↓
Compare Offers
      ↓
Choose a Tailor
      ↓
Order Created
      ↓
Chat Opens
      ↓
Tailor Works on Order
      ↓
Order Completed
      ↓
Customer Leaves Review
```

The main tailor journey should be:

```text
Create Account
      ↓
Browse Customer Requests
      ↓
Choose a Request
      ↓
Submit an Offer
      ↓
Wait for Customer
      ↓
Customer Accepts Offer
      ↓
Order Created
      ↓
Chat Opens
      ↓
Work on Clothing
      ↓
Mark Progress
      ↓
Order Completed
```

---

# 6. Core Product Concept

MyTailor is based around three important ideas:

## 6.1 Requests

Customers don't directly choose a tailor first.

Instead, they describe what they need and allow suitable tailors to respond.

Example:

> "I need a black three-piece suit for a wedding. I want a slim fit and I need it within two weeks."

The customer can optionally upload a reference image.

---

## 6.2 Offers

Tailors respond to requests by making an offer.

An offer contains:

- Price
- Expected completion time
- Short message from the tailor

Example:

> **80 KD · 5 days**  
> "I can make this using Italian wool and have it ready within 5 days."

The customer can then compare the available offers.

### Blind competition

Tailors should not see the exact offers submitted by other tailors.

They should only know information that the marketplace intentionally provides, such as an overall/aggregate indication of competition.

This keeps the competition fair and prevents tailors from simply copying another tailor's price.

---

## 6.3 Orders

Once the customer accepts an offer, the request becomes an order.

The selected customer and tailor are then connected specifically for that order.

The order becomes the central place for:

- Communication
- Progress
- Completion
- Review

---

# 7. Reference Images

Customers should be able to upload a picture showing the clothing style they want.

For example:

```text
Customer uploads:
[Photo of a suit]

Customer description:
"I want something similar but in dark navy."
```

The platform can use AI to help turn the image into a suggested description.

The AI suggestion is **only a starting point**.

The customer should be able to read it, edit it, and decide what they actually want before submitting the request.

The customer remains in control of the final request.

---

# 8. Order Experience

After an offer is accepted, the experience changes from a marketplace interaction into a private customer-tailor relationship.

The order should clearly communicate its current stage.

The order stages are:

```text
Accepted
   ↓
In Progress
   ↓
Ready
   ↓
Completed
```

The customer should always understand:

- Who is making their clothing.
- What they requested.
- The agreed price.
- The expected completion time.
- The current order stage.

The tailor should always understand:

- Which customer they are working with.
- What the customer requested.
- The agreed offer.
- What stage the order is currently in.

---

# 9. Chat Experience

Chat is intentionally part of the order rather than a general social messaging system.

Customers and tailors should only communicate through the order they have agreed to work on.

Example:

```text
Customer
    ↕
Order #1024
    ↕
Tailor
```

The chat can be used for things such as:

- Measurements
- Fabric discussions
- Design clarification
- Minor adjustments
- Delivery questions
- General communication about that specific order

Chat should not become a general messaging system between unrelated users.

---

# 10. Reviews

Reviews are part of the completed order experience.

A customer can review a tailor **after the order has been completed**.

The review should represent the customer's experience with that specific order.

Example:

> ⭐⭐⭐⭐⭐  
> "Great communication and the suit was ready on time."

A customer should not be able to review an unfinished order.

---

# 11. Brand Personality

MyTailor should feel:

- Modern
- Premium
- Trustworthy
- Simple
- Professional
- Personal
- Fashion-focused

It should **not** feel like:

- A generic e-commerce store.
- A complicated enterprise dashboard.
- A cheap classified-ads website.
- A social media platform.
- A generic freelancer marketplace.

The product should feel like a **premium digital tailoring marketplace**.

---

# 12. Brand Direction

The visual identity should combine:

**Modern technology + traditional tailoring**

The interface should feel refined without being overly decorative.

Think of:

- Premium fashion brands
- Modern tailoring studios
- Clean editorial layouts
- High-quality clothing photography
- Elegant typography
- Generous spacing
- Subtle interactions

The design should communicate quality before the user reads the text.

---

# 13. UI/UX Principles

## Simplicity First

Users should immediately understand:

1. What MyTailor does.
2. What they can do next.
3. What is currently happening.

Avoid unnecessary complexity.

---

## Clear Actions

Important actions should be obvious.

Examples:

- **Create Request**
- **Submit Offer**
- **View Offers**
- **Accept Offer**
- **Open Order**
- **Send Message**
- **Update Status**
- **Leave Review**

Avoid confusing terminology where a simple phrase works better.

---

## Strong Visual Hierarchy

Important information should stand out.

For example, an offer should make these immediately visible:

```text
80 KD
5 days
Tailor message
[View / Choose]
```

The user should not need to read a large amount of text to understand an offer.

---

## Mobile-Friendly

Customers may use MyTailor primarily from their phones.

The experience must work well on:

- Mobile
- Tablet
- Desktop

The interface should not simply shrink the desktop design onto a phone.

The layout should adapt naturally.

---

# 14. Visual Direction

Use a refined fashion-oriented visual language.

### Recommended characteristics

- Clean layouts
- Neutral backgrounds
- Strong typography
- High-quality imagery
- Soft borders
- Subtle shadows
- Rounded but not overly playful components
- Generous whitespace
- Minimal visual noise
- Elegant animations

Avoid excessive:

- Gradients
- Bright colors
- Emojis
- Glassmorphism everywhere
- Large decorative elements
- Unnecessary animations

The product should look like a serious commercial product.

---

# 15. Suggested Color Direction

The exact palette can be refined during implementation, but the brand should generally use:

### Primary

A deep, sophisticated neutral such as:

- Charcoal
- Near-black
- Deep brown

### Supporting

Warm fashion-oriented neutrals such as:

- Cream
- Ivory
- Beige
- Warm gray

### Accent

Use one restrained accent color for important actions or brand recognition.

The final palette should maintain strong accessibility and readable contrast.

---

# 16. Typography

Typography should feel modern and premium.

Use a clean sans-serif for the main interface.

Typography should establish a clear hierarchy:

```text
Large heading
     ↓
Section heading
     ↓
Body text
     ↓
Supporting information
```

Do not use many different fonts.

The design should feel consistent throughout the entire application.

---

# 17. Photography & Images

Photography is important because MyTailor is a fashion product.

Images should feel:

- High quality
- Natural
- Editorial
- Fashion-oriented
- Professional

Avoid generic corporate stock photography where possible.

Product and clothing images should have enough visual quality to make the marketplace feel trustworthy.

---

# 18. Customer Dashboard Concept

The customer dashboard should answer:

> **"What is happening with my requests and orders?"**

Important sections can include:

- Active Requests
- Received Offers
- Active Orders
- Completed Orders
- Recent Activity

The customer should quickly see what needs their attention.

---

# 19. Tailor Dashboard Concept

The tailor dashboard should answer:

> **"What opportunities and orders do I currently have?"**

Important sections can include:

- Available Requests
- My Offers
- Active Orders
- Completed Orders
- Recent Activity

The tailor should be able to move quickly from discovering a request to submitting an offer.

---

# 20. Important Product Rules

These rules define the intended user experience:

### Customer

A customer can:

- Create requests.
- Receive offers.
- Review their own requests.
- Accept an offer.
- Communicate with the selected tailor.
- Track their orders.
- Review a completed order.

### Tailor

A tailor can:

- Browse relevant requests.
- Submit offers.
- Revise offers while the request is still open.
- Work on accepted orders.
- Update order progress.
- Communicate with the matched customer.

### Marketplace

- A request can receive multiple offers.
- Only one offer can be accepted.
- Accepting an offer closes the request.
- Other offers can no longer be changed after the request closes.
- Chat only becomes available after an offer is accepted.
- Chat belongs to a specific order.
- Orders follow a fixed progression.
- Reviews happen only after completion.

These are product rules and should remain consistent throughout the application.

---

# 21. What MyTailor Is NOT

MyTailor is not:

- A normal online clothing store.
- A platform where customers buy pre-made clothes.
- A general freelancer marketplace.
- A social network for tailors.
- A public messaging platform.
- A platform where customers negotiate publicly with multiple tailors.
- A platform where tailors can see and copy competitors' exact offers.

The core experience is:

> **Request → Offers → Selection → Order → Communication → Completion → Review**

---

# 22. Example Scenario

### Sara needs a dress

Sara has an upcoming wedding and wants a custom-made dress.

She opens MyTailor and creates a request:

> "I want a long black evening dress with a simple design. I need it before October 15."

She uploads a reference picture.

MyTailor helps generate a suggested description from the image.

Sara edits the description and submits the request.

Several tailors respond:

```text
Tailor A
75 KD · 7 days

Tailor B
90 KD · 5 days

Tailor C
80 KD · 6 days
```

Sara chooses Tailor B.

The request becomes an order.

Sara and Tailor B can now communicate through the order chat.

Tailor B starts working.

The order moves through:

```text
Accepted
   ↓
In Progress
   ↓
Ready
   ↓
Completed
```

After Sara receives the dress, she leaves a review.

This represents the complete MyTailor experience.

---

# 23. Product Goal

The goal of MyTailor is to make custom tailoring feel as simple as ordering a service online.

The customer should not have to think about the complexity behind the platform.

From the customer's perspective:

> **"I know what I want → I describe it → tailors send me offers → I choose one → we work together → I get my clothes."**

From the tailor's perspective:

> **"I find a customer who needs my skills → I make an offer → I get selected → I complete the order → I build my reputation."**

Every design and product decision should support this simple experience.
