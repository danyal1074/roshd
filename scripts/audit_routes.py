import re
import json

with open('backend/server.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Match route definitions and line numbers
lines = code.split('\n')
routes = []
pattern = re.compile(r'app\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]')

for idx, line in enumerate(lines):
    match = pattern.search(line)
    if match:
        method = match.group(1).upper()
        path = match.group(2)
        routes.append({'line': idx + 1, 'method': method, 'path': path})

print(f"Total endpoints found: {len(routes)}")
for r in routes:
    print(f"Line {r['line']:4d} | {r['method']:6s} {r['path']}")

with open('scripts/routes.json', 'w', encoding='utf-8') as f:
    json.dump(routes, f, indent=2)
