---
title: "Passkey login for KONA's identity provider"
summary: "An OAuth2 and OpenID Connect server on Spring Authorization Server, with passkey (WebAuthn) login and Okta federation. I co-built the server and wrote its React passkey client."
meta: "KONA · Identity · 2025"
org: "KONA Software Lab"
years: "2025"
role: "Co-built the server with a teammate, who wrote its first passkey endpoints. I wrote the React passkey client."
group: kona
order: 2
page: true
stack: [Java, Spring Boot, Spring Authorization Server, Spring Security, OAuth2, OpenID Connect, WebAuthn, Okta, React]
links: []
published: 2026-10-09
---

## What it is

KONA Identity Provider is a sign-in server. Applications send their users to it to log in, and get back standard tokens they can check for themselves. It is built on Spring Authorization Server and speaks OAuth2 and OpenID Connect. OAuth2 covers what an application may do on a user's behalf, and OpenID Connect adds who the user is, so one login can serve many applications.

It offers two ways to sign in. The first is a passkey, using WebAuthn. A passkey replaces the password with a pair of keys: the private key stays on the person's device, behind its fingerprint, face or screen lock, and the server keeps only the public key. Signing in means the device proves it holds the private key, so there is no password to steal, guess or reuse.

The second is Okta federation. The identity provider can hand the login over to Okta and accept the result, so an Okta account works as well.

## What I built

I co-built the server with a teammate, who wrote its first passkey endpoints.

I wrote the React passkey client. It is the web app people use to register a passkey, sign in with it or through Okta, and see their profile once they are in. On the browser side, it asks the browser to create or use a passkey and passes the result to the server, which checks it.
