# Fixtures

This directory holds **official examples only**, separated where the docs separate them.

| File | Source | Edits |
| --- | --- | --- |
| `uber/webhook-orders-notification.json` | Uber webhook reference | Removed the `...` placeholder (not valid JSON) |
| `uber/get-order-response.json` | Uber Get Order reference | Removed trailing commas and stray syntax so it parses; content otherwise untouched, quirks included |
| `doordash/sample-order.json` | DoorDash Sample order | Added the missing comma after `"tax": 300`; replaced the obfuscated email with a placeholder address |
| `doordash/webhook-order-create.json` | DoorDash "Receive orders" envelope + sample order | Composed per the **documented** envelope |
