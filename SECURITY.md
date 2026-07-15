# Security Policy

## Supported Versions

Security fixes are applied to the latest released version of each distribution
and to `main`. Older releases may not receive backports unless maintainers state
otherwise in a security advisory.

| Distribution | Supported line |
| --- | --- |
| Vanilla JavaScript | Latest `main` revision |
| `@codefortify/olloweditor` | Latest npm release |
| `olloweditor` | Latest PyPI release |

## Reporting a Vulnerability

Do not disclose an unpatched vulnerability in a public issue, discussion, pull
request, or social media post.

Use GitHub's private vulnerability reporting for this repository when the
"Report a vulnerability" action is available on the Security tab. If private
reporting is unavailable, contact a repository maintainer through an existing
non-public CodeFortify channel and ask for a private security-reporting route.
The project does not currently publish a verified security email address.

Include:

- the affected implementation, package version, and commit when known;
- impact and realistic attack scenario;
- complete reproduction steps or a minimal proof of concept;
- required configuration, runtime, framework, browser, and operating system;
- suggested mitigations or fixes, if available;
- whether the issue has been disclosed to anyone else.

Maintainers will acknowledge the report, assess severity and affected versions,
coordinate remediation, and discuss a disclosure timeline with the reporter.
Do not test against systems or data you do not own or have permission to use.
