# Security, exam, upload and typography fixes

## Deployment

Before restarting an installation that still uses the old hard-coded admin
password, set `ADMIN_INITIAL_PASSWORD` in the server environment to a unique
password of at least 12 characters. Do not commit the actual value. The same
setting is required for the first boot of an empty database. `ADMIN_NATIONAL_ID`
is optional; the administrator can always sign in with username `admin`.

The bootstrap rotates the old exposed password, revokes previous admin sessions
and requires a password change at login. It preserves existing secure passwords
and disabled status on subsequent restarts. If the exposed password is present
and a replacement is missing, startup fails before the HTTP listener opens.
Remove the initial password setting after setup. Accounts disabled intentionally
must be reactivated through the normal administrative process.

Run the normal frontend production build and deploy its output together with
the backend. The existing `frontend/public/fonts/BYekan.ttf` asset must be copied
with the build. Titles, body text, forms, placeholders and navigation now share
this local font; headings use size and weight rather than a different family.
No Google Fonts request is needed. The font has one regular face; heavier
weights use browser synthesis.

## Behavior

- Manual enrollment waits for student and parent password hashes.
- Exam start and submission verify class, grade and configured start/end times.
  Submission requires a recorded attempt and enforces its duration. Reopening
  the exam resumes the original clock.
- Upload URLs use the actual storage directory. Direct receipt uploads always
  enter protected receipt storage, even without a multipart category.
- Unpaid locked students cannot use educational API endpoints. Authentication,
  tuition receipt submission and profile access remain available. The student
  panel handles lock responses without replacing list data with error objects.
- Authentication accepts only the supplied password; demo password aliases were
  removed.

## Validation

Run `node scripts/test_review_fixes.cjs` with Node 22 or later. It executes the
production handlers against an isolated SQLite database, covering enrollment,
admin lifecycle, exam eligibility/timing/scoring, upload paths and tuition lock.
It substitutes bcrypt only for bootstrap and enrollment tests; it is not an HTTP
integration suite or a bcrypt implementation test.

For the existing HTTP suites, provide `TEST_ADMIN_PASSWORD` for a prepared admin
fixture with its mandatory first-login password change already completed. The
fixture must include the seeded student, teacher and parent accounts.

The review environment's HTTP proxy was unavailable, so dependency installation,
the production Vue build, full HTTP suites and browser visual verification could
not be run here. JavaScript syntax checks and the SQLite regression suite pass.
