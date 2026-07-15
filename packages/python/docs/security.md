# Security

OllowEditor produces HTML. That HTML may be unsafe when it comes from untrusted users.

Key points:

- client-side editor filtering is not a complete security boundary
- the package does not ship a default server-side sanitizer
- rendering stored HTML as safe must be an explicit application decision
- uploads require separate validation for file type, size, and storage rules
- allowed tags, attributes, and URL schemes should be controlled by the application

Typical production flow:

1. accept HTML from the editor
2. sanitize it with a real server-side HTML sanitizer
3. store only the form your application trusts
4. render it under an explicit trust policy
