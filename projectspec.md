Final Project
Computer Science 144 – Prof. Rosario
First Deadline Wednesday, Jun 10, 2026
Final Deadline Friday,  Jun 12, 2026 11:59 PM on Github/Gradescope
Background
The final project gives you a final opportunity to show what you have learned in CS 144 and also showcase additional knowledge you have gained.

We recommend working in groups of 4 or 5; however students can work in pairs or as individuals. Know that working in pairs or solo does not provide an advantage.  If you are currently working alone or in a pair and wish to work with a larger group, please use Piazza (or some other mechanism) to find a group.
General Problem
For this final project, you will develop a full-stack web application according to a set of criteria that we explain in this document. You will not only implement the web app, but you will also deploy the web app and use standard software engineering practices to do so.

Some examples of web apps that could meet this requirement:

an app that displays dining hall hours, menus, and nutritional information etc.
a room signup application
an airline check-in and seat selection app
a mountain bike model recommendation engine
a advanced chat service
an advanced blog service
a small video game
many others…

Some examples of implementations that would not meet this requirement:

a simple app that helps students build a B+ tree (ha) [unless all of the features below can be met]
an "about me" app
a website (which is distinct from a web app)

You should pick a project idea where each requirement makes sense but understand that no project will be perfect and we acknowledge that students may have to "shoehorn" certain features into their apps.
Getting Started
First, if you intend to work with others, please form a group and fill out this form by Wednesday May 27 11:59pm.. You will all be added to the class Github organization. We may ask you to do this again in another tool I am testing. This will help your TAs and I to provide assistance. Once the course concludes, you are free to move your work to a public Github repository, but note that repos in the organization will eventually be deleted.

We will create your repo for you based on what you provided on the form. 

You may use your GCE instances to do this work, and we suggest using them to deploy your apps until you are ready to move to the final deployment. Please stop your instance when you are not using them.

Prof. Rosario's Philosophy on this Project

The final project is your chance to explore and learn new things above what we have done in lecture. We will allow students/teams to deviate from what was covered in class (and some of the requirements) within reason. The mini-projects were designed to enforce a particular stack to meet the course requirements. The final project is yours. As long as your technology stack meets the course outcomes, and you double-check with us, we may allow it. Similar to my final exams, the idea behind the final requirement is to test not only what you learned, but how well you can apply it.
AI Policy
You may use AI to help you write the code; however, you must Vibe and Verify. You will need to defend your implementation in the final writeup and your code should abide by typical engineering hygiene: smooth directory structure, modularization and code formatting/linting. Your team is responsible for understanding and fixing all AI generated code bugs.

Great! This Will be Much Easier!
Not so fast. Using AI effectively is an art, and can reduce the time spent on the more mundane aspects of app development such as creating the structure, style and some or much of the interactivity. But, if you're not careful, simple tasks will take much longer and unexpected bugs and tech debt will creep into your code. It is especially challenging using AI across an entire group due to the complex nature of maintaining state of AI tools and conversations. 

Using AI effectively is part of the rubric and we ask you to itemize where AI was used. 
Technical Requirements
Look and Feel

Must use semantic HTML5 elements where appropriate (e.g., <header>, <nav>, <article>), and avoid overuse of generic tags like <div> and <span> unless justified and must use at least two of the following APIs meaningfully:
HTML5 Canvas API (2D) 
Geolocation
Drag and Drop
Use of camera and microphone
WebGL (3D)
Three.js
Must be responsive at 320px (mobile), 768px (tablet), and 1024px (desktop). Layouts must not break, overflow, or obscure content at any of these breakpoints.
You should use a production CSS framework or preprocessor (e.g., Tailwind, Sass) applied consistently throughout the entire application — do not mix approaches. Vanilla CSS is acceptable if used consistently. You may use AI tools to generate your CSS, but your team is responsible for understanding, owning, and maintaining it.
The app MUST  be a Single Page Application (SPA) — navigation must not trigger full page reloads. Individual views/components may scroll internally where necessary.
It is more important that your app satisfies the requirements than look "beautiful" as this is not art class, but you should do your best to make it look nice.
Must use one of the following front-end frameworks: React, Angular, Vue.js, Svelte. If you wish to use something not on this list, include your justification in the project writeup and get instructor pre-approval.
Must use one of the following backend frameworks: Node.js/Express, Fastify, Hono, Next.js, or Remix. If you wish to use something not on this list, include your justification in the project writeup and get instructor pre-approval.
Must comply with basic accessibility principles including color contrast, tab navigation, and semantic HTML. ARIA attributes should be used where applicable. These represent the minimum bar for full credit on this requirement. If you wish to swap out one of these for an alternative accessibility feature, document it in your project writeup. 

Note that accessibility requirements may look different depending on your app. For example, in a video game, having a character speak dialogue while displaying the same text on screen satisfies the alt text requirement — similar to how League of Legends displays "Double Kill! Triple Kill!" on screen while the announcer speaks the same words. A non-game example: a loading spinner that also announces "Loading…" to screen readers. Use good judgment and document your approach.

Progressive Web App (PWA)

The app must be a Progressive Web App (PWA)
The app must be available for use when there is no Internet connection
The app must be installable on desktop and mobile
The app may not display any data, but the general layout should be available with perhaps a progress indicator showing the user "we are trying to fetch the data." (PWA)
The app must support server-initiated notifications delivered via one of: 
Web Push API, 
WebSockets, or 
Server-Sent Events (SSE).
 The notification must be visibly triggered from the backend and demonstrated in the recorded demo.
Must use HTTPS. You may use your own domain name you already have, or we can provide one to you. Do not purchase one.

Authentication and Security
Must authenticate users using one of: 
JWT (cookie or header-based), 
SSO, or
Two-factor authentication (2FA). 
Note: If implementing your own authentication, you must hash passwords using bcrypt or Argon2. Alternatively, you may delegate authentication entirely to Firebase Authentication or GCP Cloud Identity Platform, which satisfies the hashing requirement by proxy. 
Must demonstrate mitigations against common web security vulnerabilities including XSS, CSRF, and injection attacks. You must not hardcode secrets or API keys in your repository. You are encouraged to use libraries that handle this (e.g., Helmet.js, parameterized queries, SameSite cookies) rather than rolling your own defenses.

Backend and Persistent Data

Must use a persistent database appropriate to your project. Firebase/Firestore is strongly recommended given the course's GCP emphasis and its generous free tier. If your project requires a relational database, use Neon or Supabase (both offer free PostgreSQL tiers). Cloud SQL is discouraged due to GCP credit consumption. All database interactions must go through an ORM or ODM (e.g., Prisma for relational, Firestore SDK for document). Your database choice must be documented and justified in your project writeup. If using Firebase, set up billing alerts to avoid unexpected charges/credit use.

AI

Your web app must integrate AI in a meaningful way (e.g., chatbot, text summarization, recommendation engine). Gemini 2.5 Flash is strongly recommended — it has a free tier  for development use and integrates naturally with the GCP ecosystem. Other providers (OpenAI, Anthropic, Hugging Face) are acceptable but must be justified in your project writeup and you must make sure they do not incur any charges. 
Systems and Deployment

Must be deployed onto Google Kubernetes Engine (GKE) using a minimum of 2 e2-micro nodes and at least 2 pod replicas per Deployment. You must demonstrate self-healing and manual pod scaling in your recorded demo by killing a pod and showing Kubernetes automatically recreate it, and modifying the pod spec down. If you encounter resource constraints, you may upgrade to e2-small with instructor notification.
Deployment must be triggered via a GitHub Actions CI/CD pipeline — no manual kubectl apply. You must include GitHub Actions logs demonstrating build, test, and deploy stages. Firestore is the only Firebase service that should run outside GKE. Alternative deployment platforms require instructor pre-approval and must demonstrate equivalent scalability and fault tolerance.
Working Together

One strategy is to divide your development into phases. Then, assign parts of the spec to each team member in each phase. The phases may be something like: scaffolding, implementation, styling, additional features (e.g  PWA) and deployment.

Suggested Timeline 
(not graded, but strongly recommended)
May 30 — App running locally with core features stubbed. GCP project set up, GitHub repo initialized, GitHub Actions pipeline started.
June 6 — App deployed to GKE, authentication working, database connected, CI/CD pipeline triggering deployments automatically. Do not leave GKE for the last week.
June 10 — First deadline: all code committed, recorded demo submitted.
June 12 — Final deadline: ARCHITECTURE.md, REQUIREMENTS.md, DATABASE.md, README.md, CI/CD logs committed to Github repo and submitted to Gradescope.
Deliverables
Wednesday, Jun 10, 2026 (70 points)

All code must be committed in the class Github including PWA assets, and static assets (images, CSS, JS, HTML) etc. Everything must be packaged in such a way that we can easily clone the project from Github,  build the project (Using npm, or similar with explicit build directions) and deploy the project (Dockerfile). We will provide you with a repo to use.

A screen recording, with audio, walking us through your application. 
You should demonstrate the functionality of your app.
You should also demonstrate certain parts of the spec that are more difficult for us to replicate. These include:
Server-initiated notifications for the PWA
GKE
The self-healing nature of the GKE deployment: Kill a pod, show us a new one is created.
Manual scaling: Show us how you change the pod replica spec and show us what it does to your cluster.
Show us the load balancer IP address either using kubectl or the Cloud console, and then show the app running on that IP address using the ingress, all in a single continuous take with no cuts. This is to verify the app is genuinely running on GKE and not locally.
PWA
How the app functions when offline and how it behaves once Internet is restored (queued database inserts, for example)
Authentication login flow and cookie banner (if applicable)


Friday, Jun 12, 2026: Multiple requirements due (30 points)
Database schema (RDBMS), basic description of data format (non-RDBMS) in a markup file called DATABASE.md in the root of the Github repository
Documentation
(ARCHITECTURE.md) System architecture diagram (what communicates with what? And how?)
Put this in a file called ARCHITECTURE.md. You may include any images from a sub-directory.
(REQUIREMENTS.md) A brief sentence explaining how you met each requirement and how AI was used, if applicable and for what.
Example: We used MongoDB as our database as well as our caching layer, in different collections.
Deviation: The spec says to use Express, but I chose to use Sveltekit which renders Express redundant and we got approval from Prof. Rosario
(logs directory) CI/CD log. You must include GitHub Actions logs showing build, and deploy stages. You don't need to attach all logs, just a log or two showing successful build and deployment.
(README.md) Full documentation in a README.md in your repo that describes how to deploy the app

Everything must be committed and pushed to the repo and submitted to Gradescope.
Tips
Remember that you can use AI to help you write code. This should help speed through the actual development of the app itself which is perhaps the most laborious part of the process if done from scratch, manually. The challenge is coming up with an idea. In terms of workload, the challenge is rightfully on putting together the components and deploying.
Let's Work Together
We expect some bumps along the way. This project is ambitious but ties together the main concepts in the course, and we hope that the mini-projects will provide opportunities to transfer knowledge to the project. Please regularly communicate issues with your TAs or Prof. Rosario so we can make adjustments if necessary. 
