# MyTailor — Software Requirements Specification (SRS)

## 1. Document Purpose

This document defines the functional and non-functional requirements for the **MyTailor Marketplace**.

MyTailor is a two-sided marketplace connecting customers who need custom-made clothing with independent tailors.

The application must support the complete journey:

> **Request → Offers → Selection → Order → Chat → Progress → Completion → Review**

This document is the source of truth for what the application must do.

---

# 2. Product Scope

MyTailor has two main user roles:

- **Customer**
- **Tailor**

A user chooses exactly one role when creating an account.

The system allows customers to create clothing requests and allows tailors to respond with offers.

Once a customer accepts an offer, the request becomes an order and a private relationship is created between the customer and selected tailor.

The system must enforce all important access rules server-side.

---

# 3. User Roles

## 3.1 Customer

Customers are users who want custom clothing.

Customers can:

- Create an account as a customer.
- Create clothing requests.
- Upload reference images.
- Get AI-generated description suggestions.
- Edit AI-generated descriptions.
- View their own requests.
- Receive offers.
- Compare offers.
- Accept one offer.
- View their orders.
- Access chat for their own orders.
- View order progress.
- Leave a review after an order is completed.

Customers cannot:

- Submit offers.
- See another customer's private requests.
- See another tailor's private information unless intentionally exposed by the product.
- Access orders they are not part of.
- Access chats they are not part of.
- Review orders that are not completed.
- Review another customer's order.
- Review the same order more than once.

---

## 3.2 Tailor

Tailors are users who provide custom tailoring services.

Tailors can:

- Create an account as a tailor.
- Browse available customer requests.
- View requests that are available for bidding.
- Submit an offer.
- Revise their own offer while the request is open.
- View their own offer.
- View permitted aggregate information about competition.
- View their accepted orders.
- Access chat for orders they are part of.
- Update the progress of their accepted orders.

Tailors cannot:

- Accept their own offer.
- See another tailor's full offer.
- Edit an offer after its request has closed.
- Access another tailor's orders.
- Access another customer's private order.
- Access another order's chat.
- Create customer reviews.

---

# 4. Authentication & Account Requirements

## 4.1 Registration

A user must be able to create an account.

During registration, the user chooses:

- Customer
- Tailor

A single account must have exactly one role.

The role should not be freely switchable from the normal user interface.

---

## 4.2 Login

Users must be able to:

- Sign in.
- Sign out.
- Maintain a logged-in session.
- Access only the parts of the application allowed for their role.

Unauthenticated users must not access protected marketplace functionality.

---

## 4.3 Role-Based Experience

After login, the application should provide an experience appropriate to the user's role.

Customers should primarily see:

- Their requests
- Offers
- Orders
- Reviews

Tailors should primarily see:

- Available requests
- Their offers
- Orders
- Order progress

---

# 5. Customer Request Requirements

## 5.1 Create Request

A customer must be able to create a request describing the clothing they want.

A request should contain, at minimum:

- Title
- Description
- Optional reference image
- Desired completion date or timeframe
- Request status
- Creation date
- Customer reference

Example:

> **Title:** Custom Black Suit  
> **Description:** I need a slim-fit black suit for a wedding.  
> **Deadline:** October 15

---

## 5.2 Reference Image

A customer may upload a reference image.

The image can be used to help explain the desired clothing style.

The image should belong to the request that uploaded it.

Users must not gain access to private images belonging to unrelated requests.

---

# 6. AI Description Assistance

## 6.1 Purpose

The system should provide optional AI assistance when a customer uploads a reference image.

The AI analyzes the image and generates a suggested description.

Example:

> "A tailored black evening dress with a fitted upper body, long skirt, and minimal detailing."

---

## 6.2 Customer Control

The AI-generated description is only a suggestion.

The customer must be able to:

- View the suggestion.
- Edit the suggestion.
- Accept the suggestion.
- Ignore the suggestion.
- Write their own description.

The AI must never silently replace the customer's final request.

---

## 6.3 AI Security

The AI provider API key must never be exposed to the browser/client bundle.

AI requests must be performed through a secure server-side mechanism.

The client must not contain the secret API key.

---

# 7. Request Lifecycle

A request has a lifecycle.

The core request states are:

```text
OPEN
  ↓
CLOSED
```

A request is open while tailors can submit or revise offers.

Once an offer is accepted, the request closes.

Once closed:

- New offers cannot be submitted.
- Existing offers cannot be revised.
- Existing offers become frozen.
- The request cannot receive another accepted offer.

The request state is the source of truth for whether its offers can be modified.

---

# 8. Bidding / Offer Requirements

## 8.1 Submit Offer

A tailor must be able to submit an offer for an open customer request.

An offer must contain:

- Proposed price
- Expected turnaround time
- Message/note
- Tailor reference
- Request reference
- Current offer state
- Creation/update timestamps

Example:

> **Price:** 80 KD  
> **Turnaround:** 5 days  
> **Message:** I can make this using Italian wool and have it ready within 5 days.

---

## 8.2 One Active Offer Per Tailor Per Request

A tailor should have one current offer for a given request.

The tailor can revise that offer while the request remains open.

Each revision must be recorded.

---

# 9. Offer Revision History

Every time a tailor changes their offer, the previous version must remain recorded.

Example:

```text
Revision 1
80 KD · 7 days

Revision 2
85 KD · 5 days

Revision 3
82 KD · 5 days
```

The system should retain the history for auditability.

The current offer represents the latest version.

The revision history must not allow a user to modify historical records.

---

# 10. Offer States

An offer can have states representing its relationship to the request.

The intended lifecycle is:

```text
PENDING
   ↓
ACCEPTED

PENDING
   ↓
DECLINED
   ↓
PENDING

PENDING
   ↓
CLOSED
```

### Pending

The offer is active and waiting for the customer's decision.

### Declined

The customer has declined the current offer.

The tailor may revise the offer while the request is still open.

### Accepted

The customer selected this offer.

Only one offer can become accepted for a request.

### Closed

The request has closed without this offer being accepted.

---

# 11. Blind Bidding

Blind bidding is a core marketplace requirement.

A tailor must be able to see:

- Their own full offer.
- Their own revision history where appropriate.
- Aggregate information intentionally exposed by the system.

A tailor must **not** be able to see:

- Another tailor's exact price.
- Another tailor's exact turnaround time.
- Another tailor's private message.
- Another tailor's revision history.
- Another tailor's full offer record through unauthorized access.

The UI must not merely hide this information.

The underlying server/database access rules must prevent it.

---

# 12. Accepting an Offer

Only the customer who owns the request can accept an offer.

When a customer accepts an offer:

1. The selected offer becomes accepted.
2. The parent request closes.
3. All other offers become frozen/closed.
4. No additional offers can be submitted.
5. No existing offer can be revised.
6. An order is created.
7. The selected customer and tailor become the participants of that order.
8. Order-specific chat becomes available.

The system must ensure that only one offer can be accepted.

---

# 13. Preventing Invalid Acceptance

The system must prevent:

- A tailor accepting their own offer.
- A customer accepting an offer on another customer's request.
- Two offers being accepted for the same request.
- Accepting an offer after the request has already closed.
- Accepting an offer that does not belong to the request.
- Accepting an offer through a manipulated request or offer ID.

These rules must be enforced server-side.

---

# 14. Order Creation

An accepted offer creates an order.

The order should retain the important information needed to represent the agreed deal, including:

- Customer
- Tailor
- Original request
- Accepted offer
- Agreed price
- Expected turnaround
- Order status
- Creation date
- Completion information where applicable

The order should represent the relationship created by the accepted offer.

---

# 15. Order State Machine

Order status must follow a strict linear progression:

```text
ACCEPTED
    ↓
IN_PROGRESS
    ↓
READY
    ↓
COMPLETED
```

No state may be skipped.

Valid transitions:

```text
ACCEPTED → IN_PROGRESS
IN_PROGRESS → READY
READY → COMPLETED
```

Invalid examples:

```text
ACCEPTED → READY
ACCEPTED → COMPLETED
IN_PROGRESS → COMPLETED
READY → IN_PROGRESS
COMPLETED → IN_PROGRESS
COMPLETED → READY
```

The application must reject invalid transitions.

---

# 16. Order Status Permissions

Only the **tailor** can advance the order status.

The tailor can:

- Move `ACCEPTED` → `IN_PROGRESS`
- Move `IN_PROGRESS` → `READY`
- Move `READY` → `COMPLETED`

The customer can view the status but cannot change it.

A customer must not be able to modify an order status by manipulating a request or order ID.

---

# 17. Order Access

An order belongs to exactly:

- One customer
- One tailor

Only these two participants can access the order's private information.

A different customer must not be able to access it.

A different tailor must not be able to access it.

Changing the order ID in a URL or request must not provide access to another order.

---

# 18. Chat Requirements

## 18.1 Chat Availability

Chat is locked until an offer is accepted and an order exists.

Before acceptance:

- Customer and tailor do not have private order chat.

After acceptance:

- The selected customer and selected tailor can communicate.

---

## 18.2 Chat Scope

Each chat belongs to exactly one order.

A message should be associated with:

- Order
- Sender
- Message content
- Timestamp

Messages from one order must not appear in another order.

---

## 18.3 Chat Permissions

Only the two participants of the order can:

- View messages.
- Send messages.

A user who is not part of the order must not be able to:

- Read messages.
- Send messages.
- Modify messages through unauthorized requests.

Changing an `order_id` must not bypass this restriction.

---

# 19. Review Requirements

Reviews are customer-to-tailor feedback associated with a completed order.

## 19.1 Who Can Review?

Only the customer associated with the order can create the review.

Tailors cannot create customer reviews.

Other customers cannot review the order.

---

## 19.2 When Can a Review Be Created?

A review can only be created when:

```text
Order status = COMPLETED
```

A customer must not be able to review:

- An accepted order.
- An in-progress order.
- A ready order.
- Another customer's order.
- An order they are not part of.

---

## 19.3 One Review Per Order

A customer can review each completed order only once.

The system must prevent duplicate reviews for the same order.

---

# 20. Review Content

A review can contain:

- Rating
- Written feedback
- Order reference
- Customer reference
- Tailor reference
- Creation timestamp

The review should clearly belong to the completed order.

---

# 21. Marketplace Visibility

The application should distinguish between public marketplace information and private information.

### Customers can see:

- Their own requests.
- Offers received for their requests.
- Their orders.
- Their order messages.
- Their reviews.

### Tailors can see:

- Open requests available for offers.
- Their own offers.
- Their own offer history.
- Their accepted orders.
- Their order messages.

Exact private information belonging to other users must remain protected.

---

# 22. Access Control Principles

Access control must follow the principle:

> **A user should only be able to access data they are authorized to access, regardless of how the request is made.**

The application must not depend only on:

- Hidden buttons.
- Disabled inputs.
- Frontend route protection.
- Client-side role checks.
- UI visibility.

If a user manually changes an ID or sends a custom request, the server/database must still reject unauthorized access.

---

# 23. Tampering Test

The Tampering Test is a mandatory acceptance criterion.

The application must be tested against the following attempts.

## Test 1 — Tailor Accepts Own Offer

### Attempt

A tailor attempts to accept their own offer.

### Expected result

The operation fails.

The request remains under customer control.

No order is created.

---

## Test 2 — Tailor Reads Another Tailor's Full Offer

### Attempt

A tailor who is bidding on a request attempts to retrieve another tailor's complete offer.

### Expected result

The operation fails.

The tailor must not receive:

- Exact competitor price.
- Exact competitor turnaround.
- Competitor message.
- Competitor revision history.

---

## Test 3 — Unauthorized Order Chat

### Attempt

A user changes an order ID to an order they are not part of.

Example:

```text
/order/123
```

becomes:

```text
/order/456
```

### Expected result

Access is denied.

The user must not see the order or its messages.

---

## Test 4 — Unauthorized Review

### Attempt

A user tries to:

- Review an incomplete order.
- Review another user's order.
- Review the same completed order twice.

### Expected result

Each unauthorized attempt fails.

Only the correct customer can review their own completed order, and only once.

---

## Test 5 — AI API Key Exposure

### Attempt

Inspect the client-side bundle or browser-accessible code for the AI API key.

### Expected result

The secret key is not present.

AI credentials must remain server-side.

---

# 24. Data Integrity Requirements

The application must maintain consistent relationships between:

- Users
- Requests
- Offers
- Offer revisions
- Orders
- Messages
- Reviews

Examples:

- An offer must belong to an existing request.
- An offer must belong to a valid tailor.
- An order must reference a valid request.
- An order must reference the accepted offer.
- A message must belong to an existing order.
- A review must belong to an existing completed order.
- A review must belong to the customer associated with that order.

---

# 25. Concurrency & Race Conditions

The system should safely handle situations where multiple actions happen nearly simultaneously.

For example:

Two customers cannot accept different offers for the same request.

The system must guarantee that only one offer can become accepted.

Similarly:

- A request cannot accept an offer after it has already closed.
- A closed request cannot receive a new offer.
- A closed request cannot have its existing offers revised.

These rules must hold even if requests are made almost simultaneously.

---

# 26. Notifications

The product should support useful notifications for important events.

Examples:

### Customer receives an offer

> "You received a new offer for your custom suit."

### Offer accepted

> "Your offer was accepted."

### Offer declined

> "Your offer was declined. You can revise it while the request remains open."

### Order status changed

> "Your order is now in progress."

### Order ready

> "Your order is ready."

### Order completed

> "Your order has been completed. You can now leave a review."

Notifications should provide useful information without overwhelming users.

---

# 27. Error Handling

The application should provide clear feedback when an action fails.

Examples:

### Unauthorized action

> "You don't have permission to perform this action."

### Closed request

> "This request is no longer accepting offers."

### Invalid status transition

> "This order cannot move to this status."

### Review unavailable

> "You can review this order after it is completed."

### Chat unavailable

> "Chat is available after an offer is accepted."

Errors should be understandable to normal users.

Technical error details should not be exposed unnecessarily.

---

# 28. Loading & Empty States

The application should handle states where data is unavailable or still loading.

Examples:

### Customer has no requests

> "You haven't created any requests yet."

### Tailor has no available requests

> "No requests are currently available."

### Customer has no offers

> "No offers yet. Tailors will appear here when they respond."

### No messages

> "Start the conversation about your order."

### Loading

Use appropriate loading indicators without making the interface feel frozen.

---

# 29. Responsive Requirements

The application must work across:

- Mobile
- Tablet
- Desktop

Important workflows must remain usable on smaller screens:

- Creating a request.
- Uploading an image.
- Viewing offers.
- Accepting an offer.
- Viewing an order.
- Chatting.
- Updating order status.
- Leaving a review.

---

# 30. Accessibility Requirements

The application should provide:

- Readable text.
- Sufficient color contrast.
- Keyboard-accessible controls.
- Clear form labels.
- Meaningful button labels.
- Appropriate focus states.
- Accessible error messages.
- Alternative text for meaningful images.

Accessibility should be considered throughout the UI rather than added at the end.

---

# 31. Performance Requirements

The application should:

- Avoid unnecessary data fetching.
- Load important pages quickly.
- Optimize uploaded images where appropriate.
- Avoid sending private data to clients that do not need it.
- Keep database queries focused on the required data.

Large datasets should not be loaded unnecessarily into the browser.

---

# 32. Security Requirements

Security is a core requirement of the project.

The application must:

- Protect authenticated routes.
- Enforce user roles.
- Protect private data.
- Prevent unauthorized record access.
- Protect AI API credentials.
- Validate important operations server-side.
- Enforce request and order state rules.
- Prevent unauthorized chat access.
- Prevent unauthorized reviews.
- Prevent unauthorized offer access.
- Prevent users from modifying records they do not own.

Frontend checks are useful for user experience but are not considered sufficient security.

---

# 33. Server-Side Enforcement

The following rules must be enforced outside the UI:

- Who can create a request.
- Who can submit an offer.
- Who can revise an offer.
- Who can see an offer.
- Who can accept an offer.
- Who can create an order.
- Who can access an order.
- Who can access order chat.
- Who can send order messages.
- Who can change order status.
- Who can create a review.
- When a review can be created.

The database/security layer must enforce the appropriate access rules.

---

# 34. Auditability

Important marketplace actions should have enough history to understand what happened.

At minimum, offer revisions should be preserved.

The system should make it possible to understand:

- When an offer was created.
- When it was revised.
- When it was accepted or closed.
- When an order was created.
- When the order changed status.
- When a review was created.

---

# 35. Functional Acceptance Criteria

The application is functionally complete when:

### Authentication

- [ ] Customer can register.
- [ ] Tailor can register.
- [ ] Users can log in and log out.
- [ ] Users only access their permitted role functionality.

### Requests

- [ ] Customer can create a request.
- [ ] Customer can optionally upload a reference image.
- [ ] Customer can receive AI description assistance.
- [ ] Customer can edit the AI suggestion.
- [ ] Customer can view their requests.

### Offers

- [ ] Tailor can browse open requests.
- [ ] Tailor can submit an offer.
- [ ] Tailor can revise an offer.
- [ ] Offer revisions are recorded.
- [ ] Tailor cannot see another tailor's exact offer.
- [ ] Closed requests cannot receive or modify offers.

### Acceptance

- [ ] Customer can accept an offer on their own request.
- [ ] Only one offer can be accepted.
- [ ] Request closes after acceptance.
- [ ] Other offers become frozen.
- [ ] Order is created.

### Orders

- [ ] Order starts as accepted.
- [ ] Tailor can move it to in progress.
- [ ] Tailor can move it to ready.
- [ ] Tailor can move it to completed.
- [ ] Invalid transitions are rejected.
- [ ] Customer can view order progress.

### Chat

- [ ] Chat is unavailable before acceptance.
- [ ] Chat becomes available after an order is created.
- [ ] Only order participants can access the chat.
- [ ] Messages are scoped to the correct order.

### Reviews

- [ ] Customer can review a completed order.
- [ ] Customer cannot review an incomplete order.
- [ ] Customer cannot review another user's order.
- [ ] Customer cannot review the same order twice.

### Security

- [ ] Tampering Test 1 fails.
- [ ] Tampering Test 2 fails.
- [ ] Tampering Test 3 fails.
- [ ] Tampering Test 4 fails.
- [ ] Tampering Test 5 finds no client-side AI API key.

---

# 36. Non-Functional Acceptance Criteria

The application should also satisfy:

- [ ] Responsive design.
- [ ] Clear loading states.
- [ ] Clear error states.
- [ ] Accessible form controls.
- [ ] Secure server-side operations.
- [ ] Protected private data.
- [ ] No exposed API secrets.
- [ ] Consistent visual design.
- [ ] Production deployment works.
- [ ] Core workflows work on both desktop and mobile.

---

# 37. Out of Scope for the Core Version

The following features are not required unless explicitly added as a stretch goal:

- Online payments.
- Delivery tracking.
- Automatic measurements using computer vision.
- Video calls.
- Public social feeds.
- Advanced tailor subscriptions.
- Complex commission/payment systems.
- Multi-tailor orders.
- Customer-to-customer messaging.
- Public bidding between customers.

These should not be added unless they have a clear product purpose.

---

# 38. Stretch Goal Direction

A stretch feature should improve the marketplace without unnecessarily increasing complexity.

Possible examples:

### Favorite Tailors

Customers can save tailors they like for future requests.

### Tailor Profiles

Tailors can showcase:

- Specialties
- Portfolio images
- Experience
- Completed work
- Customer reviews

### Request Matching

The marketplace can suggest relevant requests to tailors based on their specialties.

### Order Activity Timeline

Show a simple timeline:

```text
Offer accepted
      ↓
Work started
      ↓
Order ready
      ↓
Completed
```

Any stretch feature should preserve the core security and access-control rules.

---

# 39. Core Product Principle

The application should always preserve this fundamental workflow:

```text
CUSTOMER
   ↓
Creates Request
   ↓
TAILORS
   ↓
Submit Offers
   ↓
CUSTOMER
   ↓
Chooses One
   ↓
ORDER
   ↓
PRIVATE CHAT
   ↓
TAILOR
   ↓
Progresses Work
   ↓
COMPLETED
   ↓
CUSTOMER
   ↓
REVIEW
```

Any new feature should support this workflow rather than distract from it.

---

# 40. Final Requirement

MyTailor should not only look functional.

It must be **securely functional**.

A user should not be able to bypass marketplace rules simply by:

- Changing an ID.
- Calling an endpoint directly.
- Manipulating request data.
- Changing a role value from the client.
- Accessing another user's records.
- Skipping an order state.
- Sending unauthorized messages.
- Creating an unauthorized review.

The application should behave correctly even when a user intentionally tries to break the rules.

> **The UI controls what users normally do. The server and database enforce what users are actually allowed to do.**
