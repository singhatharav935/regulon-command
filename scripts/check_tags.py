import re
import sys

path = '/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx'
with open(path, 'r') as f:
    text = f.read()

# A very rudimentary tag stack checker for JSX
stack = []
lines = text.split('\n')
for i, line in enumerate(lines):
    # this regex is basic, finding <tag> and </tag>
    tags = re.findall(r'</?(?:[A-Z][a-zA-Z0-9_]*|div|span|p|h[1-6]|button|a|img|svg|path|br|hr|input|table|thead|tbody|tr|td|th|motion\.div|Card|CardContent|Badge|Button|Input)(?: [^>]*)?>', line)
    for tag in tags:
        if '/>' in tag or '<input' in tag or '<br' in tag or '<hr' in tag or '<img' in tag or '<path' in tag:
            continue
        if '<svg' in tag or '</svg>' in tag:
            continue # ignore svg for simplicity
        if tag.startswith('</'):
            tag_name = tag[2:-1].split(' ')[0]
            if not stack:
                print(f"Line {i+1}: Found closing </{tag_name}> but stack is empty")
            else:
                if stack[-1][0] == tag_name:
                    stack.pop()
                else:
                    print(f"Line {i+1}: Found closing </{tag_name}> but expected </{stack[-1][0]}>")
        else:
            tag_name = tag[1:-1].split(' ')[0]
            if not tag_name: continue
            stack.append((tag_name, i+1))

if stack:
    print("Unclosed tags:", stack)
else:
    print("Tags seem balanced!")
