#!/bin/bash
# Hive smoke test. Usage: scripts/smoke.sh [base-url]   (default http://localhost:3003)
# Exits non-zero on the first failed expectation. Safe to run against production.
BASE="${1:-http://localhost:3003}"; fail=0
check() { local want="$1" label="$2"; shift 2; got=$(curl -s -o /dev/null -m 15 -w "%{http_code}" "$@"); if [ "$got" = "$want" ]; then echo "  ok   $label -> $got"; else echo "  FAIL $label -> $got (want $want)"; fail=1; fi; }
echo "Hive smoke @ $BASE"
check 200 "login page renders"                     "$BASE/login"
check 307 "/admin redirects without a session"     "$BASE/admin"
check 307 "/admin/triage redirects without session" "$BASE/admin/triage"
check 401 "admin proxy refuses anonymous callers"  "$BASE/api/admin/metrics"
check 401 "admin proxy refuses a fake session"     -H "Cookie: next-auth.session-token=garbage" "$BASE/api/admin/metrics"
check 401 "sentry proxy refuses anonymous callers" "$BASE/api/sentry/issues"
check 401 "credit-status refuses anonymous callers" "$BASE/api/credit-status"
check 405 "server-action probe is refused"         -X POST -H "Next-Action: x" -H "Content-Type: multipart/form-data; boundary=x" --data "" "$BASE/login"
check 405 "server-action probe on /admin refused"  -X POST -H "Next-Action: x" -H "Content-Type: text/plain" --data "[]" "$BASE/admin"
check 404 "unknown route is a 404"                 "$BASE/definitely-not-a-page"
[ $fail -eq 0 ] && echo "ALL OK" || { echo "FAILURES"; exit 1; }
